# Franka Language Examples

This directory contains example Franka programs demonstrating the YAML-based syntax.

## Examples

### hello.yaml
A simple "Hello World" program that demonstrates the basic program structure and returns a greeting value.

**Spec file:** `hello.spec.yaml` - Contains 2 test cases validating the default output.

### string-operations.yaml
Demonstrates string manipulation operations using let/in bindings including:
- String concatenation (`concat`)
- Uppercase conversion (`uppercase`)
- Lowercase conversion (`lowercase`)

**Spec file:** `string-operations.spec.yaml` - Contains 4 test cases covering default inputs, custom inputs, edge cases with empty strings, and single character strings.

### boolean-logic.yaml
Demonstrates boolean operations using let/in bindings including:
- Logical AND (`and`)
- Logical OR (`or`)
- Logical NOT (`not`)
- Conditional execution (`if`)

**Spec file:** `boolean-logic.spec.yaml` - Contains 4 test cases testing different combinations of boolean inputs (valid/invalid, admin/non-admin).

### conditional-string.yaml
Combines boolean and string operations with nested let/in bindings to show how they work together:
- Equality comparison (`equals`)
- Conditional logic with string manipulation

**Spec file:** `conditional-string.spec.yaml` - Contains 3 test cases for matching and non-matching username scenarios.

### if-chaining.yaml
Demonstrates if-then chaining syntax for handling multiple conditional branches:
- Chain multiple `if`/`then` conditions in a list
- Final `else` clause for default fallback
- Useful for implementing if-elif-else patterns

### output-single.yaml
Demonstrates a program with a single unnamed output declaration:
- Uses `output: type: string` syntax
- Shows how to document the expected output type
- Combines input with default values and output declaration

### output-multiple.yaml
Demonstrates a program with multiple named output declarations:
- Documents multiple outputs with descriptive names
- Each output has its own type specification
- Useful for programs that conceptually produce multiple results

### get-set-basic.yaml
Demonstrates the `get` and `set` operations for input/output handling:
- Uses `get: varname` to reference input variables
- Uses `set: { output: value }` to set multiple named outputs
- Shows how to use both operations together in a program

### conditional-outputs.yaml
Demonstrates setting different outputs based on conditions:
- Uses `get` for input variable references
- Uses `set` at different nodes in an if/else tree
- Shows how to conditionally set multiple named outputs
- Demonstrates if-then chaining with set operations

### issue-example-v1.yaml and issue-example-v2.yaml
Example modules demonstrating semantically equivalent ways to set outputs:
- `version1`: Sets `foo` at non-leaf level using sequences
- `version2`: Fully expanded version with `foo` set at all leaves
- Both produce identical results for all input combinations

**Spec files:** `issue-example-v1.spec.yaml` and `issue-example-v2.spec.yaml` - Demonstrate the new multi-function spec format with tests grouped by function name.

### multi-function.yaml
Comprehensive example of a module with multiple functions:
- `greet`: Returns a greeting message
- `farewell`: Returns a farewell message  
- `shout`: Returns message in uppercase

**Spec file:** `multi-function.spec.yaml` - Demonstrates the new multi-function spec format, testing all three functions in a single spec file.

## Running Examples

To run any of these examples:

```bash
npm run cli -- run examples/hello.yaml
```

To run a specific function in a module:

```bash
npm run cli -- run examples/multi-function.yaml -f greet
```

To check syntax and run tests (if a spec file exists):

```bash
npm run cli -- check examples/hello.yaml

# Check and test a specific function
npm run cli -- check examples/multi-function.yaml -f farewell

# Check all functions in a module and run all tests
npm run cli -- check examples/multi-function.yaml
```

## Module Testing with Spec Files

Franka modules and programs can have associated spec files that define test cases to validate behavior. Spec files follow the naming convention `<filename>.spec.yaml`.

### Spec File Formats

#### Legacy Format (Single Function)

For single-function programs or when testing one function at a time:

```yaml
tests:
  - description: "Test case description (optional)"
    input:
      variable_name: value
      another_var: value
    expectedOutput: "Expected result"
    
  - description: "Another test case"
    input:
      variable_name: different_value
    expectedOutput: "Different result"
```

This format works with both program and module files. When used with modules, tests apply to the specified function (via `-f` flag) or the first function if no flag is provided.

#### Multi-Function Format (Recommended for Modules)

For modules with multiple functions, group tests by function name:

```yaml
functions:
  greet:
    tests:
      - description: "Default greeting"
        expectedOutput: "Hello, World!"
      - description: "Custom greeting"
        input:
          name: "Franka"
        expectedOutput: "Hello, Franka!"
  
  farewell:
    tests:
      - description: "Default farewell"
        expectedOutput: "Goodbye, World!"
```

This format allows testing multiple functions in a single spec file. When you run `check`:
- Without `-f` flag: Runs tests for all functions in the spec
- With `-f functionName` flag: Runs tests only for that specific function

### Test Case Structure

**Key elements:**
- `description`: Human-readable description of the test (optional)
- `input`: Object mapping input variable names to test values (optional)
- `expectedOutput`: The expected output from the function (required)
  - For single output: a value (string, number, boolean)
  - For multiple named outputs: an object with output names and values

### Running Tests

When you run the `check` command, it automatically discovers and runs spec files:

```bash
# Legacy format - check single-function program
npm run cli -- check examples/hello.yaml

# Multi-function format - check all functions and run all tests
npm run cli -- check examples/multi-function.yaml

# Multi-function format - check specific function and run its tests
npm run cli -- check examples/multi-function.yaml -f greet

# Output:
# Checking Franka program: examples/multi-function.yaml
# ✓ Syntax is valid (Module format)
# ✓ Module name: Multi-function Module
# ...
# --- Running Tests ---
# Found spec file: examples/multi-function.spec.yaml
# ✓ Test 1: [greet] Default greeting
# ✓ Test 2: [greet] Custom name greeting
# ✓ Test 3: [greet] Empty name greeting
# ✓ Test 4: [farewell] Default farewell
# ✓ Test 5: [farewell] Custom name farewell
# ✓ Test 6: [farewell] Empty name farewell
# ✓ Test 7: [shout] Default shout
# ✓ Test 8: [shout] Custom message shout
# ✓ Test 9: [shout] Already uppercase message
# Test Results: 9 passed, 0 failed
```

If tests fail, detailed error messages are shown:

```bash
# ✗ Test 1: This test should fail
#   Error: Output mismatch
#   Expected: "Wrong output"
#   Actual: "Hello, Franka!"
```

### Example Spec Files

Check out the existing spec files in this directory:

**Legacy format:**
- `hello.spec.yaml` - Basic test cases for single-function module
- `string-operations.spec.yaml` - Multiple test cases with different inputs
- `boolean-logic.spec.yaml` - Boolean input combinations
- `conditional-string.spec.yaml` - Conditional logic tests
- `output-multiple.spec.yaml` - Tests for programs with multiple named outputs

**Multi-function format:**
- `multi-function.spec.yaml` - Tests for three different functions (greet, farewell, shout) in one file
- `issue-example-v1.spec.yaml` - Tests for version1 function with multiple output scenarios
- `issue-example-v2.spec.yaml` - Tests for version2 function demonstrating equivalence

## Syntax Overview

Franka is a pure functional language. Programs are written in YAML format and evaluate to a single value:

```yaml
program:
  name: "Program Name"
  description: "Program description"

input:
  variable_name:
    type: string
    default: value
  another_var:
    type: string
    default: value

output:
  type: string
  # OR multiple named outputs:
  # result:
  #   type: string
  # count:
  #   type: number

logic:
  # Simple value logic
  "Hello, World!"
  
  # Or use let/in for bindings
  let:
    result: "Success"
    message:
      concat:
        - "Hello, "
        - get: name
    in:
      get: message
```

Variables are referenced using the `get: varname` syntax:

```yaml
get: variable_name
```

For programs with multiple named outputs, use the `set` operation to return an object:

```yaml
output:
  greeting:
    type: string
  count:
    type: number

logic:
  set:
    greeting: "Hello, World!"
    count: 42
```

## Supported Operations

### Input/Output Operations
- `get: varname`: Get an input variable value by name
  ```yaml
  get: username
  ```
- `set: { output: value }`: Set one or more named output values
  ```yaml
  set:
    result: "Success"
    count: 42
  ```
  - Can be used at any node in an if/else tree
  - Returns an object with output names and values

### Let Bindings
- `let`: Define local bindings with logic to evaluate
  ```yaml
  let:
    x: 5
    y: 10
    sum: 15
    in:
      get: sum
  ```

### String Operations
- `concat`: Concatenate strings (array or named args)
  ```yaml
  concat:
    - "Hello, "
    - get: name
  ```
- `length`: Get string length
  ```yaml
  length:
    get: text
  ```
- `substring`: Extract substring
  ```yaml
  substring:
    value:
      get: text
    start: 0
    end: 5
  ```
- `uppercase`: Convert to uppercase
  ```yaml
  uppercase:
    get: text
  ```
- `lowercase`: Convert to lowercase
  ```yaml
  lowercase:
    get: text
  ```

### Boolean Operations
- `and`: Logical AND (array or named args)
  ```yaml
  and:
    - true
    - get: condition
  ```
- `or`: Logical OR (array or named args)
  ```yaml
  or:
    - false
    - get: condition
  ```
- `not`: Logical NOT
  ```yaml
  not:
    get: condition
  ```
- `equals`: Equality comparison
  ```yaml
  equals:
    left:
      get: value1
    right:
      get: value2
  ```

### Control Operations
- `if`: Conditional logic that returns a value
  - **Flat syntax (recommended)**:
    ```yaml
    if:
      get: is_valid
    then: "Valid!"
    else: "Invalid!"
    ```
  - **Nested syntax (legacy)**:
    ```yaml
    if:
      condition:
        get: is_valid
      then: "Valid!"
      else: "Invalid!"
    ```
  - **Chaining syntax**:
    ```yaml
    - if:
        get: condition1
      then: "Result 1"
    - if:
        get: condition2
      then: "Result 2"
    - else: "Default"
    ```
