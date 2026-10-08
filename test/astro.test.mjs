import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularMapa } from '../src/lib/astro.js';

const SP = { resumo: 'São Paulo, SP, Brasil', lat: -23.5505, lon: -46.6333 };

describe('efeméride', () => {
  it('Sol em 01/01/2000 12:00 UTC ≈ 280,1°', () => {
    const r = calcularMapa({
      nome: 'Ref', dataBR: '01/01/2000', hora: '09:00', horaDesconhecida: false,
      local: { resumo: 'São Paulo', lat: -23.55, lon: -46.63 },
    });
    assert.ok(Math.abs(r.planetas[0].longitude - 280.1) < 0.6);
  });
});

describe('mapa completo', () => {
  const m = calcularMapa({
    nome: 'Teste', dataBR: '15/08/1990', hora: '14:30', horaDesconhecida: false, local: SP,
  });
  it('Sol em Leão', () => assert.equal(m.planetas[0].signo.nome, 'Leão'));
  it('fuso de São Paulo com UTC correto', () => {
    assert.equal(m.fuso, 'America/Sao_Paulo');
    assert.equal(m.utcISO, '1990-08-15T17:30:00.000Z');
  });
  it('casas Placidus com Asc/MC', () => {
    assert.equal(m.sistemaCasas, 'Placidus');
    assert.ok(m.ascendente && m.meioCeu);
    assert.ok(m.planetas.every((p) => p.casa >= 1 && p.casa <= 12));
  });
  it('detecta aspectos', () => assert.ok(m.aspectos.length > 3));
});

describe('hora desconhecida', () => {
  const s = calcularMapa({
    nome: 'Teste', dataBR: '15/08/1990', hora: '', horaDesconhecida: true, local: SP,
  });
  it('cai para signos inteiros sem Asc/MC', () => {
    assert.equal(s.ascendente, null);
    assert.equal(s.sistemaCasas, 'Signos inteiros');
    assert.equal(s.planetas[0].signo.nome, 'Leão');
  });
});

describe('validações', () => {
  it('rejeita data inválida', () => {
    assert.throws(() => calcularMapa({ nome: 'T', dataBR: '31/02/2000', hora: '10:00', horaDesconhecida: false, local: SP }));
  });
  it('rejeita hora inválida', () => {
    assert.throws(() => calcularMapa({ nome: 'T', dataBR: '01/01/2000', hora: '25:00', horaDesconhecida: false, local: SP }));
  });
});
