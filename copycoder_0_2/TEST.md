# Testing Guide for CopyCoder Extension

This document provides instructions on how to set up and run tests for the CopyCoder VS Code extension.

## Prerequisites

Before running tests, ensure you have the following installed:
- Node.js (v16 or higher recommended)
- npm

## Setting Up the Test Environment

1. Install required dependencies:

```bash
npm install
```

2. Install additional testing dependencies:

To support the test framework (Mocha), mocking (Sinon), and TypeScript type definitions, install the following:

```bash
npm install --save-dev sinon mocha glob @types/mocha @types/sinon
```

3. Make sure the development environment is properly set up:

```bash
npm run compile
```

4. Verify that `package.json` has the necessary scripts for compiling/running tests.

```bash
"scripts": {
  "compile": "tsc -p ./",
  "test": "npm run compile && node ./out/test/runTest.js"
}
```


5. On Ubuntu 24.04 server:

```bash
sudo apt update
sudo apt install libasound2t64
```

## Running Tests

### Running All Tests

To run all tests:

```bash
npm test
```

This command will:
1. Compile the test files
2. Compile the extension
3. Run linting
4. Execute all tests

### Running Specific Tests

To run a specific test suite, you can modify the test command in package.json or use:

```bash
node ./out/test/runTest.js --grep "Test Suite Name"
```

### Test Watch Mode

For continuous testing during development:

```bash
npm run watch-tests
```

This will watch for changes in your test files and recompile them automatically.

## Test Structure

As of creating this file, the tests are organized as follows:

- `src/test/runTest.ts` - Entry point for running tests
- `src/test/suite/index.ts` - Sets up and runs the Mocha test suite
- `src/test/suite/extension.test.ts` - Tests for extension activation and commands
- `src/test/suite/models/defaultConfig.test.ts` - Tests for default configuration
- `src/test/suite/models/projectTypes.test.ts` - Tests for project types definitions

## Adding New Tests

To add new tests:

1. Create a new test file in the appropriate directory under `src/test/suite/`
2. Follow the TDD pattern used in existing tests
3. Import the module you want to test
4. Write your test cases
5. Run the tests to verify they pass

Example structure for a new test file:

```typescript
import * as assert from 'assert';
import { ModuleToTest } from '../../../path/to/module';

suite('Module Name Tests', () => {
    test('Feature should behave as expected', () => {
        // Setup
        const input = 'test input';
        
        // Execute
        const result = ModuleToTest.featureMethod(input);
        
        // Assert
        assert.strictEqual(result, 'expected output');
    });
});
```

## Debugging Tests

To debug tests:

1. Open the VS Code debugger
2. Select the "Extension Tests" configuration
3. Set breakpoints in your test files
4. Press F5 to start debugging

## Common Testing Issues

### Tests Not Found

If your tests aren't being discovered, check:
- File naming: Test files must end with `.test.js` after compilation
- Path issues: Make sure the glob pattern in `suite/index.ts` matches your file structure

### Mock Dependencies

For tests that require mocking VS Code APIs:
- Use Sinon.js for creating spies, stubs, and mocks
- Remember to restore original functions after testing

```typescript
import * as sinon from 'sinon';

// Create a spy
const spy = sinon.spy(vscode.window, 'showInformationMessage');

// Test with the spy
// ...

// Important: Restore the original function
spy.restore();
```

### Environment Setup

- Ensure that `@vscode/test-electron` is properly configured in your tests
- The extension should be properly activated before testing its functionality

## Continuous Integration

If you're using CI/CD, make sure to include the test command in your pipeline:

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: actions/setup-node@v3
    with:
      node-version: '16'
  - run: npm ci
  - run: npm test
```

## Test Coverage

To generate test coverage reports, you can add a coverage tool like nyc:

1. Install nyc:
```bash
npm install --save-dev nyc
```

2. Add coverage script to package.json:
```json
"scripts": {
  "coverage": "nyc npm test"
}
```

3. Run coverage:
```bash
npm run coverage
```