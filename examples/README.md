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

To run any of these examples:

```bash
npm run cli -- run examples/hello.franka
```

## Syntax Overview

Franka programs are written in YAML format with operation names as keys:

```yaml
program:
  name: "Program Name"
  description: "Program description"

variables:
  variable_name: value
  another_var: value

operations:
  # Simple operation with direct value
  - print: "Hello, World!"
  
  # Operation with named arguments
  - assign:
      variable: "result"
      value: "Success"
  
  # Nested operations
  - assign:
      variable: "message"
      value:
        concat:
          - "Hello, "
          - "$name"
```

Variables are referenced using the `$variable_name` syntax.

## Supported Operations

### String Operations
- `concat`: Concatenate strings (array or named args)
  ```yaml
  concat:
    - "Hello, "
    - "$name"
  ```
- `length`: Get string length
  ```yaml
  length: "$text"
  ```
- `substring`: Extract substring
  ```yaml
  substring:
    value: "$text"
    start: 0
    end: 5
  ```
- `uppercase`: Convert to uppercase
  ```yaml
  uppercase: "$text"
  ```
- `lowercase`: Convert to lowercase
  ```yaml
  lowercase: "$text"
  ```

### Boolean Operations
- `and`: Logical AND (array or named args)
  ```yaml
  and:
    - true
    - "$condition"
  ```
- `or`: Logical OR (array or named args)
  ```yaml
  or:
    - false
    - "$condition"
  ```
- `not`: Logical NOT
  ```yaml
  not: "$condition"
  ```
- `equals`: Equality comparison
  ```yaml
  equals:
    left: "$value1"
    right: "$value2"
  ```

### Control Operations
- `if`: Conditional execution
  ```yaml
  if:
    condition: "$is_valid"
    then:
      - print: "Valid!"
    else:
      - print: "Invalid!"
  ```
- `print`: Print value
  ```yaml
  print: "Hello, World!"
  ```
- `assign`: Assign value to variable
  ```yaml
  assign:
    variable: "result"
    value: "Success"
  ```
