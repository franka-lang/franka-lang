import { FrankaInterpreter } from './interpreter';

describe('FrankaInterpreter - Nested Output Setting', () => {
  let interpreter: FrankaInterpreter;

  beforeEach(() => {
    interpreter = new FrankaInterpreter();
  });

  describe('outputs at non-leaf nodes', () => {
    it('should allow setting outputs at non-leaf level in flat if/else', () => {
      // Example from the issue: set foo=1 at non-leaf, then set bar based on cond2
      const program = {
        program: { name: 'Test' },
        input: {
          cond1: { type: 'boolean' as const, default: true },
          cond2: { type: 'boolean' as const, default: true },
        },
        output: {
          foo: { type: 'number' as const },
          bar: { type: 'string' as const },
        },
        logic: {
          if: { get: 'cond1' },
          then: [
            { set: { foo: 1 } },
            {
              if: { get: 'cond2' },
              then: { set: { bar: 'A' } },
              else: { set: { bar: 'B' } },
            },
          ],
          else: {
            set: { foo: 2, bar: 'C' },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ foo: 1, bar: 'A' });
    });

    it('should propagate outputs when cond2 is false', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          cond1: { type: 'boolean' as const, default: true },
          cond2: { type: 'boolean' as const, default: false },
        },
        output: {
          foo: { type: 'number' as const },
          bar: { type: 'string' as const },
        },
        logic: {
          if: { get: 'cond1' },
          then: [
            { set: { foo: 1 } },
            {
              if: { get: 'cond2' },
              then: { set: { bar: 'A' } },
              else: { set: { bar: 'B' } },
            },
          ],
          else: {
            set: { foo: 2, bar: 'C' },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ foo: 1, bar: 'B' });
    });

    it('should use else branch when cond1 is false', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          cond1: { type: 'boolean' as const, default: false },
          cond2: { type: 'boolean' as const, default: true },
        },
        output: {
          foo: { type: 'number' as const },
          bar: { type: 'string' as const },
        },
        logic: {
          if: { get: 'cond1' },
          then: [
            { set: { foo: 1 } },
            {
              if: { get: 'cond2' },
              then: { set: { bar: 'A' } },
              else: { set: { bar: 'B' } },
            },
          ],
          else: {
            set: { foo: 2, bar: 'C' },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ foo: 2, bar: 'C' });
    });

    it('should handle multiple levels of nesting', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          cond1: { type: 'boolean' as const, default: true },
          cond2: { type: 'boolean' as const, default: true },
          cond3: { type: 'boolean' as const, default: false },
        },
        output: {
          a: { type: 'number' as const },
          b: { type: 'number' as const },
          c: { type: 'number' as const },
        },
        logic: {
          if: { get: 'cond1' },
          then: [
            { set: { a: 1 } },
            {
              if: { get: 'cond2' },
              then: [
                { set: { b: 2 } },
                {
                  if: { get: 'cond3' },
                  then: { set: { c: 3 } },
                  else: { set: { c: 4 } },
                },
              ],
              else: { set: { b: 5, c: 6 } },
            },
          ],
          else: {
            set: { a: 7, b: 8, c: 9 },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ a: 1, b: 2, c: 4 });
    });

    it('should allow overriding outputs at deeper levels', () => {
      // If a deeper level sets the same output, it should override
      const program = {
        program: { name: 'Test' },
        input: {
          cond1: { type: 'boolean' as const, default: true },
          cond2: { type: 'boolean' as const, default: true },
        },
        output: {
          foo: { type: 'number' as const },
          bar: { type: 'string' as const },
        },
        logic: {
          if: { get: 'cond1' },
          then: [
            { set: { foo: 1, bar: 'initial' } },
            {
              if: { get: 'cond2' },
              then: { set: { bar: 'overridden' } },
              else: { set: { bar: 'B' } },
            },
          ],
          else: {
            set: { foo: 2, bar: 'C' },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ foo: 1, bar: 'overridden' });
    });

    it('should work with if-chain syntax', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          score: { type: 'number' as const, default: 85 },
          bonus: { type: 'boolean' as const, default: true },
        },
        output: {
          grade: { type: 'string' as const },
          passed: { type: 'boolean' as const },
          message: { type: 'string' as const },
        },
        logic: [
          {
            if: { equals: { left: { get: 'score' }, right: 100 } },
            then: { set: { grade: 'A+', passed: true, message: 'Perfect!' } },
          },
          {
            if: { equals: { left: { get: 'score' }, right: 85 } },
            then: [
              { set: { grade: 'B+', passed: true } },
              {
                if: { get: 'bonus' },
                then: { set: { message: 'Great with bonus!' } },
                else: { set: { message: 'Great job!' } },
              },
            ],
          },
          {
            else: { set: { grade: 'F', passed: false, message: 'Keep trying!' } },
          },
        ],
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ grade: 'B+', passed: true, message: 'Great with bonus!' });
    });
  });
});
