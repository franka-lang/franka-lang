#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadLanguageSpec } from '../shared/spec-loader';
import { FrankaInterpreter, FrankaFunction } from '../shared/interpreter';
import { SpecRunner } from '../shared/spec-runner';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function main() {
  const spec = loadLanguageSpec();

  // Create MCP server using the official SDK
  const server = new McpServer({
    name: spec.metadata.name,
    version: spec.metadata.version,
  });

  // Register tools for language operations

  // Tool: Get language keywords and operations
  server.registerTool(
    'get-keywords',
    {
      title: 'Get Language Keywords',
      description: 'Get all language operations and keywords',
      inputSchema: {},
      outputSchema: {
        operations: z.record(z.array(z.any())),
        string_operations: z.array(z.any()),
        boolean_operations: z.array(z.any()),
        control_operations: z.array(z.any()),
      },
    },
    async () => {
      const output = {
        operations: spec.syntax.operations,
        string_operations: spec.syntax.operations.string,
        boolean_operations: spec.syntax.operations.boolean,
        control_operations: spec.syntax.operations.control,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  // Tool: Get language syntax description
  server.registerTool(
    'get-language-syntax',
    {
      title: 'Get Language Syntax',
      description:
        'Get complete Franka language syntax specification including module structure, operations, and examples. Use this to understand how to write valid Franka code.',
      inputSchema: {},
      outputSchema: {
        syntax: z.any(),
        examples: z.array(z.any()),
      },
    },
    async () => {
      const output = {
        syntax: spec.syntax,
        examples: spec.examples,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  // Tool: Create a new Franka module
  server.registerTool(
    'create-module',
    {
      title: 'Create Module',
      description:
        'Create a new Franka module file. A module must contain "module" metadata and at least one function under "functions". Each function must have a "logic" field.',
      inputSchema: {
        filePath: z
          .string()
          .describe('File path where the module will be created (must end with .yaml or .yml)'),
        moduleName: z.string().describe('Name of the module'),
        moduleDescription: z
          .string()
          .optional()
          .describe('Optional description of the module'),
        functions: z
          .record(
            z.object({
              description: z.string().optional().describe('Function description'),
              input: z
                .record(
                  z.object({
                    type: z.enum(['string', 'number', 'boolean']),
                    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
                  })
                )
                .optional()
                .describe('Input parameters with types and optional defaults'),
              output: z
                .union([
                  z.object({ type: z.enum(['string', 'number', 'boolean']) }),
                  z.record(z.object({ type: z.enum(['string', 'number', 'boolean']) })),
                ])
                .optional()
                .describe('Output type specification (single or multiple named outputs)'),
              logic: z.any().describe('Function logic - can be a value, operation, or let binding'),
            })
          )
          .describe('Functions in the module - at least one required'),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        filePath: z.string(),
      },
    },
    async ({ filePath, moduleName, moduleDescription, functions }) => {
      try {
        // Validate file path
        if (!filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) {
          throw new Error('File path must end with .yaml or .yml');
        }

        // Check if file already exists
        if (fs.existsSync(filePath)) {
          throw new Error(`File already exists: ${filePath}`);
        }

        // Validate at least one function
        if (!functions || Object.keys(functions).length === 0) {
          throw new Error('At least one function is required');
        }

        // Validate each function has logic
        for (const [funcName, func] of Object.entries(functions)) {
          if (!func.logic) {
            throw new Error(`Function "${funcName}" must have a "logic" field`);
          }
        }

        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Build module structure
        const module = {
          module: {
            name: moduleName,
            ...(moduleDescription && { description: moduleDescription }),
          },
          functions,
        };

        // Write module to file
        const yamlContent = yaml.dump(module, {
          lineWidth: -1,
          noRefs: true,
        });
        fs.writeFileSync(filePath, yamlContent, 'utf8');

        const output = {
          success: true,
          message: `Module created successfully at ${filePath}`,
          filePath,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const output = {
          success: false,
          message: error instanceof Error ? error.message : String(error),
          filePath,
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
    }
  );

  // Tool: Read a Franka module
  server.registerTool(
    'read-module',
    {
      title: 'Read Module',
      description:
        'Read and parse an existing Franka module file. Returns the complete module structure including metadata and all functions.',
      inputSchema: {
        filePath: z.string().describe('Path to the module file to read'),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        module: z.any().optional(),
      },
    },
    async ({ filePath }) => {
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const interpreter = new FrankaInterpreter();
        const module = interpreter.loadModule(filePath);

        const output = {
          success: true,
          message: 'Module read successfully',
          module,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const output = {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
    }
  );

  // Tool: Update a Franka module
  server.registerTool(
    'update-module',
    {
      title: 'Update Module',
      description:
        'Update an existing Franka module. You can update module metadata, add new functions, modify existing functions, or remove functions. Provide only the fields you want to update.',
      inputSchema: {
        filePath: z.string().describe('Path to the module file to update'),
        moduleName: z.string().optional().describe('New module name (optional)'),
        moduleDescription: z.string().optional().describe('New module description (optional)'),
        addFunctions: z
          .record(
            z.object({
              description: z.string().optional(),
              input: z
                .record(
                  z.object({
                    type: z.enum(['string', 'number', 'boolean']),
                    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
                  })
                )
                .optional(),
              output: z
                .union([
                  z.object({ type: z.enum(['string', 'number', 'boolean']) }),
                  z.record(z.object({ type: z.enum(['string', 'number', 'boolean']) })),
                ])
                .optional(),
              logic: z.any(),
            })
          )
          .optional()
          .describe('New functions to add to the module'),
        updateFunctions: z
          .record(
            z.object({
              description: z.string().optional(),
              input: z
                .record(
                  z.object({
                    type: z.enum(['string', 'number', 'boolean']),
                    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
                  })
                )
                .optional(),
              output: z
                .union([
                  z.object({ type: z.enum(['string', 'number', 'boolean']) }),
                  z.record(z.object({ type: z.enum(['string', 'number', 'boolean']) })),
                ])
                .optional(),
              logic: z.any().optional(),
            })
          )
          .optional()
          .describe('Existing functions to update (provide only fields to change)'),
        removeFunctions: z
          .array(z.string())
          .optional()
          .describe('Function names to remove from the module'),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
      },
    },
    async ({
      filePath,
      moduleName,
      moduleDescription,
      addFunctions,
      updateFunctions,
      removeFunctions,
    }) => {
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Read existing module
        const interpreter = new FrankaInterpreter();
        const module = interpreter.loadModule(filePath);

        // Update module metadata
        if (moduleName !== undefined) {
          module.module.name = moduleName;
        }
        if (moduleDescription !== undefined) {
          module.module.description = moduleDescription;
        }

        // Add new functions
        if (addFunctions) {
          for (const [funcName, func] of Object.entries(addFunctions)) {
            if (module.functions[funcName]) {
              throw new Error(`Function "${funcName}" already exists. Use updateFunctions instead.`);
            }
            if (!func.logic) {
              throw new Error(`Function "${funcName}" must have a "logic" field`);
            }
            // Cast to FrankaFunction since we've validated logic exists
            module.functions[funcName] = func as FrankaFunction;
          }
        }

        // Update existing functions
        if (updateFunctions) {
          for (const [funcName, updates] of Object.entries(updateFunctions)) {
            if (!module.functions[funcName]) {
              throw new Error(
                `Function "${funcName}" does not exist. Use addFunctions to create it.`
              );
            }
            // Merge updates with existing function
            module.functions[funcName] = {
              ...module.functions[funcName],
              ...updates,
            };
          }
        }

        // Remove functions
        if (removeFunctions) {
          for (const funcName of removeFunctions) {
            if (!module.functions[funcName]) {
              throw new Error(`Function "${funcName}" does not exist`);
            }
            delete module.functions[funcName];
          }
        }

        // Validate at least one function remains
        if (Object.keys(module.functions).length === 0) {
          throw new Error('Module must have at least one function');
        }

        // Write updated module back to file
        const yamlContent = yaml.dump(module, {
          lineWidth: -1,
          noRefs: true,
        });
        fs.writeFileSync(filePath, yamlContent, 'utf8');

        const output = {
          success: true,
          message: `Module updated successfully at ${filePath}`,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const output = {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
    }
  );

  // Tool: Delete a Franka module
  server.registerTool(
    'delete-module',
    {
      title: 'Delete Module',
      description:
        'Delete a Franka module file and its associated spec file (if it exists). This operation cannot be undone.',
      inputSchema: {
        filePath: z.string().describe('Path to the module file to delete'),
        deleteSpec: z
          .boolean()
          .optional()
          .default(true)
          .describe('Whether to also delete the associated spec file (default: true)'),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        deletedFiles: z.array(z.string()),
      },
    },
    async ({ filePath, deleteSpec = true }) => {
      try {
        const deletedFiles: string[] = [];

        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Delete the module file
        fs.unlinkSync(filePath);
        deletedFiles.push(filePath);

        // Delete spec file if requested
        if (deleteSpec) {
          const specRunner = new SpecRunner();
          const specPath = specRunner.findSpecFile(filePath);
          if (specPath && fs.existsSync(specPath)) {
            fs.unlinkSync(specPath);
            deletedFiles.push(specPath);
          }
        }

        const output = {
          success: true,
          message: `Deleted ${deletedFiles.length} file(s)`,
          deletedFiles,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const output = {
          success: false,
          message: error instanceof Error ? error.message : String(error),
          deletedFiles: [],
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
    }
  );

  // Tool: Check a Franka module
  server.registerTool(
    'check-module',
    {
      title: 'Check Module',
      description:
        'Check a Franka module for syntax errors and run its test suite (if a spec file exists). Returns validation results and test results.',
      inputSchema: {
        filePath: z.string().describe('Path to the module file to check'),
        functionName: z
          .string()
          .optional()
          .describe('Optional specific function name to check (checks all if not provided)'),
      },
      outputSchema: {
        success: z.boolean(),
        syntaxValid: z.boolean(),
        message: z.string(),
        module: z.any().optional(),
        tests: z
          .object({
            found: z.boolean(),
            specPath: z.string().optional(),
            results: z.array(
              z.object({
                passed: z.boolean(),
                description: z.string().optional(),
                error: z.string().optional(),
                expected: z.any().optional(),
                actual: z.any().optional(),
              })
            ),
            summary: z.object({
              total: z.number(),
              passed: z.number(),
              failed: z.number(),
            }),
          })
          .optional(),
      },
    },
    async ({ filePath, functionName }) => {
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Check syntax by loading module
        const interpreter = new FrankaInterpreter();
        const module = interpreter.loadModule(filePath);

        // If specific function requested, validate it exists
        if (functionName) {
          interpreter.getFunctionFromModule(module, functionName);
        }

        const output: {
          success: boolean;
          syntaxValid: boolean;
          message: string;
          module?: unknown;
          tests?: {
            found: boolean;
            specPath?: string;
            results: Array<{
              passed: boolean;
              description?: string;
              error?: string;
              expected?: unknown;
              actual?: unknown;
            }>;
            summary: {
              total: number;
              passed: number;
              failed: number;
            };
          };
        } = {
          success: true,
          syntaxValid: true,
          message: 'Module syntax is valid',
          module: {
            name: module.module.name,
            description: module.module.description,
            functions: Object.keys(module.functions),
          },
        };

        // Check for and run tests
        const specRunner = new SpecRunner();
        const specPath = specRunner.findSpecFile(filePath);

        if (specPath) {
          try {
            const results = specRunner.runAllTests(filePath, specPath, functionName);
            const passed = results.filter((r) => r.passed).length;
            const failed = results.filter((r) => !r.passed).length;

            output.tests = {
              found: true,
              specPath,
              results,
              summary: {
                total: results.length,
                passed,
                failed,
              },
            };

            if (failed > 0) {
              output.success = false;
              output.message = `Module syntax is valid but ${failed} test(s) failed`;
            } else {
              output.message = `Module syntax is valid and all ${passed} test(s) passed`;
            }
          } catch (error) {
            output.tests = {
              found: true,
              specPath,
              results: [],
              summary: { total: 0, passed: 0, failed: 0 },
            };
            output.success = false;
            output.message = `Module syntax is valid but test execution failed: ${error instanceof Error ? error.message : String(error)}`;
          }
        } else {
          output.tests = {
            found: false,
            results: [],
            summary: { total: 0, passed: 0, failed: 0 },
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const output = {
          success: false,
          syntaxValid: false,
          message: `Syntax error: ${error instanceof Error ? error.message : String(error)}`,
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
    }
  );

  // Tool: Create or update a spec file with test cases
  server.registerTool(
    'create-spec-file',
    {
      title: 'Create Spec File',
      description:
        'Create or update a spec file with test cases for a Franka module. Spec files follow the naming convention: <module_name>.spec.yaml',
      inputSchema: {
        modulePath: z.string().describe('Path to the module file'),
        tests: z
          .record(
            z.object({
              tests: z.array(
                z.object({
                  description: z.string().optional().describe('Test case description'),
                  input: z
                    .record(z.union([z.string(), z.number(), z.boolean()]))
                    .optional()
                    .describe('Input values for the test'),
                  expectedOutput: z
                    .union([
                      z.string(),
                      z.number(),
                      z.boolean(),
                      z.record(z.union([z.string(), z.number(), z.boolean()])),
                    ])
                    .describe('Expected output value or object'),
                })
              ),
            })
          )
          .describe('Test cases grouped by function name'),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
        specPath: z.string(),
      },
    },
    async ({ modulePath, tests }) => {
      try {
        // Validate module exists
        if (!fs.existsSync(modulePath)) {
          throw new Error(`Module file not found: ${modulePath}`);
        }

        // Generate spec file path
        const dir = path.dirname(modulePath);
        const basename = path.basename(modulePath);
        const nameWithoutExt = basename.replace(/\.(yaml|yml)$/i, '');
        const specPath = path.join(dir, `${nameWithoutExt}.spec.yaml`);

        // Validate module to ensure functions exist
        const interpreter = new FrankaInterpreter();
        const module = interpreter.loadModule(modulePath);

        // Validate all test function names exist in module
        for (const funcName of Object.keys(tests)) {
          if (!module.functions[funcName]) {
            throw new Error(
              `Function "${funcName}" not found in module. Available: ${Object.keys(module.functions).join(', ')}`
            );
          }
        }

        // Create spec structure
        const spec = {
          functions: tests,
        };

        // Write spec file
        const yamlContent = yaml.dump(spec, {
          lineWidth: -1,
          noRefs: true,
        });
        fs.writeFileSync(specPath, yamlContent, 'utf8');

        const output = {
          success: true,
          message: `Spec file ${fs.existsSync(specPath) ? 'updated' : 'created'} successfully at ${specPath}`,
          specPath,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const output = {
          success: false,
          message: error instanceof Error ? error.message : String(error),
          specPath: '',
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
    }
  );

  // Register resources for language specification

  // Resource: Complete language syntax
  server.registerResource(
    'syntax',
    'franka://spec/syntax',
    {
      title: 'Language Syntax',
      description: 'Complete Franka language syntax specification',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec.syntax, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Resource: Language examples
  server.registerResource(
    'examples',
    'franka://spec/examples',
    {
      title: 'Language Examples',
      description: 'Franka code examples demonstrating language features',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec.examples, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Resource: Language metadata
  server.registerResource(
    'metadata',
    'franka://spec/metadata',
    {
      title: 'Language Metadata',
      description: 'Franka language metadata and version information',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec.metadata, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Resource: Complete language specification
  server.registerResource(
    'spec',
    'franka://spec/complete',
    {
      title: 'Complete Language Specification',
      description: 'Full Franka language specification',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Connect to stdio transport for MCP communication
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Franka MCP Server started');
  console.error(`Version: ${spec.metadata.version}`);
  console.error('Transport: stdio');
  console.error('');
  console.error('Available tools:');
  console.error('  - get-keywords: Get language operations and keywords');
  console.error('  - get-language-syntax: Get complete language syntax specification');
  console.error('  - create-module: Create a new Franka module');
  console.error('  - read-module: Read an existing Franka module');
  console.error('  - update-module: Update a Franka module');
  console.error('  - delete-module: Delete a Franka module');
  console.error('  - check-module: Check module syntax and run tests');
  console.error('  - create-spec-file: Create/update test spec file');
  console.error('');
  console.error('Available resources:');
  console.error('  - franka://spec/syntax: Language syntax specification');
  console.error('  - franka://spec/examples: Code examples');
  console.error('  - franka://spec/metadata: Language metadata');
  console.error('  - franka://spec/complete: Complete specification');
}

// Export for testing
export { main };

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
