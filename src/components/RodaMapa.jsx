import { SIGNOS } from '../lib/astro';

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
      {/* anel dos signos */}
      <circle cx={CX} cy={CY} r={340} className="roda-linha" />
      <circle cx={CX} cy={CY} r={290} className="roda-linha" />
      {SIGNOS.map((s, i) => {
        const l = linha(290, 340, i * 30, ref);
        const [gx, gy] = ponto(315, i * 30 + 15, ref);
        return (
          <g key={s.nome}>
            <line {...l} className="roda-div" />
            <text x={gx} y={gy} className="roda-signo" textAnchor="middle" dominantBaseline="central">
              {s.simbolo}
            </text>
          </g>
        );
      })}
      {/* anel das casas */}
      <circle cx={CX} cy={CY} r={230} className="roda-linha" />
      {Array.from({ length: 12 }, (_, k) => {
        const c = k + 1;
        const l = linha(230, 290, mapa.cuspides[c], ref);
        const meio = mapa.cuspides[c] + (((mapa.cuspides[(c % 12) + 1] - mapa.cuspides[c] + 360) % 360) / 2);
        const [nx, ny] = ponto(258, meio, ref);
        const ang = mapa.ascendente || c !== 1;
        return (
          <g key={c}>
            <line {...l} className={c % 3 === 1 ? 'roda-cuspide forte' : 'roda-cuspide'} />
            {ang && (
              <text x={nx} y={ny} className="roda-casa" textAnchor="middle" dominantBaseline="central">
                {c}
              </text>
            )}
          </g>
        );
      })}
      {/* aspectos */}
      {linhas.map((a, i) => {
        const [x1, y1] = ponto(150, angPlaneta.get(a.de), ref);
        const [x2, y2] = ponto(150, angPlaneta.get(a.para), ref);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={corAspecto(a)} className="roda-aspecto">
            <title>{`${a.de} ${a.simbolo} ${a.para} (orbe ${a.orbe}°)`}</title>
          </line>
        );
      })}
      <circle cx={CX} cy={CY} r={150} className="roda-linha fina" />
      {/* planetas */}
      {mapa.planetas.map((p) => {
        const [gx, gy] = ponto(192, glifos.get(p.id), ref);
        const t = linha(215, 228, p.longitude, ref);
        return (
          <g key={p.id}>
            <line {...t} className="roda-tick" />
            <text x={gx} y={gy} className="roda-planeta" textAnchor="middle" dominantBaseline="central">
              {p.simbolo}
              {p.retro ? 'ᴿ' : ''}
            </text>
          </g>
        );
      })}
      {/* ângulos */}
      {mapa.ascendente && (
        <g>
          {(() => {
            const [ax, ay] = ponto(258, mapa.ascendente.longitude, ref);
            return (
              <text x={ax} y={ay} className="roda-angulo" textAnchor="middle" dominantBaseline="central">
                ASC
              </text>
            );
          })()}
          {(() => {
            const [mx, my] = ponto(258, mapa.meioCeu.longitude, ref);
            return (
              <text x={mx} y={my} className="roda-angulo" textAnchor="middle" dominantBaseline="central">
                MC
              </text>
            );
          })()}
        </g>
      )}
      {/* centro */}
      <text x={CX} y={CY - 8} className="roda-nome" textAnchor="middle">
        {mapa.nome.length > 26 ? `${mapa.nome.slice(0, 26)}…` : mapa.nome}
      </text>
      <text x={CX} y={CY + 16} className="roda-sub" textAnchor="middle">
        {mapa.dataNascimento} · {mapa.horaNascimento === 'desconhecida' ? 'hora desconhecida' : mapa.horaNascimento}
      </text>
    </svg>
  );
}
