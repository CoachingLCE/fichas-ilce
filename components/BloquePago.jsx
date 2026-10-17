'use client';

// Bloque "Asegurá tu lugar" de la pantalla final de la ficha. `pago` viene de /api/inscripcion (ver lib/pagos.js): { botones: [{ clave, titulo, link }] }.
// Solo botones, sin ningún valor (pedido de Diego: los valores ya se informaron en otro momento). El tono es de invitación, no de apuro: el pago es opcional y se avisa que se verifique el monto antes de abonar.
const ICONOS = {
  contado: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6.5 15h4" /></svg>,
  debito: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 013-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 01-3 3H3" /></svg>,
  paypal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19" /></svg>
};

export default function BloquePago({ pago }) {
  if (!pago || !Array.isArray(pago.botones) || pago.botones.length === 0) return null;
  return (
    <div className="pago" data-bloque="pago">
      <p className="pago-tit">Si querés, podés abonar ahora</p>
      <p className="pago-sub">Es opcional: si ya tenés todo resuelto, podés dejar confirmada tu inscripción pagando tu 1ª cuota. Si todavía tenés consultas, escribinos primero y lo vemos juntos.</p>
      {pago.botones.map((b, i) => (
        <a key={b.clave} className={'pay-btn' + (i === 0 ? ' principal' : '')} href={b.link} target="_blank" rel="noopener noreferrer" data-pago={b.clave}>
          <span className="pay-ico">{ICONOS[b.clave]}</span>
          <span className="pay-txt"><span>{b.titulo}</span></span>
        </a>
      ))}
      <p className="pago-aviso">Antes de abonar, verificá el monto que te informamos.</p>
    </div>
  );
}
