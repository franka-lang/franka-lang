module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  // Coverage thresholds - entry point files (CLI/MCP/Web) are integration-tested
  // and excluded from per-file thresholds. Business logic in shared/ has 94% coverage.
  coverageThresholds: {
    global: {
      lines: 73  // Current achieved coverage, incrementally improving toward 90%
    },
    './src/shared/**/*.ts': {
      lines: 90,  // Business logic must maintain high coverage
      branches: 85,
      functions: 100,
      statements: 90
    }
  }
};
