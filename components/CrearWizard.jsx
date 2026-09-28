'use client';
import { useState } from 'react';
import { CURSOS } from '../lib/constants';
import { colorCurso } from '../lib/constants';

// Wizard de "+ Crear" (estilo listadopresentismo): primero elegís QUÉ crear, después el curso,
// después los parámetros según el tipo (clase + cantidad de preguntas para actividades,
// cantidad de preguntas para formularios), y recién ahí pasás al editor con todo pre-armado.
const TIPOS = [
  { key: 'inscripcion', icono: '📋', label: 'Ficha de inscripción', desc: 'La página pública donde se anotan los estudiantes de un curso.' },
  { key: 'actividad', icono: '📝', label: 'Actividad', desc: 'Un postwork con preguntas (se autocorrige y da puntaje).' },
  { key: 'formulario', icono: '🗒️', label: 'Formulario', desc: 'Una encuesta o formulario abierto (sin puntaje).' }
];

export default function CrearWizard({ onCerrar, onCrearActividad, onCrearFormulario, onCrearInscripcion }) {
  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState(null);
  const [curso, setCurso] = useState(CURSOS[0].nombre);
  const [clase, setClase] = useState('');
  const [cantPreg, setCantPreg] = useState(5);

  const tipoInfo = TIPOS.find((t) => t.key === tipo);

  function elegirTipo(k) {
    setTipo(k);
    setPaso(1);
  }

  function finalizar() {
    const n = Math.max(1, Math.min(50, parseInt(cantPreg, 10) || 1));
    if (tipo === 'actividad') onCrearActividad({ curso, clase: clase.trim(), cantidadPreguntas: n });
    else if (tipo === 'formulario') onCrearFormulario({ curso, cantidadPreguntas: n });
    else if (tipo === 'inscripcion') onCrearInscripcion({ curso });
  }

  return (
    <div className="cw-overlay" onClick={onCerrar}>
      <div className="cw-card" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado con pasos */}
        <div className="cw-head">
          <div className="cw-title">{paso === 0 ? '¿Qué querés crear?' : tipoInfo?.label}</div>
          <div className="cw-steps">
            <span className={'cw-dot' + (paso >= 0 ? ' on' : '')} />
            <span className={'cw-dot' + (paso >= 1 ? ' on' : '')} />
            <span className={'cw-dot' + (paso >= 2 ? ' on' : '')} />
          </div>
        </div>

        {/* Paso 0 — tipo */}
        {paso === 0 && (
          <div className="cw-tipos">
            {TIPOS.map((t) => (
              <button key={t.key} className="cw-tipo" onClick={() => elegirTipo(t.key)}>
                <span className="cw-tipo-ico">{t.icono}</span>
                <span className="cw-tipo-txt">
                  <b>{t.label}</b>
                  <small>{t.desc}</small>
                </span>
                <span className="cw-tipo-arrow">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Paso 1 — curso */}
        {paso === 1 && (
          <div className="cw-body">
            <label className="cw-label">Curso / programa</label>
            <select className="fsel" style={{ width: '100%' }} value={curso} onChange={(e) => setCurso(e.target.value)}>
              {CURSOS.map((c) => <option key={c.slug} value={c.nombre}>{c.nombre}</option>)}
            </select>
            <div className="cw-preview">
              <span className="cw-preview-dot" style={{ background: colorCurso(curso) }} />
              <span>{tipoInfo?.label} · <b style={{ color: colorCurso(curso) }}>{curso}</b></span>
            </div>
          </div>
        )}

        {/* Paso 2 — parámetros según el tipo */}
        {paso === 2 && (
          <div className="cw-body">
            {tipo === 'actividad' && (
              <>
                <label className="cw-label">Clase (opcional)</label>
                <input className="ctrl" style={{ width: '100%' }} value={clase} onChange={(e) => setClase(e.target.value)} placeholder="Ej: 14" />
                <label className="cw-label" style={{ marginTop: 14 }}>Cantidad de preguntas</label>
                <input className="ctrl" style={{ width: '100%' }} type="number" min="1" max="50" value={cantPreg} onChange={(e) => setCantPreg(e.target.value)} />
                <p className="cw-hint">Se van a crear {Math.max(1, Math.min(50, parseInt(cantPreg, 10) || 1))} preguntas en blanco para que las completes en el editor.</p>
              </>
            )}
            {tipo === 'formulario' && (
              <>
                <label className="cw-label">Cantidad de preguntas</label>
                <input className="ctrl" style={{ width: '100%' }} type="number" min="1" max="50" value={cantPreg} onChange={(e) => setCantPreg(e.target.value)} />
                <p className="cw-hint">Se van a crear {Math.max(1, Math.min(50, parseInt(cantPreg, 10) || 1))} campos en blanco para que los completes en el editor.</p>
              </>
            )}
            {tipo === 'inscripcion' && (
              <div className="cw-preview" style={{ marginTop: 0 }}>
                <span className="cw-preview-dot" style={{ background: colorCurso(curso) }} />
                <span>Vas a abrir el editor de la ficha de <b style={{ color: colorCurso(curso) }}>{curso}</b>.</span>
              </div>
            )}
          </div>
        )}

        {/* Pie con navegación */}
        <div className="cw-foot">
          {paso > 0
            ? <button className="cw-btn" onClick={() => setPaso(paso - 1)}>← Atrás</button>
            : <button className="cw-btn" onClick={onCerrar}>Cancelar</button>}
          {paso === 1 && <button className="cw-btn cw-btn-primary" onClick={() => setPaso(2)}>Siguiente →</button>}
          {paso === 2 && <button className="cw-btn cw-btn-primary" onClick={finalizar}>Crear y continuar →</button>}
        </div>
      </div>
    </div>
  );
}
