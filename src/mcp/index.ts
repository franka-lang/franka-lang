#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadLanguageSpec } from '../shared/spec-loader';
import {
  createModule,
  readModule,
  updateModule,
  deleteModule,
  checkModule,
  createSpecFile,
  CreateModuleArgs,
  UpdateModuleArgs,
} from './handlers';

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
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
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
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
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
        moduleDescription: z.string().optional().describe('Optional description of the module'),
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
    async (args: any) => {
      const output = createModule(args as CreateModuleArgs);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
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
    async (args) => {
      const output = readModule(args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
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
    async (args: any) => {
      const output = updateModule(args as UpdateModuleArgs);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
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
    async (args) => {
      const output = deleteModule(args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
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
    async (args) => {
      const output = checkModule(args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
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
    async (args) => {
      const output = createSpecFile(args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
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
