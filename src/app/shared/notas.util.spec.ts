import { etapaPorFecha, formatNota, fueraDeRango, parseNota, parsePegado } from './notas.util';

describe('notas.util', () => {
  it('parseNota acepta coma, punto y %; vacío es null; texto inválido es NaN', () => {
    expect(parseNota('22,22')).toBe(22.22);
    expect(parseNota(' 47.25 ')).toBe(47.25);
    expect(parseNota('75%')).toBe(75);
    expect(parseNota('22,225')).toBe(22.23);
    expect(parseNota('')).toBeNull();
    expect(parseNota(null)).toBeNull();
    expect(parseNota('abc')).toBeNaN();
    expect(parseNota('1.234,5')).toBeNaN();
  });

  it('formatNota muestra coma decimal y sin ceros de más', () => {
    expect(formatNota(22.22)).toBe('22,22');
    expect(formatNota(25)).toBe('25');
    expect(formatNota(47.5)).toBe('47,5');
    expect(formatNota(null)).toBe('');
  });

  it('fueraDeRango: vacío no es error; NaN, negativos y mayores al máximo sí', () => {
    expect(fueraDeRango(null, 25)).toBe(false);
    expect(fueraDeRango(25, 25)).toBe(false);
    expect(fueraDeRango(25.01, 25)).toBe(true);
    expect(fueraDeRango(-1, 25)).toBe(true);
    expect(fueraDeRango(NaN, 25)).toBe(true);
  });

  it('parsePegado toma la primera columna de cada línea', () => {
    expect(parsePegado('22,22\n20\r\n18,5\n')).toEqual(['22,22', '20', '18,5']);
    expect(parsePegado('10\tx\n11\ty')).toEqual(['10', '11']);
    expect(parsePegado('7')).toEqual(['7']);
  });

  it('etapaPorFecha: hasta julio 1, desde agosto 2', () => {
    expect(etapaPorFecha('2026-07-31')).toBe(1);
    expect(etapaPorFecha('2026-08-01')).toBe(2);
  });
});
