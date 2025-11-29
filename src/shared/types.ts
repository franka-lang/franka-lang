/**
 * Type definitions for the Franka programming language structure.
 * This module provides a comprehensive type system that accurately captures
 * all language constructs including modules, functions, expressions, and operations.
 */

// ============================================================================
// Primitive Types and Values
// ============================================================================

/**
 * Base value types supported by Franka
 */
export type FrankaPrimitiveType = 'string' | 'number' | 'boolean';

/**
 * Franka primitive values - string, number, boolean, or null
 */
export type FrankaPrimitiveValue = string | number | boolean | null;

// ============================================================================
// Expression Types
// ============================================================================

/**
 * Get operation - retrieves a variable from scope
 */
export interface GetExpression {
  get: string;
}

/**
 * Set operation - sets one or more named output values
 */
export interface SetExpression {
  set: Record<string, FrankaExpression>;
}

/**
 * Concat operation - concatenates strings
 */
export interface ConcatExpression {
  concat: FrankaExpression[] | { values: FrankaExpression[] };
}

/**
 * Uppercase operation - converts string to uppercase
 */
export interface UppercaseExpression {
  uppercase: FrankaExpression | { value: FrankaExpression };
}

/**
 * Lowercase operation - converts string to lowercase
 */
export interface LowercaseExpression {
  lowercase: FrankaExpression | { value: FrankaExpression };
}

/**
 * Length operation - gets string length
 */
export interface LengthExpression {
  length: FrankaExpression | { value: FrankaExpression };
}

/**
 * Substring operation - extracts substring
 */
export interface SubstringExpression {
  substring: {
    value: FrankaExpression;
    start: FrankaExpression;
    end?: FrankaExpression;
  };
}

/**
 * And operation - logical AND
 */
export interface AndExpression {
  and: FrankaExpression[] | { values: FrankaExpression[] };
}

/**
 * Or operation - logical OR
 */
export interface OrExpression {
  or: FrankaExpression[] | { values: FrankaExpression[] };
}

/**
 * Not operation - logical NOT
 */
export interface NotExpression {
  not: FrankaExpression | { value: FrankaExpression };
}

/**
 * Equals operation - equality comparison
 */
export interface EqualsExpression {
  equals: {
    left: FrankaExpression;
    right: FrankaExpression;
  };
}

/**
 * Let binding - defines local variables with lexical scoping
 * Supports both nested and flat syntax
 */
export interface LetExpression {
  let: Record<string, FrankaExpression>;
  in: FrankaExpression;
}

/**
 * If/then/else conditional - flat syntax
 */
export interface IfExpression {
  if: FrankaExpression;
  then?: FrankaExpression;
  else?: FrankaExpression;
}

/**
 * If chain element - used in if/then/else chains
 */
export interface IfChainElement {
  if: FrankaExpression;
  then: FrankaExpression;
}

/**
 * Else clause - final fallback in if chains
 */
export interface ElseClause {
  else: FrankaExpression;
}

/**
 * Union of all operation types
 */
export type FrankaOperation =
  | GetExpression
  | SetExpression
  | ConcatExpression
  | UppercaseExpression
  | LowercaseExpression
  | LengthExpression
  | SubstringExpression
  | AndExpression
  | OrExpression
  | NotExpression
  | EqualsExpression
  | LetExpression
  | IfExpression
  | Record<string, unknown>; // Allow dynamic access for operation parsing

/**
 * Operation chain - array of operations where each receives the result of the previous
 * Similar to pipe operator (|>) in functional languages
 */
export type OperationChain = (FrankaOperation | string)[];

/**
 * If/then/else chain - array of if/then clauses with optional else at the end
 */
export type IfChain = (IfChainElement | ElseClause)[];

/**
 * Sequence - array of expressions executed in order
 */
export type Sequence = FrankaExpression[];

/**
 * Complete expression type - can be a primitive, operation, chain, or sequence
 */
export type FrankaExpression =
  | FrankaPrimitiveValue
  | FrankaOperation
  | OperationChain
  | IfChain
  | Sequence;

/**
 * Alias for FrankaExpression representing logic
 */
export type FrankaLogic = FrankaExpression;

/**
 * Alias for FrankaPrimitiveValue representing values
 */
export type FrankaValue = FrankaPrimitiveValue;

// ============================================================================
// Input/Output Definitions
// ============================================================================

/**
 * Input parameter definition with type and optional default value
 */
export interface InputDefinition {
  type: FrankaPrimitiveType;
  default?: FrankaValue;
}

/**
 * Output definition with type (no default values allowed)
 */
export interface OutputDefinition {
  type: FrankaPrimitiveType;
}

/**
 * Single unnamed output definition
 */
export interface SingleOutput {
  type: FrankaPrimitiveType;
}

/**
 * Multiple named outputs
 */
export type MultipleOutputs = Record<string, OutputDefinition>;

/**
 * Output can be either single unnamed or multiple named
 */
export type OutputDeclaration = SingleOutput | MultipleOutputs;

// ============================================================================
// Function and Module Structure
// ============================================================================

/**
 * Function definition within a module
 */
export interface FrankaFunction {
  description?: string;
  input?: Record<string, InputDefinition>;
  output?: OutputDeclaration;
  logic: FrankaLogic;
}

/**
 * Module metadata
 */
export interface ModuleMetadata {
  name: string;
  description?: string;
}

/**
 * Complete Franka module structure
 */
export interface FrankaModule {
  module: ModuleMetadata;
  functions: Record<string, FrankaFunction>;
}

/**
 * Legacy program structure (for backward compatibility)
 */
export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  input?: Record<string, InputDefinition>;
  output?: OutputDeclaration;
  logic: FrankaLogic;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if output is single unnamed
 */
export function isSingleOutput(output: OutputDeclaration): output is SingleOutput {
  return 'type' in output && typeof output.type === 'string';
}

/**
 * Type guard to check if output is multiple named
 */
export function isMultipleOutputs(output: OutputDeclaration): output is MultipleOutputs {
  return !isSingleOutput(output);
}

/**
 * Type guard to check if expression is a primitive value
 */
export function isPrimitiveValue(expr: FrankaExpression): expr is FrankaPrimitiveValue {
  return (
    expr === null ||
    typeof expr === 'string' ||
    typeof expr === 'number' ||
    typeof expr === 'boolean'
  );
}

/**
 * Type guard to check if expression is an operation object
 */
export function isOperation(expr: FrankaExpression): expr is FrankaOperation {
  return expr !== null && typeof expr === 'object' && !Array.isArray(expr);
}

/**
 * Type guard to check if expression is an array (chain or sequence)
 */
export function isArray(expr: FrankaExpression): expr is FrankaExpression[] {
  return Array.isArray(expr);
}

/**
 * Type guard to check if value is a GetExpression
 */
export function isGetExpression(expr: unknown): expr is GetExpression {
  return (
    expr !== null &&
    typeof expr === 'object' &&
    'get' in expr &&
    typeof (expr as GetExpression).get === 'string'
  );
}

/**
 * Type guard to check if value is a SetExpression
 */
export function isSetExpression(expr: unknown): expr is SetExpression {
  return (
    expr !== null &&
    typeof expr === 'object' &&
    'set' in expr &&
    typeof (expr as SetExpression).set === 'object'
  );
}

/**
 * Type guard to check if value is a LetExpression
 */
export function isLetExpression(expr: unknown): expr is LetExpression {
  return (
    expr !== null &&
    typeof expr === 'object' &&
    'let' in expr &&
    'in' in expr &&
    typeof (expr as LetExpression).let === 'object' &&
    !Array.isArray((expr as LetExpression).let)
  );
}

/**
 * Type guard to check if value is an IfExpression
 */
export function isIfExpression(expr: unknown): expr is IfExpression {
  return (
    expr !== null && typeof expr === 'object' && 'if' in expr && ('then' in expr || 'else' in expr)
  );
}

/**
 * Type guard to check if value is an IfChainElement
 */
export function isIfChainElement(expr: unknown): expr is IfChainElement {
  return (
    expr !== null && typeof expr === 'object' && 'if' in expr && 'then' in expr && !('else' in expr)
  );
}

/**
 * Type guard to check if value is an ElseClause
 */
export function isElseClause(expr: unknown): expr is ElseClause {
  return (
    expr !== null && typeof expr === 'object' && 'else' in expr && !('if' in expr && 'then' in expr)
  );
}
