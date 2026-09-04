/**
 * Clock — el tiempo como dependencia inyectada.
 *
 * Ningún caso de uso llama a `new Date()` directamente: así los tests pueden
 * congelar el reloj y verificar reglas que dependen de la fecha (horarios de
 * atención, resumen del día) sin depender de cuándo se ejecuten.
 */
export interface Clock {
  now(): Date;
}
