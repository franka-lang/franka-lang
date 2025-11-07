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
        operations: [{ print: 'Hello, World!' }],
      };

      const output = interpreter.execute(program);
      expect(output).toEqual(['Hello, World!']);
    });

    it('should execute assign and print operations', () => {
      const program = {
        program: { name: 'Test' },
        operations: [
          { assign: { variable: 'message', value: 'Hello' } },
          { print: '$message' },
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
            assign: {
              variable: 'message',
              value: {
                concat: ['$greeting', ', ', '$name', '!'],
              },
            },
          },
          { print: '$message' },
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
            assign: {
              variable: 'upper',
              value: { uppercase: 'hello' },
            },
          },
          { print: '$upper' },
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
            assign: {
              variable: 'lower',
              value: { lowercase: 'HELLO' },
            },
          },
          { print: '$lower' },
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
            assign: {
              variable: 'len',
              value: { length: 'Hello' },
            },
          },
          { print: '$len' },
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
            assign: {
              variable: 'sub',
              value: { substring: { value: 'Hello World', start: 0, end: 5 } },
            },
          },
          { print: '$sub' },
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
            assign: {
              variable: 'result',
              value: { and: [true, true] },
            },
          },
          { print: '$result' },
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
            assign: {
              variable: 'result',
              value: { or: [false, true] },
            },
          },
          { print: '$result' },
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
            assign: {
              variable: 'result',
              value: { not: false },
            },
          },
          { print: '$result' },
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
            assign: {
              variable: 'result',
              value: { equals: { left: '$name', right: 'alice' } },
            },
          },
          { print: '$result' },
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
            if: {
              condition: true,
              then: [{ print: 'True branch' }],
              else: [{ print: 'False branch' }],
            },
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
            if: {
              condition: false,
              then: [{ print: 'True branch' }],
              else: [{ print: 'False branch' }],
            },
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
            if: {
              condition: { equals: { left: '$username', right: '$expected' } },
              then: [{ print: 'Match' }],
              else: [{ print: 'No match' }],
            },
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
        operations: [{ print: '$undefined' }],
      };

      expect(() => interpreter.execute(program)).toThrow('Undefined variable: undefined');
    });

    it('should throw error for unknown operation', () => {
      const program = {
        program: { name: 'Test' },
        operations: [{ unknown_op: 'test' }],
      };

      expect(() => interpreter.execute(program)).toThrow('Unknown operation: unknown_op');
    });
  });
});
