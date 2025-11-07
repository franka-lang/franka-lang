import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type FrankaValue = string | number | boolean | null;

export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  variables?: Record<string, FrankaValue>;
  operations: FrankaOperation[];
}

export interface FrankaOperation {
  [key: string]: any; // Operation name as key, parameters as value
}

export class FrankaInterpreter {
  private variables: Record<string, FrankaValue> = {};
  private output: string[] = [];

  loadProgram(filePath: string): FrankaProgram {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as FrankaProgram;
  }

  execute(program: FrankaProgram): string[] {
    this.output = [];
    this.variables = program.variables ? { ...program.variables } : {};

    for (const operation of program.operations) {
      this.executeOperation(operation);
    }

    return this.output;
  }

  executeFile(filePath: string): string[] {
    const program = this.loadProgram(filePath);
    return this.execute(program);
  }

  private executeOperation(operation: FrankaOperation): any {
    // Get the operation name (first key in the object)
    const operationName = Object.keys(operation)[0];
    const operationArgs = operation[operationName];

    switch (operationName) {
      case 'print':
        return this.executePrint(operationArgs);
      case 'assign':
        return this.executeAssign(operationArgs);
      case 'concat':
        return this.executeConcat(operationArgs);
      case 'uppercase':
        return this.executeUppercase(operationArgs);
      case 'lowercase':
        return this.executeLowercase(operationArgs);
      case 'length':
        return this.executeLength(operationArgs);
      case 'substring':
        return this.executeSubstring(operationArgs);
      case 'and':
        return this.executeAnd(operationArgs);
      case 'or':
        return this.executeOr(operationArgs);
      case 'not':
        return this.executeNot(operationArgs);
      case 'equals':
        return this.executeEquals(operationArgs);
      case 'if':
        return this.executeIf(operationArgs);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  private resolveValue(value: any): any {
    if (typeof value === 'string' && value.startsWith('$')) {
      const varName = value.substring(1);
      if (!(varName in this.variables)) {
        throw new Error(`Undefined variable: ${varName}`);
      }
      return this.variables[varName];
    }

    // Check if value is an operation (object with operation name as key)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length > 0) {
        // This is likely an operation call
        return this.executeOperation(value);
      }
    }

    return value;
  }

  private executePrint(args: any): void {
    // args can be a direct value or an object with named parameters
    const value = typeof args === 'object' && args !== null && !Array.isArray(args) && 'value' in args
      ? this.resolveValue(args.value)
      : this.resolveValue(args);
    this.output.push(String(value));
  }

  private executeAssign(args: any): void {
    // args should be an object with 'variable' and 'value' keys
    const variable = args.variable;
    const value = this.resolveValue(args.value);
    this.variables[variable] = value;
  }

  private executeConcat(args: any): string {
    // args can be an array or an object with 'values' key
    const values = Array.isArray(args) ? args : args.values;
    return values.map((v: any) => this.resolveValue(v)).join('');
  }

  private executeUppercase(args: any): string {
    // args can be a direct value or an object with 'value' key
    const value = typeof args === 'object' && args !== null && !Array.isArray(args) && 'value' in args
      ? this.resolveValue(args.value)
      : this.resolveValue(args);
    return String(value).toUpperCase();
  }

  private executeLowercase(args: any): string {
    // args can be a direct value or an object with 'value' key
    const value = typeof args === 'object' && args !== null && !Array.isArray(args) && 'value' in args
      ? this.resolveValue(args.value)
      : this.resolveValue(args);
    return String(value).toLowerCase();
  }

  private executeLength(args: any): number {
    // args can be a direct value or an object with 'value' key
    const value = typeof args === 'object' && args !== null && !Array.isArray(args) && 'value' in args
      ? this.resolveValue(args.value)
      : this.resolveValue(args);
    return String(value).length;
  }

  private executeSubstring(args: any): string {
    // args should be an object with 'value', 'start', and optionally 'end'
    const value = this.resolveValue(args.value);
    const start = this.resolveValue(args.start);
    const end = args.end !== undefined ? this.resolveValue(args.end) : undefined;
    return String(value).substring(start, end);
  }

  private executeAnd(args: any): boolean {
    // args can be an array or an object with 'values' key
    const values = Array.isArray(args) ? args : args.values;
    return values.map((v: any) => this.resolveValue(v)).every((v: any) => Boolean(v));
  }

  private executeOr(args: any): boolean {
    // args can be an array or an object with 'values' key
    const values = Array.isArray(args) ? args : args.values;
    return values.map((v: any) => this.resolveValue(v)).some((v: any) => Boolean(v));
  }

  private executeNot(args: any): boolean {
    // args can be a direct value or an object with 'value' key
    const value = typeof args === 'object' && args !== null && !Array.isArray(args) && 'value' in args
      ? this.resolveValue(args.value)
      : this.resolveValue(args);
    return !Boolean(value);
  }

  private executeEquals(args: any): boolean {
    // args should be an object with 'left' and 'right' keys
    const left = this.resolveValue(args.left);
    const right = this.resolveValue(args.right);
    return left === right;
  }

  private executeIf(args: any): void {
    // args should be an object with 'condition', 'then', and optionally 'else'
    const condition = this.resolveValue(args.condition);

    if (Boolean(condition)) {
      if (args.then) {
        for (const op of args.then) {
          this.executeOperation(op);
        }
      }
    } else {
      if (args.else) {
        for (const op of args.else) {
          this.executeOperation(op);
        }
      }
    }
  }
}
