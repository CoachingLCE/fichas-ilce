// Pie de las pantallas finales: lo usan las actividades (práctica, normal y "ya completada") y los formularios, para que digan SIEMPRE lo mismo
// (pedido de Diego: "Volver al campus", "Leer una nota en el blog" y los íconos de las redes).
// Íconos de redes en línea (trazo simple, sin reproducir el isotipo de marca de cada red)
// para el pie "AL FINALIZAR SIEMPRE" que pidió Diego.
function IconInstagram() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>);
}
function IconWhatsapp() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.3 19L4 20Z" /><path d="M8.5 9.3c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5s.7 1.6.7 1.8-.1.3-.2.4l-.4.4c-.1.2-.3.3-.1.6.2.4.8 1.2 1.6 1.9.9.8 1.6 1.1 1.9 1.2.3.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.7c.2.1.4.2.4.4 0 .6-.2 1.3-.6 1.6-.4.3-.9.6-1.6.6-1 0-2.5-.4-4.2-1.9-1.9-1.7-2.9-3.3-3.1-3.7-.2-.4-.9-1.4-.9-2.5 0-.6.2-1.1.4-1.4Z" fill="currentColor" stroke="none" /></svg>);
}
function IconYoutube() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10.5 9.3v5.4l4.6-2.7-4.6-2.7Z" fill="currentColor" stroke="none" /></svg>);
}

export const URL_CAMPUS = 'https://campus.institutoilce.com/';
export const URL_BLOG = 'https://www.coachingeducativolider.com/blog';
const I_CAMPUS = '', I_BLOG = ''; // glifos de la fuente de íconos de la app

// Pie que se muestra en CUALQUIER pantalla final (actividad con feedback inmediato, actividad normal y "ya completada"): volver al campus, una
// invitación a leer una nota del blog y las redes de la comunidad.
export function PieFinal() {
  return (
    <div className="quiz-postfoot">
      <a className="quiz-postlink" href={URL_CAMPUS} target="_blank" rel="noopener noreferrer">{I_CAMPUS} Volver al campus</a>
      <a className="quiz-postlink quiz-postlink-sec" href={URL_BLOG} target="_blank" rel="noopener noreferrer">{I_BLOG} Leer una nota en el blog</a>
      <div className="quiz-social">
        <a href="https://www.instagram.com/institutoilce/" target="_blank" rel="noopener noreferrer" title="Instagram" className="quiz-social-btn"><IconInstagram /></a>
        <a href="https://www.whatsapp.com/channel/0029VaBfdccGOj9tAv5s1A0G" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="quiz-social-btn"><IconWhatsapp /></a>
        <a href="https://www.youtube.com/channel/UCORUTxo5fMucj3gKqyyqoAQ" target="_blank" rel="noopener noreferrer" title="YouTube" className="quiz-social-btn"><IconYoutube /></a>
      </div>
    </div>
  );
}
