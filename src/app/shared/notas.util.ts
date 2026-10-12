/** Utilidades para celdas de notas: aceptan "22,22", "22.22" o "75%". */

/** Texto de la celda -> número con 2 decimales. null = vacío; NaN = inválido. */
export function parseNota(texto: string | null | undefined): number | null {
  const limpio = (texto ?? '').trim().replace('%', '').replace(',', '.');
  if (limpio === '') {
    return null;
  }
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) {
    return NaN;
  }
  return Math.round(Number(limpio) * 100) / 100;
}

/** Número -> texto para la celda ("22,22", "25"). */
export function formatNota(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  return (Math.round(valor * 100) / 100).toString().replace('.', ',');
}

/** true si el valor no es válido para el rango [0, max]. Vacío (null) no es error. */
export function fueraDeRango(valor: number | null, max: number): boolean {
  return valor !== null && (Number.isNaN(valor) || valor < 0 || valor > max);
}

/** Texto pegado desde Excel/Sheets: una fila por línea; se toma la primera columna. */
export function parsePegado(texto: string): string[] {
  const lineas = texto.replace(/\r/g, '').split('\n');
  if (lineas.length > 1 && lineas[lineas.length - 1] === '') {
    lineas.pop();
  }
  return lineas.map(linea => linea.split('\t')[0].trim());
}

/** Etapa sugerida para una prueba (fecha ISO yyyy-MM-dd): enero-julio 1, agosto-diciembre 2. */
export function etapaPorFecha(fechaIso: string): number {
  return Number(fechaIso.slice(5, 7)) <= 7 ? 1 : 2;
}

/** Fecha de hoy en formato yyyy-MM-dd (hora local). */
export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
