/**
 * Tests for Franka type definitions and type guards
 */

import {
  FrankaExpression,
  GetExpression,
  SetExpression,
  LetExpression,
  IfExpression,
  IfChainElement,
  ElseClause,
  SingleOutput,
  MultipleOutputs,
  FrankaModule,
  isSingleOutput,
  isMultipleOutputs,
  isPrimitiveValue,
  isOperation,
  isArray,
  isGetExpression,
  isSetExpression,
  isLetExpression,
  isIfExpression,
  isIfChainElement,
  isElseClause,
} from './types';

describe('Franka Type Guards', () => {
  describe('isSingleOutput', () => {
    it('should return true for single output', () => {
      const output: SingleOutput = { type: 'string' };
      expect(isSingleOutput(output)).toBe(true);
    });

    it('should return false for multiple outputs', () => {
      const output: MultipleOutputs = {
        result: { type: 'string' },
        count: { type: 'number' },
      };
      expect(isSingleOutput(output)).toBe(false);
    });
  });

  describe('isMultipleOutputs', () => {
    it('should return true for multiple outputs', () => {
      const output: MultipleOutputs = {
        result: { type: 'string' },
        count: { type: 'number' },
      };
      expect(isMultipleOutputs(output)).toBe(true);
    });

    it('should return false for single output', () => {
      const output: SingleOutput = { type: 'string' };
      expect(isMultipleOutputs(output)).toBe(false);
    });
  });

  describe('isPrimitiveValue', () => {
    it('should return true for string', () => {
      expect(isPrimitiveValue('hello')).toBe(true);
    });

    it('should return true for number', () => {
      expect(isPrimitiveValue(42)).toBe(true);
    });

    it('should return true for boolean', () => {
      expect(isPrimitiveValue(true)).toBe(true);
      expect(isPrimitiveValue(false)).toBe(true);
    });

    it('should return true for null', () => {
      expect(isPrimitiveValue(null)).toBe(true);
    });

    it('should return false for objects', () => {
      expect(isPrimitiveValue({ get: 'x' })).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isPrimitiveValue([])).toBe(false);
    });
  });

  describe('isOperation', () => {
    it('should return true for operation objects', () => {
      expect(isOperation({ get: 'x' })).toBe(true);
      expect(isOperation({ concat: ['a', 'b'] })).toBe(true);
    });

    it('should return false for primitives', () => {
      expect(isOperation('hello')).toBe(false);
      expect(isOperation(42)).toBe(false);
      expect(isOperation(true)).toBe(false);
      expect(isOperation(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isOperation([])).toBe(false);
      expect(isOperation([1, 2, 3])).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray('hello')).toBe(false);
      expect(isArray(42)).toBe(false);
      expect(isArray({ get: 'x' })).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe('isGetExpression', () => {
    it('should return true for valid get expressions', () => {
      const expr: GetExpression = { get: 'variable' };
      expect(isGetExpression(expr)).toBe(true);
    });

    it('should return false for non-get expressions', () => {
      expect(isGetExpression({ set: { x: 1 } })).toBe(false);
      expect(isGetExpression({ concat: ['a', 'b'] })).toBe(false);
      expect(isGetExpression('hello')).toBe(false);
      expect(isGetExpression(null)).toBe(false);
    });

    it('should return false for get with non-string value', () => {
      expect(isGetExpression({ get: 123 })).toBe(false);
      expect(isGetExpression({ get: true })).toBe(false);
    });
  });

  describe('isSetExpression', () => {
    it('should return true for valid set expressions', () => {
      const expr: SetExpression = { set: { result: 'value' } };
      expect(isSetExpression(expr)).toBe(true);
    });

    it('should return false for non-set expressions', () => {
      expect(isSetExpression({ get: 'x' })).toBe(false);
      expect(isSetExpression({ concat: ['a', 'b'] })).toBe(false);
      expect(isSetExpression('hello')).toBe(false);
      expect(isSetExpression(null)).toBe(false);
    });
  });

  describe('isLetExpression', () => {
    it('should return true for valid let expressions', () => {
      const expr: LetExpression = {
        let: { x: 5, y: 10 },
        in: { get: 'x' },
      };
      expect(isLetExpression(expr)).toBe(true);
    });

    it('should return false for expressions without both let and in', () => {
      expect(isLetExpression({ let: { x: 5 } })).toBe(false);
      expect(isLetExpression({ in: { get: 'x' } })).toBe(false);
      expect(isLetExpression({ get: 'x' })).toBe(false);
      expect(isLetExpression('hello')).toBe(false);
      expect(isLetExpression(null)).toBe(false);
    });

    it('should return false when let is an array', () => {
      expect(isLetExpression({ let: [1, 2, 3], in: { get: 'x' } })).toBe(false);
    });
  });

  describe('isIfExpression', () => {
    it('should return true for if/then expression', () => {
      const expr: IfExpression = {
        if: true,
        then: 'yes',
      };
      expect(isIfExpression(expr)).toBe(true);
    });

    it('should return true for if/else expression', () => {
      const expr: IfExpression = {
        if: true,
        else: 'no',
      };
      expect(isIfExpression(expr)).toBe(true);
    });

    it('should return true for if/then/else expression', () => {
      const expr: IfExpression = {
        if: true,
        then: 'yes',
        else: 'no',
      };
      expect(isIfExpression(expr)).toBe(true);
    });

    it('should return false for expressions without then or else', () => {
      expect(isIfExpression({ if: true })).toBe(false);
      expect(isIfExpression({ then: 'yes' })).toBe(false);
      expect(isIfExpression({ get: 'x' })).toBe(false);
      expect(isIfExpression('hello')).toBe(false);
      expect(isIfExpression(null)).toBe(false);
    });
  });

  describe('isIfChainElement', () => {
    it('should return true for if/then without else', () => {
      const expr: IfChainElement = {
        if: true,
        then: 'yes',
      };
      expect(isIfChainElement(expr)).toBe(true);
    });

    it('should return false for if/then/else', () => {
      expect(isIfChainElement({ if: true, then: 'yes', else: 'no' })).toBe(false);
    });

    it('should return false for else clause', () => {
      expect(isIfChainElement({ else: 'no' })).toBe(false);
    });

    it('should return false for non-if expressions', () => {
      expect(isIfChainElement({ get: 'x' })).toBe(false);
      expect(isIfChainElement('hello')).toBe(false);
      expect(isIfChainElement(null)).toBe(false);
    });
  });

  describe('isElseClause', () => {
    it('should return true for standalone else clause', () => {
      const expr: ElseClause = { else: 'default' };
      expect(isElseClause(expr)).toBe(true);
    });

    it('should return false for if/then/else', () => {
      expect(isElseClause({ if: true, then: 'yes', else: 'no' })).toBe(false);
    });

    it('should return false for if/then', () => {
      expect(isElseClause({ if: true, then: 'yes' })).toBe(false);
    });

    it('should return false for non-else expressions', () => {
      expect(isElseClause({ get: 'x' })).toBe(false);
      expect(isElseClause('hello')).toBe(false);
      expect(isElseClause(null)).toBe(false);
    });
  });
});

describe('Franka Type Structures', () => {
  describe('FrankaModule', () => {
    it('should allow valid module structure', () => {
      const module: FrankaModule = {
        module: {
          name: 'Test Module',
          description: 'A test module',
        },
        functions: {
          main: {
            logic: 'Hello, World!',
          },
          greet: {
            description: 'Greets the user',
            input: {
              name: {
                type: 'string',
                default: 'World',
              },
            },
            logic: {
              concat: [{ get: 'name' }, '!'],
            },
          },
        },
      };
      expect(module.module.name).toBe('Test Module');
      expect(module.functions.main.logic).toBe('Hello, World!');
    });

    it('should allow single output', () => {
      const module: FrankaModule = {
        module: { name: 'Test' },
        functions: {
          main: {
            output: { type: 'string' },
            logic: 'test',
          },
        },
      };
      expect(isSingleOutput(module.functions.main.output!)).toBe(true);
    });

    it('should allow multiple outputs', () => {
      const module: FrankaModule = {
        module: { name: 'Test' },
        functions: {
          main: {
            output: {
              result: { type: 'string' },
              count: { type: 'number' },
            },
            logic: {
              set: {
                result: 'success',
                count: 42,
              },
            },
          },
        },
      };
      expect(isMultipleOutputs(module.functions.main.output!)).toBe(true);
    });
  });

  describe('FrankaExpression', () => {
    it('should allow primitive values', () => {
      const expr1: FrankaExpression = 'hello';
      const expr2: FrankaExpression = 42;
      const expr3: FrankaExpression = true;
      const expr4: FrankaExpression = null;
      expect(isPrimitiveValue(expr1)).toBe(true);
      expect(isPrimitiveValue(expr2)).toBe(true);
      expect(isPrimitiveValue(expr3)).toBe(true);
      expect(isPrimitiveValue(expr4)).toBe(true);
    });

    it('should allow operation objects', () => {
      const expr: FrankaExpression = { get: 'variable' };
      expect(isOperation(expr)).toBe(true);
    });

    it('should allow arrays', () => {
      const expr: FrankaExpression = [{ get: 'x' }, { concat: '!' }];
      expect(isArray(expr)).toBe(true);
    });
  });
});
