import { SpecRunner } from './spec-runner';
import * as fs from 'fs';
import * as path from 'path';

describe('SpecRunner', () => {
  let runner: SpecRunner;
  const tmpDir = '/tmp/spec-runner-tests';

  beforeEach(() => {
    runner = new SpecRunner();
    // Create temporary directory for test files
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('loadSpec', () => {
    it('should load a valid spec file', () => {
      const specPath = path.join(tmpDir, 'test.spec.yaml');
      const specContent = `
tests:
  - description: "Test case 1"
    inputs:
      greeting: "Hi"
    expectedOutputs: "Hi, World!"
`;
      fs.writeFileSync(specPath, specContent);

      const spec = runner.loadSpec(specPath);
      expect(spec.tests).toHaveLength(1);
      expect(spec.tests[0].description).toBe('Test case 1');
      expect(spec.tests[0].inputs).toEqual({ greeting: 'Hi' });
      expect(spec.tests[0].expectedOutputs).toBe('Hi, World!');
    });

    it('should throw error for missing spec file', () => {
      expect(() => runner.loadSpec('/nonexistent/file.spec.yaml')).toThrow('Spec file not found');
    });

    it('should throw error for spec without tests array', () => {
      const specPath = path.join(tmpDir, 'invalid.spec.yaml');
      fs.writeFileSync(specPath, 'invalid: true\n');

      expect(() => runner.loadSpec(specPath)).toThrow('must contain a "tests" array');
    });

    it('should throw error for test case without expectedOutputs', () => {
      const specPath = path.join(tmpDir, 'invalid2.spec.yaml');
      const specContent = `
tests:
  - description: "Missing expected outputs"
    inputs:
      greeting: "Hi"
`;
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.loadSpec(specPath)).toThrow('must contain "expectedOutputs"');
    });
  });

  describe('findSpecFile', () => {
    it('should find spec file with .spec.yaml extension', () => {
      const programPath = path.join(tmpDir, 'hello.yaml');
      const specPath = path.join(tmpDir, 'hello.spec.yaml');

      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');
      fs.writeFileSync(specPath, 'tests: []\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBe(specPath);
    });

    it('should find spec file with .spec.yml extension', () => {
      const programPath = path.join(tmpDir, 'hello.yaml');
      const specPath = path.join(tmpDir, 'hello.spec.yml');

      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');
      fs.writeFileSync(specPath, 'tests: []\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBe(specPath);
    });

    it('should return null if spec file does not exist', () => {
      const programPath = path.join(tmpDir, 'hello.yaml');
      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBeNull();
    });

    it('should handle program files with .yml extension', () => {
      const programPath = path.join(tmpDir, 'hello.yml');
      const specPath = path.join(tmpDir, 'hello.spec.yaml');

      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');
      fs.writeFileSync(specPath, 'tests: []\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBe(specPath);
    });
  });

  describe('runTest', () => {
    it('should pass a test with matching outputs', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'greeting' },
      };

      const testCase = {
        description: 'Test with Hi',
        inputs: { greeting: 'Hi' },
        expectedOutputs: 'Hi',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(true);
      expect(result.description).toBe('Test with Hi');
    });

    it('should fail a test with mismatched outputs', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'greeting' },
      };

      const testCase = {
        description: 'Test with mismatch',
        inputs: { greeting: 'Hi' },
        expectedOutputs: 'Hello',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(false);
      expect(result.error).toBe('Output mismatch');
      expect(result.expected).toBe('Hello');
      expect(result.actual).toBe('Hi');
    });

    it('should fail a test when program throws error', () => {
      const program = {
        program: { name: 'Test' },
        logic: { get: 'nonexistent' },
      };

      const testCase = {
        expectedOutputs: 'anything',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Undefined variable');
    });

    it('should test programs with multiple outputs', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          name: {
            type: 'string' as const,
            default: 'World',
          },
        },
        output: {
          greeting: { type: 'string' as const },
          length: { type: 'number' as const },
        },
        logic: {
          let: {
            msg: { concat: ['Hello, ', { get: 'name' }] },
          },
          in: {
            set: {
              greeting: { get: 'msg' },
              length: { length: { get: 'msg' } },
            },
          },
        },
      };

      const testCase = {
        inputs: { name: 'Franka' },
        expectedOutputs: {
          greeting: 'Hello, Franka',
          length: 13,
        },
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(true);
    });

    it('should handle test without inputs', () => {
      const program = {
        program: { name: 'Test' },
        logic: 'Hello, World!',
      };

      const testCase = {
        expectedOutputs: 'Hello, World!',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(true);
    });

    it('should fail when test input is not declared in program', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'greeting' },
      };

      const testCase = {
        inputs: { undeclared: 'value' },
        expectedOutputs: 'anything',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(false);
      expect(result.error).toContain('not declared in the program');
    });
  });

  describe('runAllTests', () => {
    it('should run all tests in a spec file', () => {
      const programPath = path.join(tmpDir, 'program.yaml');
      const specPath = path.join(tmpDir, 'program.spec.yaml');

      const programContent = `
program:
  name: "Echo"
  description: "Echoes the input"

input:
  message:
    type: string
    default: "Hello"

logic:
  get: message
`;

      const specContent = `
tests:
  - description: "Test 1"
    inputs:
      message: "Hi"
    expectedOutputs: "Hi"
  - description: "Test 2"
    inputs:
      message: "World"
    expectedOutputs: "World"
  - description: "Test 3 - should fail"
    inputs:
      message: "Fail"
    expectedOutputs: "Wrong"
`;

      fs.writeFileSync(programPath, programContent);
      fs.writeFileSync(specPath, specContent);

      const results = runner.runAllTests(programPath, specPath);
      expect(results).toHaveLength(3);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
      expect(results[2].passed).toBe(false);
    });
  });
});
