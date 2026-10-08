import { SIGNOS, formatoGrau } from '../lib/astro';

const CX = 360;
const CY = 360;
const D2R = Math.PI / 180;

/** Longitude eclíptica → ponto SVG (referência fixa à esquerda, anti-horário). */
function ponto(r, lon, ref) {
  const a = (180 + (lon - ref)) * D2R;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function linha(r1, r2, lon, ref) {
  const [x1, y1] = ponto(r1, lon, ref);
  const [x2, y2] = ponto(r2, lon, ref);
  return { x1, y1, x2, y2 };
}

/** Grau/minuto dentro do signo: 22°37′ */
function grauCurto(lon) {
  const n = ((lon % 360) + 360) % 360;
  const resto = n % 30;
  const g = Math.floor(resto);
  const m = Math.floor((resto - g) * 60);
  return `${g}°${String(m).padStart(2, '0')}′`;
}

/** Afasta glifos vizinhos para não sobrepor (graus). */
function espalhar(planetas, gap = 8) {
  const ord = [...planetas].sort((a, b) => a.longitude - b.longitude);
  const pos = ord.map((p) => p.longitude);
  for (let k = 0; k < 3; k++) {
    for (let i = 1; i < pos.length; i++) {
      if (pos[i] - pos[i - 1] < gap) pos[i] = pos[i - 1] + gap;
    }
  }
  const mapa = new Map();
  ord.forEach((p, i) => mapa.set(p.id, pos[i]));
  return mapa;
}

const NOMES_PLANETAS = new Set([
  'Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão',
]);

const ANGULOS = { 1: 'ASC', 4: 'IC', 7: 'DSC', 10: 'MC' };

function corAspecto(a) {
  if (a.aspecto === 'Conjunção') return '#ecc805';
  return a.harmonico ? '#7dd3fc' : '#f87171';
}

export default function RodaMapa({ mapa }) {
  const ref = mapa.ascendente ? mapa.ascendente.longitude : mapa.cuspides[1];
  const glifos = espalhar(mapa.planetas);
  const angPlaneta = new Map(mapa.planetas.map((p) => [p.nome, p.longitude]));
  const linhas = mapa.aspectos.filter((a) => NOMES_PLANETAS.has(a.de) && NOMES_PLANETAS.has(a.para));

  return (
    <svg viewBox="0 0 720 720" className="roda" role="img" aria-label={`Roda do mapa astral de ${mapa.nome}`}>
      <circle cx={CX} cy={CY} r={340} className="roda-fundo" />
      {/* graduação de graus */}
      {SIGNOS.map((s, i) => (
        <g key={`tick-${s.nome}`}>
          {[0, 5, 10, 15, 20, 25].map((d) => {
            const l = linha(d === 0 ? 322 : 330, 340, i * 30 + d, ref);
            return <line key={d} {...l} className={d === 0 ? 'roda-div' : 'roda-tick5'} />;
          })}
        </g>
      ))}
      {/* anel dos signos */}
      <circle cx={CX} cy={CY} r={340} className="roda-linha" />
      <circle cx={CX} cy={CY} r={290} className="roda-linha" />
      {SIGNOS.map((s, i) => {
        const [gx, gy] = ponto(312, i * 30 + 15, ref);
        return (
          <text key={s.nome} x={gx} y={gy} className="roda-signo" textAnchor="middle" dominantBaseline="central">
            {s.simbolo}
          </text>
        );
      })}
      {/* anel das casas */}
      <circle cx={CX} cy={CY} r={290} className="roda-linha" />
      <circle cx={CX} cy={CY} r={228} className="roda-linha" />
      {Array.from({ length: 12 }, (_, k) => {
        const c = k + 1;
        const l = linha(228, 290, mapa.cuspides[c], ref);
        const largura = (mapa.cuspides[(c % 12) + 1] - mapa.cuspides[c] + 360) % 360;
        const [nx, ny] = ponto(244, mapa.cuspides[c] + largura / 2, ref);
        const [cx, cy] = ponto(278, mapa.cuspides[c], ref);
        return (
          <g key={c}>
            <line {...l} className={c % 3 === 1 ? 'roda-cuspide forte' : 'roda-cuspide'} />
            <text x={nx} y={ny} className="roda-casa" textAnchor="middle" dominantBaseline="central">
              {c}
            </text>
            <text x={cx} y={cy} className="roda-grau" textAnchor="middle" dominantBaseline="central">
              <title>{`Cúspide da casa ${c}: ${formatoGrau(mapa.cuspides[c])}`}</title>
              {grauCurto(mapa.cuspides[c])}
            </text>
          </g>
        );
      })}
      {/* ângulos */}
      {mapa.ascendente &&
        [1, 4, 7, 10].map((c) => {
          const [ax, ay] = ponto(261, mapa.cuspides[c], ref);
          return (
            <text key={c} x={ax} y={ay} className="roda-angulo" textAnchor="middle" dominantBaseline="central">
              <title>{`${ANGULOS[c]}: ${formatoGrau(mapa.cuspides[c])}`}</title>
              {ANGULOS[c]}
            </text>
          );
        })}
      {/* aspectos */}
      {linhas.map((a, i) => {
        const [x1, y1] = ponto(148, angPlaneta.get(a.de), ref);
        const [x2, y2] = ponto(148, angPlaneta.get(a.para), ref);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={corAspecto(a)} className="roda-aspecto">
            <title>{`${a.de} ${a.simbolo} ${a.para} (orbe ${a.orbe}°)`}</title>
          </line>
        );
      })}
      <circle cx={CX} cy={CY} r={148} className="roda-linha fina" />
      {/* planetas */}
      {mapa.planetas.map((p) => {
        const gLon = glifos.get(p.id);
        const [gx, gy] = ponto(190, gLon, ref);
        const [tx, ty] = ponto(168, gLon, ref);
        const t = linha(212, 226, p.longitude, ref);
        return (
          <g key={p.id}>
            <line {...t} className="roda-tick" />
            <text x={gx} y={gy} className="roda-planeta" textAnchor="middle" dominantBaseline="central">
              <title>{`${p.nome}: ${formatoGrau(p.longitude)} — Casa ${p.casa}${p.retro ? ' (retrógrado)' : ''}`}</title>
              {p.simbolo}
              {p.retro ? 'ᴿ' : ''}
            </text>
            <text x={tx} y={ty} className="roda-pgrau" textAnchor="middle" dominantBaseline="central">
              {grauCurto(p.longitude)}
            </text>
          </g>
        );
      })}
      {/* centro */}
      <text x={CX} y={CY - 20} className="roda-nome" textAnchor="middle">
        {mapa.nome.length > 24 ? `${mapa.nome.slice(0, 24)}…` : mapa.nome}
      </text>
      <text x={CX} y={CY + 4} className="roda-sub" textAnchor="middle">
        {mapa.dataNascimento} · {mapa.horaNascimento === 'desconhecida' ? 'hora desconhecida' : mapa.horaNascimento}
      </text>
      <text x={CX} y={CY + 24} className="roda-sub pequena" textAnchor="middle">
        {(mapa.local || '').length > 36 ? `${mapa.local.slice(0, 36)}…` : mapa.local}
      </text>
    </svg>
  );
}
