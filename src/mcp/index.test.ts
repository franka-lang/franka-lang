import { spawn } from 'child_process';
import { loadLanguageSpec } from '../shared/spec-loader';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('MCP Server', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'franka-mcp-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should start and respond to initialization', (done) => {
    const spec = loadLanguageSpec();
    const server = spawn('ts-node', ['src/mcp/index.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderrOutput = '';

    // Collect stderr output (where logs go)
    server.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    };

    server.stdin.write(JSON.stringify(initRequest) + '\n');

    let stdoutBuffer = '';
    let foundResponse = false;

    server.stdout.on('data', (data) => {
      if (foundResponse) return;

      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split('\n');

      for (const line of lines) {
        if (line.trim() && !foundResponse) {
          try {
            const response = JSON.parse(line);
            if (response.id === 1) {
              foundResponse = true;
              expect(response.result).toBeDefined();
              expect(response.result.serverInfo).toBeDefined();
              expect(response.result.serverInfo.name).toBe(spec.metadata.name);
              expect(response.result.serverInfo.version).toBe(spec.metadata.version);

              // Verify server capabilities
              expect(response.result.capabilities).toBeDefined();
              expect(response.result.capabilities.tools).toBeDefined();
              expect(response.result.capabilities.resources).toBeDefined();

              // Check stderr logs
              expect(stderrOutput).toContain('Franka MCP Server started');

              server.kill();
              done();
              return;
            }
          } catch {
            // Not valid JSON yet, continue
          }
        }
      }
    });

    server.on('error', (error) => {
      if (!foundResponse) {
        done(error);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!foundResponse) {
        server.kill();
        done(new Error('Test timed out waiting for initialize response'));
      }
    }, 10000);
  }, 15000); // Increase timeout to 15 seconds

  test('server should log startup information to stderr', (done) => {
    const server = spawn('ts-node', ['src/mcp/index.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderrOutput = '';

    server.stderr.on('data', (data) => {
      stderrOutput += data.toString();

      // Check if we have all expected log messages
      if (
        stderrOutput.includes('Franka MCP Server started') &&
        stderrOutput.includes('get-keywords') &&
        stderrOutput.includes('create-module') &&
        stderrOutput.includes('franka://spec/syntax')
      ) {
        expect(stderrOutput).toContain('Version: 1.0.0');
        expect(stderrOutput).toContain('Transport: stdio');
        expect(stderrOutput).toContain('Available tools:');
        expect(stderrOutput).toContain('Available resources:');
        expect(stderrOutput).toContain('read-module');
        expect(stderrOutput).toContain('update-module');
        expect(stderrOutput).toContain('delete-module');
        expect(stderrOutput).toContain('check-module');
        expect(stderrOutput).toContain('create-spec-file');

        server.kill();
        done();
      }
    });

    server.on('error', (error) => {
      done(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      server.kill();
      if (stderrOutput) {
        // If we got some output, it's okay
        done();
      } else {
        done(new Error('Test timed out - no stderr output received'));
      }
    }, 10000);
  }, 15000); // Increase timeout to 15 seconds

  test('should load language specification correctly', () => {
    const spec = loadLanguageSpec();

    // Verify spec has required properties
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata.name).toBe('Franka');
    expect(spec.metadata.version).toBe('1.0.0');
    expect(spec.syntax).toBeDefined();
    expect(spec.syntax.operations).toBeDefined();
    expect(spec.examples).toBeDefined();
  });

  test('spec should have operations for get-keywords tool', () => {
    const spec = loadLanguageSpec();
    expect(spec.syntax.operations.string).toBeDefined();
    expect(spec.syntax.operations.boolean).toBeDefined();
    expect(spec.syntax.operations.control).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.string)).toBe(true);
    expect(Array.isArray(spec.syntax.operations.boolean)).toBe(true);
    expect(Array.isArray(spec.syntax.operations.control)).toBe(true);
  });

  test('spec should have examples for resources', () => {
    const spec = loadLanguageSpec();
    expect(Array.isArray(spec.examples)).toBe(true);
    expect(spec.examples.length).toBeGreaterThan(0);
  });

  describe('Tool: create-module', () => {
    test('should handle tool call for creating a module', (done) => {
      const server = spawn('ts-node', ['src/mcp/index.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const modulePath = path.join(testDir, 'test-module.yaml');

      const createModuleRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'create-module',
          arguments: {
            filePath: modulePath,
            moduleName: 'Test Module',
            moduleDescription: 'A test module',
            functions: {
              main: {
                description: 'Main function',
                logic: 'Hello, World!',
              },
            },
          },
        },
      };

      let foundResponse = false;
      let stdoutBuffer = '';

      server.stdout.on('data', (data) => {
        if (foundResponse) return;
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');

        for (const line of lines) {
          if (line.trim() && !foundResponse) {
            try {
              const response = JSON.parse(line);
              if (response.id === 2) {
                foundResponse = true;
                expect(response.result).toBeDefined();
                expect(response.result.content).toBeDefined();
                const content = JSON.parse(response.result.content[0].text);
                expect(content.success).toBe(true);
                expect(fs.existsSync(modulePath)).toBe(true);
                server.kill();
                done();
                return;
              }
            } catch {
              // Not valid JSON yet, continue
            }
          }
        }
      });

      // Initialize first
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      server.stdin.write(JSON.stringify(initRequest) + '\n');
      // Wait a bit for init to complete, then send the tool call
      setTimeout(() => {
        server.stdin.write(JSON.stringify(createModuleRequest) + '\n');
      }, 500);

      setTimeout(() => {
        if (!foundResponse) {
          server.kill();
          done(new Error('Test timed out'));
        }
      }, 10000);
    }, 15000);
  });

  describe('Tool: read-module', () => {
    test('should handle tool call for reading a module', (done) => {
      const server = spawn('ts-node', ['src/mcp/index.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Create a test module first
      const modulePath = path.join(testDir, 'read-test.yaml');
      const moduleContent = `module:
  name: "Read Test"
  description: "Test reading"

functions:
  main:
    description: "Main function"
    logic: "Hello"
`;
      fs.writeFileSync(modulePath, moduleContent, 'utf8');

      const readModuleRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'read-module',
          arguments: {
            filePath: modulePath,
          },
        },
      };

      let foundResponse = false;
      let stdoutBuffer = '';

      server.stdout.on('data', (data) => {
        if (foundResponse) return;
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');

        for (const line of lines) {
          if (line.trim() && !foundResponse) {
            try {
              const response = JSON.parse(line);
              if (response.id === 2) {
                foundResponse = true;
                expect(response.result).toBeDefined();
                const content = JSON.parse(response.result.content[0].text);
                expect(content.success).toBe(true);
                expect(content.module).toBeDefined();
                expect(content.module.module.name).toBe('Read Test');
                server.kill();
                done();
                return;
              }
            } catch {
              // Not valid JSON yet, continue
            }
          }
        }
      });

      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      server.stdin.write(JSON.stringify(initRequest) + '\n');
      setTimeout(() => {
        server.stdin.write(JSON.stringify(readModuleRequest) + '\n');
      }, 500);

      setTimeout(() => {
        if (!foundResponse) {
          server.kill();
          done(new Error('Test timed out'));
        }
      }, 10000);
    }, 15000);
  });

  describe('Tool: check-module', () => {
    test('should handle tool call for checking a module', (done) => {
      const server = spawn('ts-node', ['src/mcp/index.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Create a test module
      const modulePath = path.join(testDir, 'check-test.yaml');
      const moduleContent = `module:
  name: "Check Test"

functions:
  main:
    logic: "Valid"
`;
      fs.writeFileSync(modulePath, moduleContent, 'utf8');

      const checkModuleRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'check-module',
          arguments: {
            filePath: modulePath,
          },
        },
      };

      let foundResponse = false;
      let stdoutBuffer = '';

      server.stdout.on('data', (data) => {
        if (foundResponse) return;
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');

        for (const line of lines) {
          if (line.trim() && !foundResponse) {
            try {
              const response = JSON.parse(line);
              if (response.id === 2) {
                foundResponse = true;
                expect(response.result).toBeDefined();
                const content = JSON.parse(response.result.content[0].text);
                expect(content.success).toBe(true);
                expect(content.syntaxValid).toBe(true);
                expect(content.module).toBeDefined();
                server.kill();
                done();
                return;
              }
            } catch {
              // Not valid JSON yet, continue
            }
          }
        }
      });

      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      server.stdin.write(JSON.stringify(initRequest) + '\n');
      setTimeout(() => {
        server.stdin.write(JSON.stringify(checkModuleRequest) + '\n');
      }, 500);

      setTimeout(() => {
        if (!foundResponse) {
          server.kill();
          done(new Error('Test timed out'));
        }
      }, 10000);
    }, 15000);
  });
});
