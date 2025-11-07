# Franka Language Examples

This directory contains example Franka programs demonstrating the YAML-based syntax.

## Examples

### hello.franka
A simple "Hello World" program that demonstrates the basic program structure.

### string-operations.franka
Demonstrates string manipulation operations including:
- String concatenation (`concat`)
- Uppercase conversion (`uppercase`)
- Lowercase conversion (`lowercase`)

### boolean-logic.franka
Demonstrates boolean operations including:
- Logical AND (`and`)
- Logical OR (`or`)
- Logical NOT (`not`)
- Conditional execution (`if`)

### conditional-string.franka
Combines boolean and string operations to show how they work together:
- Equality comparison (`equals`)
- Conditional logic with string manipulation

## Running Examples

To run any of these examples (once the interpreter is implemented):

```bash
npm run cli -- run examples/hello.franka
```

## Syntax Overview

Franka programs are written in YAML format with the following structure:

```yaml
program:
  name: "Program Name"
  description: "Program description"

variables:
  variable_name: value
  another_var: value

operations:
  - operation: operation_name
    parameters: values
```

Variables are referenced using the `$variable_name` syntax.

## Supported Operations

### String Operations
- `concat`: Concatenate strings
- `length`: Get string length
- `substring`: Extract substring
- `uppercase`: Convert to uppercase
- `lowercase`: Convert to lowercase

### Boolean Operations
- `and`: Logical AND
- `or`: Logical OR
- `not`: Logical NOT
- `equals`: Equality comparison

### Control Operations
- `if`: Conditional execution
- `print`: Print value
- `assign`: Assign value to variable
