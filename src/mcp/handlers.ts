import { FrankaInterpreter, FrankaFunction } from '../shared/interpreter';
import { SpecRunner } from '../shared/spec-runner';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface CreateModuleArgs {
  filePath: string;
  moduleName: string;
  moduleDescription?: string;
  functions: Record<
    string,
    {
      description?: string;
      input?: Record<
        string,
        { type: 'string' | 'number' | 'boolean'; default?: string | number | boolean }
      >;
      output?:
        | { type: 'string' | 'number' | 'boolean' }
        | Record<string, { type: 'string' | 'number' | 'boolean' }>;
      logic: unknown;
    }
  >;
}

export interface CreateModuleResult {
  success: boolean;
  message: string;
  filePath: string;
}

export function createModule(args: CreateModuleArgs): CreateModuleResult {
  try {
    // Validate file path
    if (!args.filePath.endsWith('.yaml') && !args.filePath.endsWith('.yml')) {
      throw new Error('File path must end with .yaml or .yml');
    }

    // Check if file already exists
    if (fs.existsSync(args.filePath)) {
      throw new Error(`File already exists: ${args.filePath}`);
    }

    // Validate at least one function
    if (!args.functions || Object.keys(args.functions).length === 0) {
      throw new Error('At least one function is required');
    }

    // Validate each function has logic
    for (const [funcName, func] of Object.entries(args.functions)) {
      if (!func.logic) {
        throw new Error(`Function "${funcName}" must have a "logic" field`);
      }
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(args.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Build module structure
    const module = {
      module: {
        name: args.moduleName,
        ...(args.moduleDescription && { description: args.moduleDescription }),
      },
      functions: args.functions,
    };

    // Write module to file
    const yamlContent = yaml.dump(module, {
      lineWidth: -1,
      noRefs: true,
    });
    fs.writeFileSync(args.filePath, yamlContent, 'utf8');

    return {
      success: true,
      message: `Module created successfully at ${args.filePath}`,
      filePath: args.filePath,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      filePath: args.filePath,
    };
  }
}

export interface ReadModuleArgs {
  filePath: string;
}

export interface ReadModuleResult {
  success: boolean;
  message: string;
  module?: unknown;
}

export function readModule(args: ReadModuleArgs): ReadModuleResult {
  try {
    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File not found: ${args.filePath}`);
    }

    const interpreter = new FrankaInterpreter();
    const module = interpreter.loadModule(args.filePath);

    return {
      success: true,
      message: 'Module read successfully',
      module,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface UpdateModuleArgs {
  filePath: string;
  moduleName?: string;
  moduleDescription?: string;
  addFunctions?: Record<
    string,
    {
      description?: string;
      input?: Record<
        string,
        { type: 'string' | 'number' | 'boolean'; default?: string | number | boolean }
      >;
      output?:
        | { type: 'string' | 'number' | 'boolean' }
        | Record<string, { type: 'string' | 'number' | 'boolean' }>;
      logic: unknown;
    }
  >;
  updateFunctions?: Record<
    string,
    {
      description?: string;
      input?: Record<
        string,
        { type: 'string' | 'number' | 'boolean'; default?: string | number | boolean }
      >;
      output?:
        | { type: 'string' | 'number' | 'boolean' }
        | Record<string, { type: 'string' | 'number' | 'boolean' }>;
      logic?: unknown;
    }
  >;
  removeFunctions?: string[];
}

export interface UpdateModuleResult {
  success: boolean;
  message: string;
}

export function updateModule(args: UpdateModuleArgs): UpdateModuleResult {
  try {
    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File not found: ${args.filePath}`);
    }

    // Read existing module
    const interpreter = new FrankaInterpreter();
    const module = interpreter.loadModule(args.filePath);

    // Update module metadata
    if (args.moduleName !== undefined) {
      module.module.name = args.moduleName;
    }
    if (args.moduleDescription !== undefined) {
      module.module.description = args.moduleDescription;
    }

    // Add new functions
    if (args.addFunctions) {
      for (const [funcName, func] of Object.entries(args.addFunctions)) {
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
    if (args.updateFunctions) {
      for (const [funcName, updates] of Object.entries(args.updateFunctions)) {
        if (!module.functions[funcName]) {
          throw new Error(`Function "${funcName}" does not exist. Use addFunctions to create it.`);
        }
        // Merge updates with existing function, casting to FrankaFunction
        module.functions[funcName] = {
          ...module.functions[funcName],
          ...updates,
        } as FrankaFunction;
      }
    }

    // Remove functions
    if (args.removeFunctions) {
      for (const funcName of args.removeFunctions) {
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
    fs.writeFileSync(args.filePath, yamlContent, 'utf8');

    return {
      success: true,
      message: `Module updated successfully at ${args.filePath}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface DeleteModuleArgs {
  filePath: string;
  deleteSpec?: boolean;
}

export interface DeleteModuleResult {
  success: boolean;
  message: string;
  deletedFiles: string[];
}

export function deleteModule(args: DeleteModuleArgs): DeleteModuleResult {
  try {
    const deletedFiles: string[] = [];

    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File not found: ${args.filePath}`);
    }

    // Delete the module file
    fs.unlinkSync(args.filePath);
    deletedFiles.push(args.filePath);

    // Delete spec file if requested
    if (args.deleteSpec !== false) {
      const specRunner = new SpecRunner();
      const specPath = specRunner.findSpecFile(args.filePath);
      if (specPath && fs.existsSync(specPath)) {
        fs.unlinkSync(specPath);
        deletedFiles.push(specPath);
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedFiles.length} file(s)`,
      deletedFiles,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      deletedFiles: [],
    };
  }
}

export interface CheckModuleArgs {
  filePath: string;
  functionName?: string;
}

export interface CheckModuleResult {
  success: boolean;
  syntaxValid: boolean;
  message: string;
  module?: {
    name: string;
    description?: string;
    functions: string[];
  };
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
}

export function checkModule(args: CheckModuleArgs): CheckModuleResult {
  try {
    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File not found: ${args.filePath}`);
    }

    // Check syntax by loading module
    const interpreter = new FrankaInterpreter();
    const module = interpreter.loadModule(args.filePath);

    // If specific function requested, validate it exists
    if (args.functionName) {
      interpreter.getFunctionFromModule(module, args.functionName);
    }

    const output: CheckModuleResult = {
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
    const specPath = specRunner.findSpecFile(args.filePath);

    if (specPath) {
      try {
        const results = specRunner.runAllTests(args.filePath, specPath, args.functionName);
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

    return output;
  } catch (error) {
    return {
      success: false,
      syntaxValid: false,
      message: `Syntax error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export interface CreateSpecFileArgs {
  modulePath: string;
  tests: Record<
    string,
    {
      tests: Array<{
        description?: string;
        input?: Record<string, string | number | boolean>;
        expectedOutput: string | number | boolean | Record<string, string | number | boolean>;
      }>;
    }
  >;
}

export interface CreateSpecFileResult {
  success: boolean;
  message: string;
  specPath: string;
}

export function createSpecFile(args: CreateSpecFileArgs): CreateSpecFileResult {
  try {
    // Validate module exists
    if (!fs.existsSync(args.modulePath)) {
      throw new Error(`Module file not found: ${args.modulePath}`);
    }

    // Generate spec file path
    const dir = path.dirname(args.modulePath);
    const basename = path.basename(args.modulePath);
    const nameWithoutExt = basename.replace(/\.(yaml|yml)$/i, '');
    const specPath = path.join(dir, `${nameWithoutExt}.spec.yaml`);

    // Validate module to ensure functions exist
    const interpreter = new FrankaInterpreter();
    const module = interpreter.loadModule(args.modulePath);

    // Validate all test function names exist in module
    for (const funcName of Object.keys(args.tests)) {
      if (!module.functions[funcName]) {
        throw new Error(
          `Function "${funcName}" not found in module. Available: ${Object.keys(module.functions).join(', ')}`
        );
      }
    }

    // Create spec structure
    const spec = {
      functions: args.tests,
    };

    // Write spec file
    const yamlContent = yaml.dump(spec, {
      lineWidth: -1,
      noRefs: true,
    });
    fs.writeFileSync(specPath, yamlContent, 'utf8');

    return {
      success: true,
      message: `Spec file ${fs.existsSync(specPath) ? 'updated' : 'created'} successfully at ${specPath}`,
      specPath,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      specPath: '',
    };
  }
}
