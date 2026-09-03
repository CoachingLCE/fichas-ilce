import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Vercel guarda los saltos de línea como \n literal en la env var
      private_key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

// Cliente autenticado cacheado mientras la función serverless está "tibia" (evita reautenticar
// en cada lectura). Con límite de 10s para no quedar colgado si Google no responde.
let clientePromise = null;
async function getSheetsClient() {
  if (!clientePromise) {
    clientePromise = (async () => {
      const auth = getAuth();
      const client = await Promise.race([
        auth.getClient(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout autenticando con Google (10s)')), 10000))
      ]);
      return google.sheets({ version: 'v4', auth: client });
    })().catch((err) => { clientePromise = null; throw err; });
  }
  return clientePromise;
}

// Sheets interpreta valores que arrancan con +, - o = como fórmulas. Un WhatsApp "+549..." rompe.
// Se antepone un apóstrofe para forzar texto (Sheets lo usa como señal, no lo guarda).
function protegerValor(v) {
  if (typeof v === 'string' && /^[+\-=]/.test(v)) return `'${v}`;
  return v;
}

function conTimeout(promesa, segundos, etiqueta) {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout (${segundos}s) esperando a Google Sheets: ${etiqueta}`)), segundos * 1000))
  ]);
}

function columnaExcel(indice) {
  let letras = '', n = indice + 1;
  while (n > 0) { const r = (n - 1) % 26; letras = String.fromCharCode(65 + r) + letras; n = Math.floor((n - 1) / 26); }
  return letras;
}

// ---- Cache de lectura en memoria (5s), invalidado al escribir esa pestaña. Mitiga la cuota de Sheets. ----
const cache = new Map(); // tab -> { t, data }
const CACHE_MS = 5000;
function invalidar(tab) { cache.delete(tab); }

// Lee una pestaña como array de objetos usando la primera fila como headers.
export async function readSheet(tabName, { noCache = false } = {}) {
  const hit = cache.get(tabName);
  if (!noCache && hit && Date.now() - hit.t < CACHE_MS) return hit.data;

  const sheets = await getSheetsClient();
  const res = await conTimeout(
    sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: tabName }),
    20, `leer ${tabName}`
  );
  const rows = res.data.values || [];
  if (rows.length === 0) { cache.set(tabName, { t: Date.now(), data: [] }); return []; }
  const headers = rows[0].map((h) => (h || '').trim());
  const data = rows.slice(1).map((row, idx) => {
    const obj = { _rowIndex: idx + 2 };
    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj;
  });
  cache.set(tabName, { t: Date.now(), data });
  return data;
}

// Devuelve solo la fila de encabezados (o [] si la pestaña está vacía).
export async function readHeaders(tabName) {
  const sheets = await getSheetsClient();
  const res = await conTimeout(
    sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${tabName}!1:1` }),
    20, `leer headers de ${tabName}`
  );
  return (res.data.values?.[0] || []).map((h) => (h || '').trim());
}

export async function appendRow(tabName, values) {
  const sheets = await getSheetsClient();
  await conTimeout(
    sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: tabName, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values.map(protegerValor)] }
    }), 20, `agregar fila en ${tabName}`
  );
  invalidar(tabName);
}

export async function updateRow(tabName, rowIndex, values, startCol = 'A') {
  const sheets = await getSheetsClient();
  const inicio = startCol.charCodeAt(0) - 65;
  const endCol = columnaExcel(inicio + values.length - 1);
  await conTimeout(
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID, range: `${tabName}!${startCol}${rowIndex}:${endCol}${rowIndex}`,
      valueInputOption: 'USER_ENTERED', requestBody: { values: [values.map(protegerValor)] }
    }), 20, `actualizar fila en ${tabName}`
  );
  invalidar(tabName);
}

// Escribe/actualiza la fila 1 (encabezados) de una pestaña.
export async function setHeaders(tabName, headers) {
  const sheets = await getSheetsClient();
  const endCol = columnaExcel(headers.length - 1);
  await conTimeout(
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID, range: `${tabName}!A1:${endCol}1`,
      valueInputOption: 'RAW', requestBody: { values: [headers] }
    }), 20, `escribir headers de ${tabName}`
  );
  invalidar(tabName);
}
