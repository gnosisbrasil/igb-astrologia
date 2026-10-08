import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';
import tzLookup from 'tz-lookup';

export const BUSCA_URL = 'https://busca.gnosisbrasil.com/?search=';

export const SIGNOS = [
  { nome: 'Áries', simbolo: '♈\uFE0E', elemento: 'Fogo', qualidade: 'Cardinal', regente: 'Marte' },
  { nome: 'Touro', simbolo: '♉\uFE0E', elemento: 'Terra', qualidade: 'Fixo', regente: 'Vênus' },
  { nome: 'Gêmeos', simbolo: '♊\uFE0E', elemento: 'Ar', qualidade: 'Mutável', regente: 'Mercúrio' },
  { nome: 'Câncer', simbolo: '♋\uFE0E', elemento: 'Água', qualidade: 'Cardinal', regente: 'Lua' },
  { nome: 'Leão', simbolo: '♌\uFE0E', elemento: 'Fogo', qualidade: 'Fixo', regente: 'Sol' },
  { nome: 'Virgem', simbolo: '♍\uFE0E', elemento: 'Terra', qualidade: 'Mutável', regente: 'Mercúrio' },
  { nome: 'Libra', simbolo: '♎\uFE0E', elemento: 'Ar', qualidade: 'Cardinal', regente: 'Vênus' },
  { nome: 'Escorpião', simbolo: '♏\uFE0E', elemento: 'Água', qualidade: 'Fixo', regente: 'Plutão' },
  { nome: 'Sagitário', simbolo: '♐\uFE0E', elemento: 'Fogo', qualidade: 'Mutável', regente: 'Júpiter' },
  { nome: 'Capricórnio', simbolo: '♑\uFE0E', elemento: 'Terra', qualidade: 'Cardinal', regente: 'Saturno' },
  { nome: 'Aquário', simbolo: '♒\uFE0E', elemento: 'Ar', qualidade: 'Fixo', regente: 'Urano' },
  { nome: 'Peixes', simbolo: '♓\uFE0E', elemento: 'Água', qualidade: 'Mutável', regente: 'Netuno' },
];

export const PLANETAS = [
  { id: 'Sun', nome: 'Sol', simbolo: '☉\uFE0E' },
  { id: 'Moon', nome: 'Lua', simbolo: '☽\uFE0E' },
  { id: 'Mercury', nome: 'Mercúrio', simbolo: '☿\uFE0E' },
  { id: 'Venus', nome: 'Vênus', simbolo: '♀\uFE0E' },
  { id: 'Mars', nome: 'Marte', simbolo: '♂\uFE0E' },
  { id: 'Jupiter', nome: 'Júpiter', simbolo: '♃\uFE0E' },
  { id: 'Saturn', nome: 'Saturno', simbolo: '♄\uFE0E' },
  { id: 'Uranus', nome: 'Urano', simbolo: '♅\uFE0E' },
  { id: 'Neptune', nome: 'Netuno', simbolo: '♆\uFE0E' },
  { id: 'Pluto', nome: 'Plutão', simbolo: '♇\uFE0E' },
];

export const ASPECTOS_DEF = [
  { nome: 'Conjunção', simbolo: '☌\uFE0E', angulo: 0, orbe: 8 },
  { nome: 'Sextil', simbolo: '⚹\uFE0E', angulo: 60, orbe: 4 },
  { nome: 'Quadratura', simbolo: '□\uFE0E', angulo: 90, orbe: 6 },
  { nome: 'Trígono', simbolo: '△\uFE0E', angulo: 120, orbe: 6 },
  { nome: 'Oposição', simbolo: '☍\uFE0E', angulo: 180, orbe: 8 },
];

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm360 = (d) => ((d % 360) + 360) % 360;
/** Diferença assinada a−b no intervalo (−180, 180]. */
const dif = (a, b) => {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
};

export function aplicarMascaraData(v) {
  const n = (v || '').replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

export function aplicarMascaraHora(v) {
  const n = (v || '').replace(/\D/g, '').slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}:${n.slice(2)}`;
}

export function validarDataBR(dataBR) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dataBR || '').trim());
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (ano < 1900 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const dt = new Date(Date.UTC(ano, mes - 1, dia));
  if (dt.getUTCFullYear() !== ano || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== dia) return null;
  return { dia, mes, ano };
}

export function validarHora(hora) {
  const m = /^(\d{2}):(\d{2})$/.exec((hora || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return { hora: h, minuto: min };
}

/** Obliquidade média da eclíptica (graus) — suficiente para mapa natal. */
function obliquidade(dataJS) {
  const t = (dataJS.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  return 23.4392911 - 0.0130042 * t;
}

/** Hora local de nascimento → instante UTC (com DST histórica via Intl). */
export function localParaUTC({ ano, mes, dia, hora, minuto }, lat, lon) {
  let fuso = 'America/Sao_Paulo';
  try {
    fuso = tzLookup(lat, lon);
  } catch {
    /* mantém padrão */
  }
  const local = DateTime.fromObject(
    { year: ano, month: mes, day: dia, hour: hora, minute: minuto },
    { zone: fuso }
  );
  if (!local.isValid) throw new Error('Data ou hora de nascimento inválida.');
  return { utc: local.toUTC().toJSDate(), fuso, offsetMin: local.offset };
}

function longitudeEcliptica(corpo, dataJS) {
  const vec = Astronomy.GeoVector(corpo, dataJS, true);
  return norm360(Astronomy.Ecliptic(vec).elon);
}

/** Ponto da eclíptica com a ascensão reta dada (graus → longitude). */
function raParaLambda(raDeg, eps) {
  const ra = raDeg * D2R;
  const e = eps * D2R;
  return norm360((Math.atan2(Math.sin(ra) * Math.cos(e), Math.cos(ra)) * R2D));
}

function declinacao(lambda, eps) {
  return Math.asin(Math.sin(lambda * D2R) * Math.sin(eps * D2R)) * R2D;
}

function arcoSemiDiurno(delta, lat) {
  const c = -Math.tan(lat * D2R) * Math.tan(delta * D2R);
  if (c < -1 || c > 1) return null;
  return Math.acos(c) * R2D;
}

export function ascendente(ramc, lat, eps) {
  const t = ramc * D2R;
  const e = eps * D2R;
  const f = lat * D2R;
  const y = Math.cos(t);
  const x = -(Math.sin(t) * Math.cos(e) + Math.tan(f) * Math.sin(e));
  return norm360(Math.atan2(y, x) * R2D);
}

/** Cúspides Placidus 11, 12, 2, 3 por ponto fixo; null em latitude extrema. */
function cuspsPlacidus(ramc, lat, eps) {
  const defs = [
    { casa: 11, f: 1 / 3, acima: true },
    { casa: 12, f: 2 / 3, acima: true },
    { casa: 2, f: 2 / 3, acima: false },
    { casa: 3, f: 1 / 3, acima: false },
  ];
  const base = { 11: 30, 12: 60, 2: 120, 3: 150 };
  const out = {};
  for (const { casa, f, acima } of defs) {
    let lambda = raParaLambda(ramc + base[casa], eps);
    for (let i = 0; i < 12; i++) {
      const sa = arcoSemiDiurno(declinacao(lambda, eps), lat);
      if (sa === null) return null;
      const raAlvo = acima ? ramc + f * sa : ramc + 180 - f * sa;
      lambda = raParaLambda(raAlvo, eps);
    }
    out[casa] = lambda;
  }
  return out;
}

export function signoDe(longitude) {
  const i = Math.floor(norm360(longitude) / 30) % 12;
  const resto = norm360(longitude) - i * 30;
  const grau = Math.floor(resto);
  const minuto = Math.floor((resto - grau) * 60);
  return { indice: i, ...SIGNOS[i], grau, minuto };
}

export function formatoGrau(longitude) {
  const s = signoDe(longitude);
  const min = String(s.minuto).padStart(2, '0');
  return `${s.grau}°${min}′ ${s.simbolo} ${s.nome}`;
}

function casaDe(longitude, cuspides) {
  const lon = norm360(longitude);
  for (let c = 1; c <= 12; c++) {
    const ini = norm360(cuspides[c]);
    const fim = norm360(cuspides[(c % 12) + 1]);
    if (ini < fim) {
      if (lon >= ini && lon < fim) return c;
    } else if (lon >= ini || lon < fim) {
      return c;
    }
  }
  return 1;
}

function detectarAspectos(pontos) {
  const asp = [];
  for (let i = 0; i < pontos.length; i++) {
    for (let j = i + 1; j < pontos.length; j++) {
      const a = pontos[i];
      const b = pontos[j];
      const sep = Math.abs(dif(a.longitude, b.longitude));
      for (const def of ASPECTOS_DEF) {
        const orbeMax = def.orbe + (a.luminar || b.luminar ? 2 : 0);
        const orbe = Math.abs(sep - def.angulo);
        if (orbe <= orbeMax) {
          const harmonico = def.nome === 'Trígono' || def.nome === 'Sextil';
          asp.push({
            de: a.nome,
            deSimbolo: a.simbolo,
            para: b.nome,
            paraSimbolo: b.simbolo,
            aspecto: def.nome,
            simbolo: def.simbolo,
            orbe: orbe.toFixed(1),
            harmonico,
          });
          break;
        }
      }
    }
  }
  return asp.sort((x, y) => Number(x.orbe) - Number(y.orbe));
}

export function calcularMapa({ nome, dataBR, hora, horaDesconhecida, local }) {
  const d = validarDataBR(dataBR);
  if (!d) throw new Error('Informe uma data válida no formato dd/mm/aaaa.');
  let h = validarHora(hora);
  if (!h) {
    if (!horaDesconhecida) throw new Error('Informe uma hora válida no formato hh:mm.');
    h = { hora: 12, minuto: 0 };
  }
  const lat = Number(local.lat);
  const lon = Number(local.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Escolha o local de nascimento na lista.');

  const { utc, fuso, offsetMin } = localParaUTC(
    { ano: d.ano, mes: d.mes, dia: d.dia, hora: h.hora, minuto: h.minuto },
    lat,
    lon
  );
  const depois = new Date(utc.getTime() + 12 * 3600 * 1000);

  const planetas = PLANETAS.map((p) => {
    const longitude = longitudeEcliptica(p.id, utc);
    const lonDepois = longitudeEcliptica(p.id, depois);
    const retro = p.id !== 'Sun' && p.id !== 'Moon' && dif(lonDepois, longitude) < 0;
    return { ...p, longitude, signo: signoDe(longitude), retro, luminar: p.id === 'Sun' || p.id === 'Moon' };
  });

  const eps = obliquidade(utc);
  const ramc = norm360(Astronomy.SiderealTime(utc) * 15 + lon);
  const mcLon = raParaLambda(ramc, eps);
  const ascLon = horaDesconhecida ? null : ascendente(ramc, lat, eps);

  let cuspides = null;
  let sistemaCasas = 'Signos inteiros';
  if (!horaDesconhecida) {
    const plac = cuspsPlacidus(ramc, lat, eps);
    if (plac) {
      cuspides = {
        1: ascLon,
        2: plac[2],
        3: plac[3],
        4: norm360(mcLon + 180),
        5: norm360(plac[11] + 180),
        6: norm360(plac[12] + 180),
        7: norm360(ascLon + 180),
        8: norm360(plac[2] + 180),
        9: norm360(plac[3] + 180),
        10: mcLon,
        11: plac[11],
        12: plac[12],
      };
      sistemaCasas = 'Placidus';
    }
  }
  if (!cuspides) {
    // Reserva: signos inteiros a partir do Sol (hora desconhecida) ou do Asc.
    const ref = horaDesconhecida ? planetas[0].longitude : ascLon;
    const ini = Math.floor(norm360(ref) / 30) * 30;
    cuspides = {};
    for (let c = 1; c <= 12; c++) cuspides[c] = norm360(ini + (c - 1) * 30);
  }

  for (const p of planetas) p.casa = casaDe(p.longitude, cuspides);

  const pontos = planetas.map((p) => ({ nome: p.nome, simbolo: p.simbolo, longitude: p.longitude, luminar: p.luminar }));
  if (!horaDesconhecida) {
    pontos.push({ nome: 'Ascendente', simbolo: 'Asc', longitude: ascLon, luminar: false });
    pontos.push({ nome: 'Meio do Céu', simbolo: 'MC', longitude: mcLon, luminar: false });
  }
  const aspectos = detectarAspectos(pontos);

  return {
    nome: nome.trim(),
    dataNascimento: dataBR.trim(),
    horaNascimento: horaDesconhecida ? 'desconhecida' : hora.trim(),
    horaDesconhecida: Boolean(horaDesconhecida),
    local: local.resumo || local.nome,
    latitude: lat,
    longitude: lon,
    fuso,
    utcISO: utc.toISOString(),
    offsetHoras: (offsetMin / 60).toFixed(1).replace('.', ','),
    planetas,
    ascendente: horaDesconhecida ? null : { longitude: ascLon, signo: signoDe(ascLon) },
    meioCeu: horaDesconhecida ? null : { longitude: mcLon, signo: signoDe(mcLon) },
    cuspides,
    sistemaCasas,
    aspectos,
  };
}

export function linkWhatsApp(mapa, url) {
  const sol = mapa.planetas[0];
  const lua = mapa.planetas[1];
  const linhas = [
    `Mapa astral de ${mapa.nome}`,
    `Sol em ${sol.signo.nome} · Lua em ${lua.signo.nome}${mapa.ascendente ? ` · Ascendente em ${mapa.ascendente.signo.nome}` : ''}`,
    `Nascido em ${mapa.dataNascimento} — ${mapa.local}`,
    url,
  ];
  return `https://wa.me/?text=${encodeURIComponent(linhas.join('\n'))}`;
}
