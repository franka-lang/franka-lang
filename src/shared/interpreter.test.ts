import { FrankaInterpreter } from './interpreter';
import * as path from 'path';

describe('FrankaInterpreter', () => {
  let interpreter: FrankaInterpreter;

  beforeEach(() => {
    interpreter = new FrankaInterpreter();
  });

  describe('basic operations', () => {
    it('should execute print operation', () => {
      const program = {
        program: { name: 'Test' },
        operations: [{ operation: 'print', value: 'Hello, World!' }],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['Hello, World!']);
    });

    it('should execute assign and print operations', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          { operation: 'assign', variable: 'message', value: 'Hello' },
          { operation: 'print', value: '$message' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['Hello']);
    });
  });

  describe('string operations', () => {
    it('should concatenate strings', () => {
      const program = {
        program: { name: 'Test' },
        variables: { greeting: 'Hello', name: 'World' },
        operations: [
          {
            operation: 'assign',
            variable: 'message',
            value: {
              operation: 'concat',
              values: ['$greeting', ', ', '$name', '!'],
            },
          },
          { operation: 'print', value: '$message' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['Hello, World!']);
    });

    it('should convert string to uppercase', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'upper',
            value: { operation: 'uppercase', value: 'hello' },
          },
          { operation: 'print', value: '$upper' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['HELLO']);
    });

    it('should convert string to lowercase', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'lower',
            value: { operation: 'lowercase', value: 'HELLO' },
          },
          { operation: 'print', value: '$lower' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['hello']);
    });

    it('should get string length', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'len',
            value: { operation: 'length', value: 'Hello' },
          },
          { operation: 'print', value: '$len' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['5']);
    });

    it('should extract substring', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'sub',
            value: { operation: 'substring', value: 'Hello World', start: 0, end: 5 },
          },
          { operation: 'print', value: '$sub' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['Hello']);
    });
  });

  describe('boolean operations', () => {
    it('should perform AND operation', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'result',
            value: { operation: 'and', values: [true, true] },
          },
          { operation: 'print', value: '$result' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['true']);
    });

    it('should perform OR operation', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'result',
            value: { operation: 'or', values: [false, true] },
          },
          { operation: 'print', value: '$result' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['true']);
    });

    it('should perform NOT operation', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'assign',
            variable: 'result',
            value: { operation: 'not', value: false },
          },
          { operation: 'print', value: '$result' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['true']);
    });

    it('should perform equals operation', () => {
      const program = {
        program: { name: 'Test' },
        variables: { name: 'alice' },
        operations: [
          {
            operation: 'assign',
            variable: 'result',
            value: { operation: 'equals', left: '$name', right: 'alice' },
          },
          { operation: 'print', value: '$result' },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['true']);
    });
  });

  describe('control flow', () => {
    it('should execute if-then branch', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'if',
            condition: true,
            then: [{ operation: 'print', value: 'True branch' }],
            else: [{ operation: 'print', value: 'False branch' }],
          },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['True branch']);
    });

    it('should execute if-else branch', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          {
            operation: 'if',
            condition: false,
            then: [{ operation: 'print', value: 'True branch' }],
            else: [{ operation: 'print', value: 'False branch' }],
          },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['False branch']);
    });

    it('should execute if with complex condition', () => {
      const program = {
        program: { name: 'Test' },
        variables: { username: 'alice', expected: 'alice' },
        operations: [
          {
            operation: 'if',
            condition: { operation: 'equals', left: '$username', right: '$expected' },
            then: [{ operation: 'print', value: 'Match' }],
            else: [{ operation: 'print', value: 'No match' }],
          },
        ],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['Match']);
    });
  });

  describe('example files', () => {
    it('should execute hello.franka', () => {
      const filePath = path.join(__dirname, '../../examples/hello.franka');
      const output = interpreter.executeFile(filePath);
      expect(output).toEqual(['Hello, Franka!']);
    });

    it('should execute string-operations.franka', () => {
      const filePath = path.join(__dirname, '../../examples/string-operations.franka');
      const output = interpreter.executeFile(filePath);
      expect(output).toEqual(['Hello, World!', 'HELLO, WORLD!', 'hello, world!']);
    });

    it('should execute boolean-logic.franka', () => {
      const filePath = path.join(__dirname, '../../examples/boolean-logic.franka');
      const output = interpreter.executeFile(filePath);
      expect(output).toEqual(['Access denied', 'You can view the content', 'Welcome, guest!']);
    });

    it('should execute conditional-string.franka', () => {
      const filePath = path.join(__dirname, '../../examples/conditional-string.franka');
      const output = interpreter.executeFile(filePath);
      expect(output).toEqual(['Welcome, alice!', 'ALICE']);
    });
  });

  describe('error handling', () => {
    it('should throw error for undefined variable', () => {
      const program = {
        program: { name: 'Test' },
        operations: [{ operation: 'print', value: '$undefined' }],
      };

      expect(() => interpreter.execute(program)).toThrow('Undefined variable: undefined');
    });

    it('should throw error for unknown operation', () => {
      const program = {
        program: { name: 'Test' },
        operations: [{ operation: 'unknown_op', value: 'test' }],
      };

      expect(() => interpreter.execute(program)).toThrow('Unknown operation: unknown_op');
    });
  });
});
