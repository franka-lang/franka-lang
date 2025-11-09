#!/usr/bin/env node

import { loadLanguageSpec, getVersion } from '../shared/spec-loader';
import { FrankaInterpreter } from '../shared/interpreter';
import { SpecRunner } from '../shared/spec-runner';
import * as fs from 'fs';

function showHelp() {
  const spec = loadLanguageSpec();
  console.log(`
Franka Language CLI - ${spec.metadata.description}
Version: ${spec.metadata.version}

Usage: franka <command> [options]

Commands:
`);

  spec.tooling.cli.commands.forEach((cmd) => {
    console.log(`  ${cmd.usage.padEnd(30)} ${cmd.description}`);
  });

  console.log(`
Options:
  -h, --help     Show this help message
  -v, --version  Show version information
`);
}

function showVersion() {
  const version = getVersion();
  console.log(`Franka Language v${version}`);
}

function runFile(filePath: string) {
  console.log(`Running Franka program: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const interpreter = new FrankaInterpreter();
    const result = interpreter.executeFile(filePath);

    console.log('\nProgram result:');
    console.log('---------------');
    console.log(result);
    console.log('---------------');
  } catch (error) {
    console.error('Error executing program:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function checkFile(filePath: string) {
  console.log(`Checking Franka program: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  let hasErrors = false;

  try {
    const interpreter = new FrankaInterpreter();
    const program = interpreter.loadProgram(filePath);

    console.log('✓ Syntax is valid');
    console.log(`✓ Program name: ${program.program.name}`);
    if (program.program.description) {
      console.log(`✓ Description: ${program.program.description}`);
    }
    console.log(`✓ Logic: ${program.logic ? 'present' : 'missing'}`);
    if (program.input) {
      console.log(`✓ Inputs: ${Object.keys(program.input).length}`);
    }
    if (program.output) {
      // Check if it's a single unnamed output or multiple named outputs
      if ('type' in program.output) {
        console.log(`✓ Output: 1 (type: ${program.output.type})`);
      } else {
        console.log(`✓ Outputs: ${Object.keys(program.output).length}`);
      }
    }
  } catch (error) {
    console.error('✗ Syntax error:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Check for spec file and run tests
  try {
    const specRunner = new SpecRunner();
    const specPath = specRunner.findSpecFile(filePath);

    if (specPath) {
      console.log('\n--- Running Tests ---');
      console.log(`Found spec file: ${specPath}`);

      const results = specRunner.runAllTests(filePath, specPath);

      let passedCount = 0;
      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.passed) {
          passedCount++;
          const desc = result.description ? `: ${result.description}` : '';
          console.log(`✓ Test ${index + 1}${desc}`);
        } else {
          failedCount++;
          hasErrors = true;
          const desc = result.description ? `: ${result.description}` : '';
          console.log(`✗ Test ${index + 1}${desc}`);
          if (result.error) {
            console.log(`  Error: ${result.error}`);
          }
          if (result.expected !== undefined) {
            console.log(`  Expected: ${JSON.stringify(result.expected)}`);
          }
          if (result.actual !== undefined) {
            console.log(`  Actual: ${JSON.stringify(result.actual)}`);
          }
        }
      });

      console.log(`\nTest Results: ${passedCount} passed, ${failedCount} failed`);
    } else {
      console.log('\nNo spec file found (optional)');
    }
  } catch (error) {
    console.error('\n✗ Error running tests:');
    console.error(error instanceof Error ? error.message : String(error));
    hasErrors = true;
  }

  if (hasErrors) {
    process.exit(1);
  }
}

function startRepl() {
  console.log('Starting Franka REPL...');
  console.log('Note: REPL not yet implemented.');
  console.log('This is a placeholder for future functionality.');
  console.log('Type Ctrl+C to exit.');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    showHelp();
    process.exit(0);
  }

  if (args[0] === '-v' || args[0] === '--version' || args[0] === 'version') {
    showVersion();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'run':
      if (commandArgs.length === 0) {
        console.error('Error: No file specified');
        console.error('Usage: franka run <file>');
        process.exit(1);
      }
      runFile(commandArgs[0]);
      break;

    case 'check':
      if (commandArgs.length === 0) {
        console.error('Error: No file specified');
        console.error('Usage: franka check <file>');
        process.exit(1);
      }
      checkFile(commandArgs[0]);
      break;

    case 'repl':
      startRepl();
      break;

    default:
      console.error(`Error: Unknown command '${command}'`);
      console.error('Run "franka --help" for usage information');
      process.exit(1);
  }
}

main();
