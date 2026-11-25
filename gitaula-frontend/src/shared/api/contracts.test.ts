import { describe, expect, it } from 'vitest';
import {
  normalizeSession,
  parseId,
  parseContract,
  commissionSchema,
  roleSchema,
  statusSchema,
} from './contracts';
import { calendarDate, internalPath } from '../lib/domain';
describe('contratos de identidad y navegación', () => {
  it.each([
    '',
    ' ',
    0,
    -1,
    '1.5',
    '1e2',
    '01',
    null,
    undefined,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])('rechaza ID inválido %s', (value) => {
    expect(() => parseId(value)).toThrow();
  });
  it('normaliza sólo las variantes de identidad documentadas', () => {
    expect(normalizeSession({ id: 7, githubLogin: 'octo' }).userId).toBe(7);
    expect(normalizeSession({ userId: '7', githubLogin: 'octo' }).userId).toBe(7);
    expect(() => normalizeSession({ githubLogin: 'octo' })).toThrow();
    expect(() => normalizeSession({ userId: '', id: 7, githubLogin: 'octo' })).toThrow();
  });
  it.each([
    'https://externo.test',
    '//externo.test',
    '/\\externo.test',
    '/login',
    '/auth/callback?loginCode=code',
    '/foo\nbar',
  ])('rechaza retorno inseguro %s', (value) => {
    expect(internalPath(value)).toBe('/');
  });
  it('conserva query y hash del destino interno', () => {
    expect(internalPath('/entregas/5?aviso=1#actividad')).toBe('/entregas/5?aviso=1#actividad');
  });
  it('fecha de calendario mantiene el mismo día', () => {
    expect(calendarDate('2026-11-25')).toMatch(/25/);
  });
  it('normaliza variantes persistidas sin cambiar etiquetas del contrato', () => {
    expect(roleSchema.parse('DOCENTE')).toBe('TEACHER');
    expect(statusSchema.parse('EN_REVISION')).toBe('REVIEWING');
  });
  it('expone contratos rotos en lugar de inventar datos', () => {
    expect(() => parseContract(commissionSchema, { commissionId: 1 })).toThrow(
      /respuesta del servidor/,
    );
  });
});
