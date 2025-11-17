# Franka Programming Language

The language of collaboration - A programming language designed for clear communication and collaborative development.

## Overview

Franka is a modern programming language with a self-documenting specification defined in YAML format. Modules are written in YAML format using structured operations for clear and collaborative development. This repository contains the language specification and TypeScript-based tooling including a CLI, MCP (Model Context Protocol) server, and Web API server.

## Language Features

- **YAML-Based Syntax**: Modules and functions are written in structured YAML format
- **Module System**: Organize functions into modules for better code organization
- **Pure Functional**: No side effects - functions evaluate to values
- **Self-Documenting Specification**: Language specification in YAML format (`spec/language.yaml`)
- **Let/In Bindings**: Declarative variable bindings with lexical scoping
- **String Operations**: concat, uppercase, lowercase, length, substring
- **Boolean Operations**: and, or, not, equals
- **Control Flow**: if/then/else conditional logic
- **Operation Chaining**: Chain operations together like pipe operators (|>) in functional languages
- **Input/Output Operations**: 
  - `get: varname` - Reference input variables
  - `set: { output: value }` - Set named outputs
- **CLI Tool**: Command-line interface for running and checking Franka modules
- **MCP Server**: Model Context Protocol server for AI integration
- **Web API Server**: RESTful API for accessing language specification
- **TypeScript Implementation**: Modern, type-safe tooling
- **Comprehensive Testing**: Unit tests with Jest
- **Code Quality**: ESLint and Prettier for code quality and consistency

## Installation

```bash
npm install
```

## Usage

### Build the Project

```bash
npm run build
```

### CLI Tool

Run the Franka CLI:

```bash
# Using npm script
npm run cli -- --help

# After building
node dist/cli/index.js --help

# Available commands
npm run cli -- version                    # Show version
npm run cli -- run <file>                 # Run a Franka module/program
npm run cli -- run <file> -f <function>   # Run specific function in a module
npm run cli -- check <file>               # Check syntax and run tests
npm run cli -- check <file> -f <function> # Check specific function
npm run cli -- repl                       # Start REPL (coming soon)
```

#### Running Example Modules

```bash
# Run hello world example
npm run cli -- run examples/hello.yaml

# Run string operations example
npm run cli -- run examples/string-operations.yaml

# Run boolean logic example
npm run cli -- run examples/boolean-logic.yaml

# Run a specific function in a module (if module has multiple functions)
npm run cli -- run examples/issue-example-v1.yaml -f version1

# Check syntax and run tests (if spec file exists)
npm run cli -- check examples/hello.yaml
```

#### Module Testing with Spec Files

Franka supports automatic testing through spec files. Create a file named `<filename>.spec.yaml` alongside your module file.

##### Spec File Format

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

The `check` command automatically discovers and runs spec files:

```bash
# Check all functions and run all tests in a module
npm run cli -- check examples/multi-function.yaml

# Check and test a specific function
npm run cli -- check examples/multi-function.yaml -f greet
```

See [examples/multi-function.yaml](examples/multi-function.yaml) and [examples/multi-function.spec.yaml](examples/multi-function.spec.yaml) for a complete example.

### MCP Server

Start the Model Context Protocol server:

```bash
# Default port (3001)
npm run mcp

# Custom port
npm run mcp -- --port=3002
```

The MCP server provides AI integration capabilities for working with Franka modules. It includes:

#### Available Tools

1. **get-keywords** - Get all language operations and keywords
   - Returns string, boolean, and control operations
   - Useful for understanding available language features

2. **get-language-syntax** - Get complete Franka language syntax specification
   - Returns full syntax documentation including module structure
   - Includes examples demonstrating language features
   - Essential for understanding how to write valid Franka code

3. **create-module** - Create a new Franka module
   - Creates a new module file with specified functions
   - Validates module structure before creation
   - Parameters:
     - `filePath`: Where to create the module (must end with .yaml or .yml)
     - `moduleName`: Name of the module
     - `moduleDescription`: Optional description
     - `functions`: Object containing function definitions (at least one required)
   - Each function must have a `logic` field

4. **read-module** - Read an existing Franka module
   - Parses and returns the complete module structure
   - Includes metadata and all function definitions
   - Parameter: `filePath` - Path to the module file

5. **update-module** - Update an existing Franka module
   - Add new functions, modify existing functions, or remove functions
   - Update module metadata (name, description)
   - Parameters:
     - `filePath`: Path to the module to update
     - `moduleName`: Optional new module name
     - `moduleDescription`: Optional new module description
     - `addFunctions`: Functions to add (must not already exist)
     - `updateFunctions`: Functions to modify (must already exist)
     - `removeFunctions`: Array of function names to remove

6. **delete-module** - Delete a Franka module
   - Removes the module file and optionally its spec file
   - Parameters:
     - `filePath`: Path to the module to delete
     - `deleteSpec`: Whether to also delete the spec file (default: true)

7. **check-module** - Check a Franka module for syntax and run tests
   - Validates module syntax by loading and parsing it
   - Automatically discovers and runs spec file tests if present
   - Returns detailed results including test pass/fail status
   - Parameters:
     - `filePath`: Path to the module to check
     - `functionName`: Optional specific function to check

8. **create-spec-file** - Create or update a test specification file
   - Creates test cases for module functions
   - Follows naming convention: `<module_name>.spec.yaml`
   - Parameters:
     - `modulePath`: Path to the module
     - `tests`: Object mapping function names to test arrays
   - Each test case includes:
     - `description`: Optional test description
     - `input`: Optional input values
     - `expectedOutput`: Expected output value or object

#### Available Resources

- `franka://spec/syntax` - Language syntax specification
- `franka://spec/examples` - Code examples
- `franka://spec/metadata` - Language metadata
- `franka://spec/complete` - Complete specification

#### Example MCP Usage

Create a simple calculator module:

```json
{
  "name": "create-module",
  "arguments": {
    "filePath": "./calculator.yaml",
    "moduleName": "Calculator",
    "moduleDescription": "Simple arithmetic operations",
    "functions": {
      "add": {
        "description": "Add two numbers",
        "input": {
          "a": {"type": "number", "default": 0},
          "b": {"type": "number", "default": 0}
        },
        "logic": {
          "concat": [
            {"get": "a"},
            " + ",
            {"get": "b"}
          ]
        }
      }
    }
  }
}
```

Add tests for the module:

```json
{
  "name": "create-spec-file",
  "arguments": {
    "modulePath": "./calculator.yaml",
    "tests": {
      "add": {
        "tests": [
          {
            "description": "Add 5 and 3",
            "input": {"a": 5, "b": 3},
            "expectedOutput": "5 + 3"
          }
        ]
      }
    }
  }
}
```

Check the module and run tests:

```json
{
  "name": "check-module",
  "arguments": {
    "filePath": "./calculator.yaml"
  }
}
```

### Web Server

Start the web API server:

```bash
# Default port (3000)
npm run web

# Custom port
npm run web -- --port=8080
```

The web server provides a RESTful API with the following endpoints:

- `GET /` - API documentation
- `GET /api/spec` - Complete language specification
- `GET /api/spec/metadata` - Language metadata
- `GET /api/spec/syntax` - Syntax specification
- `GET /api/spec/examples` - Code examples
- `GET /api/keywords` - Language keywords
- `GET /api/operators` - Language operators
- `GET /api/version` - Version information
- `GET /health` - Health check

## Development

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Development Mode

```bash
# Run CLI in development mode
npm run dev -- --help

# Run web server in development mode
npm run web

# Run MCP server in development mode
npm run mcp
```

## Project Structure

```
franka-lang/
├── spec/                  # Language specification
│   └── language.yaml      # Self-documenting YAML spec
├── examples/              # Example Franka programs
│   ├── hello.yaml         # Hello world
│   ├── string-operations.yaml
│   ├── boolean-logic.yaml
│   ├── conditional-string.yaml
│   └── README.md          # Examples documentation
├── src/
│   ├── cli/              # Command-line interface
│   │   └── index.ts
│   ├── mcp/              # MCP server
│   │   └── index.ts
│   ├── web/              # Web API server
│   │   └── index.ts
│   ├── shared/           # Shared utilities
│   │   ├── spec-loader.ts
│   │   ├── spec-loader.test.ts
│   │   ├── interpreter.ts
│   │   └── interpreter.test.ts
│   └── index.ts          # Main library entry
├── dist/                 # Compiled output (generated)
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest configuration
├── eslint.config.mjs     # ESLint configuration
├── .prettierrc.json      # Prettier configuration
├── .gitignore           # Git ignore rules
└── package.json         # Project metadata and scripts
```

## Language Specification

The Franka language specification is defined in `spec/language.yaml` and includes:

- **Metadata**: Language name, version, description, file extensions, syntax format
- **Syntax**: Program structure, operations (string, boolean, control)
- **Semantics**: Scoping rules, type system, evaluation strategy, variable references
- **Tooling**: CLI commands, MCP capabilities, web features
- **Examples**: Code samples demonstrating language features

### Module Structure

Franka is a pure functional language where modules contain functions that evaluate to values:

```yaml
module:
  name: "Module Name"
  description: "Module description"

main:
  description: "Function description"
  input:
    greeting:
      type: string
      default: "Hello"
    name:
      type: string
      default: "World"

  output:
    type: string
    # OR multiple named outputs:
    # result:
    #   type: string
    # count:
    #   type: number

  logic:
    # Use let/in for local bindings
    let:
      message:
        concat:
          - get: greeting
          - ", "
          - get: name
          - "!"
    in:
      get: message
```

For functions with multiple named outputs, use the `set` operation:

```yaml
main:
  output:
    greeting:
      type: string
    length:
      type: number

  logic:
    let:
      msg:
        concat:
          - get: greeting
          - ", "
          - get: name
    in:
      set:
        greeting:
          get: msg
        length:
          length:
            get: msg
```

#### Input and Output Sections

- **Input**: Declares typed input variables with optional default values
  - Supports `string`, `number`, and `boolean` types
  - Default values are optional
  - Variables with defaults are available in the logic

- **Output**: Declares the expected output type(s) from the program
  - Supports `string`, `number`, and `boolean` types
  - No default values allowed
  - Can be a single unnamed output: `output: type: string`
  - Or multiple named outputs: `output: result: type: string\n count: type: number`
  - Output declarations are for documentation and validation purposes

### Supported Operations

#### Let Bindings
- `let`: Define local variable bindings with lexical scoping
  - Uses flat syntax where `let` and `in` are at the same indentation level
  - Each binding defines a variable name and its value
  - The `in` logic specifies what to evaluate with those bindings
  - Bindings can reference earlier bindings in the same let block

#### Input/Output Operations
- `get: varname`: Get an input variable value by name
  - Example: `get: username`
  
- `set: { output: value }`: Set one or more named output values
  - Used with multiple named outputs defined in the output section
  - Can set multiple outputs in a single operation
  - Can be placed at any node of an if/else tree
  - Example: `set: { result: "Success", count: 42 }`
  - When `set` is used, the program returns an object with output names and values

#### String Operations
- `concat`: Concatenate strings (accepts array or named args)
- `uppercase`: Convert string to uppercase (accepts value directly or as named arg)
- `lowercase`: Convert string to lowercase (accepts value directly or as named arg)
- `length`: Get string length (accepts value directly or as named arg)
- `substring`: Extract substring (requires named args: value, start, end)

#### Boolean Operations
- `and`: Logical AND operation (accepts array or named args)
- `or`: Logical OR operation (accepts array or named args)
- `not`: Logical NOT operation (accepts value directly or as named arg)
- `equals`: Equality comparison (requires named args: left, right)

#### Control Operations
- `if`: Conditional logic that returns a value based on condition
  - Supports two syntax variants:
    1. **Flat syntax**: `if: <expr>`, `then: <expr>`, `else: <expr>` on same level
    2. **Chaining syntax**: List of `if`/`then` pairs with final `else` for if-elif-else patterns
  - The condition is evaluated, and returns `then` logic if true, `else` logic if false
  - The `else` branch is optional

#### Operation Chaining
Chain operations together where each operation receives the result of the previous one, similar to pipe operators (`|>`) in functional languages like Elm.

**Syntax**: A list of operations where each receives the output of the previous operation

```yaml
logic:
  - get: greeting      # Get initial value
  - uppercase          # Transform to uppercase
  - concat: " world!"  # Append text
```

**Features**:
- First operation is typically `get` to retrieve a value
- Subsequent operations can be written as simple names (e.g., `uppercase`) for operations without parameters
- Operations with parameters (e.g., `concat: " world!"`) receive the piped value as the first input
- Chains must have at least 2 elements
- Supports all string operations: `uppercase`, `lowercase`, `length`, `substring`, `concat`
- Supports boolean operations: `not`, `and`, `or`, `equals`
- Can be used within let bindings or as the main logic

**Example**:
```yaml
let:
  message:
    - get: greeting
    - uppercase
    - concat:
        - ", "
        - get: name
    - concat: "!"
in:
  get: message
```

This is equivalent to Elm's:
```elm
greeting
  |> uppercase
  |> (\s -> concat [s, ", ", name])
  |> (\s -> concat [s, "!"])
```

View the specification file directly or access it programmatically through the API.

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run CLI in development mode |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run cli` | Run the CLI tool |
| `npm run mcp` | Start MCP server |
| `npm run web` | Start web API server |

## Contributing

This project uses:
- TypeScript for type-safe development
- ESLint for code quality
- Prettier for code formatting
- Jest for testing

Please ensure all tests pass and code is properly formatted before submitting changes.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Version

Current version: 1.0.0

For version information, run:
```bash
npm run cli -- version
```
