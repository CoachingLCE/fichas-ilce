import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const out = {};
  let ok = true;
  for (const t of Object.values(TABS)) {
    try {
      const filas = await readSheet(t, { noCache: true });
      out[t] = { ok: true, filas: filas.length };
    } catch (e) {
      ok = false;
      out[t] = { ok: false, error: e.message };
    }
  }
  return NextResponse.json({ ok, sheetId: (process.env.GOOGLE_SHEET_ID || '').slice(0, 6) + '…', tabs: out });
}
