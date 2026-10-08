# IGB Astrologia — Mapa Astral

Frontend estático (React + Vite) do mapa natal do Instituto Gnosis Brasil.
Sem backend: todo o cálculo roda no navegador.

## Como funciona

- **Posições planetárias**: efeméride real via `astronomy-engine` (Sol, Lua, Mercúrio–Plutão), em zodíaco tropical, com detecção de retrogradação.
- **Ascendente / MC / casas**: a partir da hora e das coordenadas; casas Placidus, com reserva para signos inteiros (hora desconhecida ou latitude extrema).
- **Fuso horário**: `tz-lookup` (coordenada → zona IANA) + `luxon` (hora local → UTC, com DST histórica).
- **Local de nascimento**: autocomplete de endereços no OpenStreetMap (Nominatim, com debounce e crédito OSM).
- **Roda do mapa**: SVG gerado no cliente (signos, cúspides, planetas, aspectos).

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes de cálculo (node:test)
npm run build    # gera dist/
npm run preview  # serve o build em http://localhost:4173
```

## Arte

- `public/astro-bg.webp` — Hemisphaerium Coeli Boreale, Atlas Coelestis de Johann Gabriel Doppelmayr, 1742 (domínio público, via Wikimedia Commons).
