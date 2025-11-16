import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createModule,
  readModule,
  updateModule,
  deleteModule,
  checkModule,
  createSpecFile,
} from './handlers';

describe('MCP Handlers', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'franka-mcp-handlers-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createModule', () => {
    it('should create a valid module', () => {
      const filePath = path.join(testDir, 'test.yaml');
      const result = createModule({
        filePath,
        moduleName: 'Test Module',
        moduleDescription: 'A test',
        functions: {
          main: {
            description: 'Main function',
            logic: 'Hello',
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('created successfully');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should reject file without .yaml or .yml extension', () => {
      const result = createModule({
        filePath: path.join(testDir, 'test.txt'),
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('must end with .yaml or .yml');
    });

    it('should reject module without functions', () => {
      const result = createModule({
        filePath: path.join(testDir, 'test.yaml'),
        moduleName: 'Test',
        functions: {},
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('At least one function is required');
    });

    it('should reject function without logic', () => {
      const result = createModule({
        filePath: path.join(testDir, 'test.yaml'),
        moduleName: 'Test',
        functions: { main: { description: 'Test' } as any },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('must have a "logic" field');
    });
  });

  describe('readModule', () => {
    it('should read an existing module', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test Module',
        functions: { main: { logic: 'Hello' } },
      });

      const result = readModule({ filePath });

      expect(result.success).toBe(true);
      expect(result.module).toBeDefined();
      expect((result.module as any).module.name).toBe('Test Module');
    });

    it('should fail for non-existent file', () => {
      const result = readModule({ filePath: path.join(testDir, 'nonexistent.yaml') });

      expect(result.success).toBe(false);
      expect(result.message).toContain('File not found');
    });
  });

  describe('updateModule', () => {
    it('should add a new function', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      const result = updateModule({
        filePath,
        addFunctions: {
          greet: {
            description: 'Greet',
            logic: 'Hi',
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');

      const readResult = readModule({ filePath });
      expect((readResult.module as any).functions.greet).toBeDefined();
    });

    it('should update module metadata', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Old Name',
        functions: { main: { logic: 'Hello' } },
      });

      const result = updateModule({
        filePath,
        moduleName: 'New Name',
        moduleDescription: 'New description',
      });

      expect(result.success).toBe(true);

      const readResult = readModule({ filePath });
      expect((readResult.module as any).module.name).toBe('New Name');
      expect((readResult.module as any).module.description).toBe('New description');
    });

    it('should remove a function', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: {
          main: { logic: 'Hello' },
          extra: { logic: 'World' },
        },
      });

      const result = updateModule({
        filePath,
        removeFunctions: ['extra'],
      });

      expect(result.success).toBe(true);

      const readResult = readModule({ filePath });
      expect((readResult.module as any).functions.extra).toBeUndefined();
      expect((readResult.module as any).functions.main).toBeDefined();
    });

    it('should fail when removing last function', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      const result = updateModule({
        filePath,
        removeFunctions: ['main'],
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('at least one function');
    });
  });

  describe('deleteModule', () => {
    it('should delete module file', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      expect(fs.existsSync(filePath)).toBe(true);

      const result = deleteModule({ filePath });

      expect(result.success).toBe(true);
      expect(result.deletedFiles).toContain(filePath);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should delete module and spec file', () => {
      const filePath = path.join(testDir, 'test.yaml');
      const specPath = path.join(testDir, 'test.spec.yaml');

      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      createSpecFile({
        modulePath: filePath,
        tests: {
          main: {
            tests: [{ expectedOutput: 'Hello' }],
          },
        },
      });

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.existsSync(specPath)).toBe(true);

      const result = deleteModule({ filePath, deleteSpec: true });

      expect(result.success).toBe(true);
      expect(result.deletedFiles).toHaveLength(2);
      expect(fs.existsSync(filePath)).toBe(false);
      expect(fs.existsSync(specPath)).toBe(false);
    });
  });

  describe('checkModule', () => {
    it('should validate module syntax', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      const result = checkModule({ filePath });

      expect(result.success).toBe(true);
      expect(result.syntaxValid).toBe(true);
      expect(result.module).toBeDefined();
      expect(result.module?.name).toBe('Test');
    });

    it('should run tests if spec file exists', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      createSpecFile({
        modulePath: filePath,
        tests: {
          main: {
            tests: [{ description: 'Test', expectedOutput: 'Hello' }],
          },
        },
      });

      const result = checkModule({ filePath });

      expect(result.success).toBe(true);
      expect(result.tests).toBeDefined();
      expect(result.tests?.found).toBe(true);
      expect(result.tests?.summary.total).toBe(1);
      expect(result.tests?.summary.passed).toBe(1);
    });

    it('should report test failures', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      createSpecFile({
        modulePath: filePath,
        tests: {
          main: {
            tests: [{ expectedOutput: 'Wrong' }],
          },
        },
      });

      const result = checkModule({ filePath });

      expect(result.success).toBe(false);
      expect(result.tests?.summary.failed).toBe(1);
    });
  });

  describe('createSpecFile', () => {
    it('should create spec file', () => {
      const filePath = path.join(testDir, 'test.yaml');
      const specPath = path.join(testDir, 'test.spec.yaml');

      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      const result = createSpecFile({
        modulePath: filePath,
        tests: {
          main: {
            tests: [
              {
                description: 'Test case',
                expectedOutput: 'Hello',
              },
            ],
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.specPath).toBe(specPath);
      expect(fs.existsSync(specPath)).toBe(true);
    });

    it('should reject spec for non-existent function', () => {
      const filePath = path.join(testDir, 'test.yaml');
      createModule({
        filePath,
        moduleName: 'Test',
        functions: { main: { logic: 'Hello' } },
      });

      const result = createSpecFile({
        modulePath: filePath,
        tests: {
          nonexistent: {
            tests: [{ expectedOutput: 'Test' }],
          },
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found in module');
    });
  });
});
