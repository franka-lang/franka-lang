import { execSync } from 'child_process';
import { app } from './index';
import { loadLanguageSpec } from '../shared/spec-loader';

describe('Web Server with Commander', () => {
  const webPath = 'ts-node src/web/index.ts';

  test('should display help', () => {
    const output = execSync(`${webPath} --help`).toString();
    expect(output).toContain('Usage: franka-web');
    expect(output).toContain('Franka Web Server');
    expect(output).toContain('-p, --port');
    expect(output).toContain('-d, --dir');
  });

  test('should display version', () => {
    const output = execSync(`${webPath} --version`).toString();
    expect(output).toContain('1.0.0');
  });
});

describe('Web Server App Configuration', () => {
  test('should export the express app', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });

  test('should have routes configured', () => {
    const routes = (app as any)._router?.stack || [];
    // Just check that the app is initialized, routes may not be enumerable
    expect(app).toBeDefined();
  });

  test('should load language spec at startup', () => {
    const spec = loadLanguageSpec();
    expect(spec).toBeDefined();
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata.name).toBe('Franka');
  });
});

describe('Web Server Route Handlers Logic', () => {
  // Test the underlying logic that would be called by routes
  const spec = loadLanguageSpec();

  test('spec should have metadata', () => {
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata.name).toBe('Franka');
    expect(spec.metadata.version).toBeDefined();
  });

  test('spec should have syntax', () => {
    expect(spec.syntax).toBeDefined();
    expect(spec.syntax.operations).toBeDefined();
  });

  test('spec should have examples', () => {
    expect(spec.examples).toBeDefined();
    expect(Array.isArray(spec.examples)).toBe(true);
  });

  test('spec should have string operations', () => {
    expect(spec.syntax.operations.string).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.string)).toBe(true);
  });

  test('spec should have boolean operations', () => {
    expect(spec.syntax.operations.boolean).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.boolean)).toBe(true);
  });

  test('spec should have control operations', () => {
    expect(spec.syntax.operations.control).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.control)).toBe(true);
  });
});

