import { execSync } from 'child_process';
import { runFile, checkFile, startRepl } from './index';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI with Commander', () => {
  const cliPath = 'ts-node src/cli/index.ts';

  test('should display help', () => {
    const output = execSync(`${cliPath} --help`).toString();
    expect(output).toContain('Usage: franka');
    expect(output).toContain('Commands:');
    expect(output).toContain('run');
    expect(output).toContain('<file>');
    expect(output).toContain('check');
    expect(output).toContain('repl');
  });

  test('should display version', () => {
    const output = execSync(`${cliPath} --version`).toString();
    expect(output).toContain('1.0.0');
  });

  test('should show error for missing file in run command', () => {
    try {
      execSync(`${cliPath} run nonexistent.yaml`, { stdio: 'pipe' });
      fail('Should have thrown an error');
    } catch (error: any) {
      const output = error.stderr.toString() + error.stdout.toString();
      expect(output).toContain('File not found');
    }
  });

  test('should show error for missing file in check command', () => {
    try {
      execSync(`${cliPath} check nonexistent.yaml`, { stdio: 'pipe' });
      fail('Should have thrown an error');
    } catch (error: any) {
      const output = error.stderr.toString() + error.stdout.toString();
      expect(output).toContain('File not found');
    }
  });

  test('should start REPL', () => {
    const output = execSync(`${cliPath} repl`).toString();
    expect(output).toContain('Starting Franka REPL');
    expect(output).toContain('REPL not yet implemented');
  });
});

describe('CLI Functions', () => {
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('runFile', () => {
    test('should throw error for non-existent file', () => {
      expect(() => runFile('nonexistent.yaml')).toThrow('File not found');
    });

    test('should run a simple hello world program', () => {
      const result = runFile(path.join(__dirname, '../../examples/hello.yaml'));
      expect(result).toBe('Hello, Franka!');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/Running Franka program:.*hello\.yaml/)
      );
    });

    test('should run a module with specific function', () => {
      const result = runFile(
        path.join(__dirname, '../../examples/multi-function.yaml'),
        'greet'
      );
      expect(result).toBe('Hello, World!');
      expect(mockConsoleLog).toHaveBeenCalledWith('Function: greet');
    });

    test('should run a module with default function', () => {
      const result = runFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      expect(result).toBeDefined();
    });

    test('should throw error for invalid YAML syntax', () => {
      const tempFile = path.join(__dirname, '../../tmp-test-invalid.yaml');
      fs.writeFileSync(tempFile, 'invalid: yaml: content:');
      
      try {
        expect(() => runFile(tempFile)).toThrow();
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('checkFile', () => {
    test('should throw error for non-existent file', () => {
      expect(() => checkFile('nonexistent.yaml')).toThrow('File not found');
    });

    test('should check a valid module file', () => {
      const result = checkFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      expect(result).toEqual({ hasErrors: false });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Syntax is valid')
      );
    });

    test('should check a specific function in a module', () => {
      const result = checkFile(
        path.join(__dirname, '../../examples/multi-function.yaml'),
        'greet'
      );
      expect(result).toEqual({ hasErrors: false });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Checking function'));
    });

    test('should display module metadata', () => {
      checkFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Module name:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Functions:'));
    });

    test('should throw error for invalid module structure', () => {
      const tempFile = path.join(__dirname, '../../tmp-test-invalid-structure.yaml');
      fs.writeFileSync(
        tempFile,
        `
notmodule:
  name: Test
functions:
  test:
    logic: "hello"
`
      );

      try {
        expect(() => checkFile(tempFile)).toThrow();
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('startRepl', () => {
    test('should display REPL message', () => {
      startRepl();
      expect(mockConsoleLog).toHaveBeenCalledWith('Starting Franka REPL...');
      expect(mockConsoleLog).toHaveBeenCalledWith('Note: REPL not yet implemented.');
    });
  });
});

