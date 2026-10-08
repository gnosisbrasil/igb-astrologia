const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const EMAIL = 'webmaster@gnosisbrasil.com';

function resumo(endereco, display) {
  if (!endereco) return display.split(',').slice(0, 3).join(',').trim();
  const cidade =
    endereco.city || endereco.town || endereco.village || endereco.municipality || endereco.county || '';
  const estado = endereco.state || '';
  const pais = endereco.country || '';
  return [cidade, estado, pais].filter(Boolean).join(', ') || display;
}

/** Busca endereços no OpenStreetMap (Nominatim). Respeite 1 req/s (debounce na UI). */
export async function buscarLocais(q, signal) {
  const query = (q || '').trim();
  if (query.length < 3) return [];
  const url =
    `${NOMINATIM}?format=jsonv2&limit=6&addressdetails=1&accept-language=pt-BR` +
    `&email=${encodeURIComponent(EMAIL)}&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('Não foi possível buscar o local. Tente novamente.');
  const j = await r.json();
  return j.map((x) => ({
    nome: x.display_name,
    resumo: resumo(x.address, x.display_name),
    lat: Number.parseFloat(x.lat),
    lon: Number.parseFloat(x.lon),
  }));
}
