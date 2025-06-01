import * as assert from 'assert';
import { ExtensionFilter } from '../../../../services/v2/filters/extensionFilter';
import { createMockFileMetadata, createMockConfig } from '../../../utils/testHelpers';
import { FilterContext } from '../../../../models/fileMetadata';

suite('ExtensionFilter Tests', () => {
  let filter: ExtensionFilter;

  setup(() => {
    filter = new ExtensionFilter();
  });

  test('should include files with allowed extensions', () => {
    // Arrange
    const file = createMockFileMetadata('test.js');
    const config = createMockConfig({
      globalExtensions: ['.js', '.ts', '.md'],
      includeGlobalExtensions: true,
      projectTypes: [],
      customExtensions: {},
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act
    const result = filter.filter(file, context);

    // Assert
    assert.strictEqual(result, true);
  });

  test('should exclude files with disallowed extensions', () => {
    // Arrange
    const file = createMockFileMetadata('binary.exe');
    const config = createMockConfig({
      globalExtensions: ['.js', '.ts', '.md'],
      includeGlobalExtensions: true,
      projectTypes: [],
      customExtensions: {},
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act
    const result = filter.filter(file, context);

    // Assert
    assert.strictEqual(result, false);
  });

  test('should include project-specific extensions when project types are configured', () => {
    // Arrange
    const file = createMockFileMetadata('test.json');
    const config = createMockConfig({
      globalExtensions: ['.js', '.ts'],
      includeGlobalExtensions: true,
      projectTypes: ['node'],
      customExtensions: { node: ['.json'] },
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act
    const result = filter.filter(file, context);

    // Assert
    assert.strictEqual(result, true);
  });

  test('should exclude directories', () => {
    // Arrange
    const file = createMockFileMetadata('src', { isDirectory: true });
    const config = createMockConfig({
      globalExtensions: ['.js', '.ts'],
      includeGlobalExtensions: true,
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act
    const result = filter.filter(file, context);

    // Assert
    assert.strictEqual(result, false);
  });

  test('should handle extensions without leading dots', () => {
    // Arrange
    const file = createMockFileMetadata('test.js');
    const config = createMockConfig({
      globalExtensions: ['js', 'ts'], // No leading dots
      includeGlobalExtensions: true,
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act
    const result = filter.filter(file, context);

    // Assert
    assert.strictEqual(result, true);
  });

  test('should return false when no extensions are configured', () => {
    // Arrange
    const file = createMockFileMetadata('test.js');
    const config = createMockConfig({
      globalExtensions: [],
      includeGlobalExtensions: false,
      projectTypes: [],
      customExtensions: {},
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act
    const result = filter.filter(file, context);

    // Assert
    assert.strictEqual(result, false);
  });

  test('should combine global and project extensions correctly', () => {
    // Arrange
    const jsFile = createMockFileMetadata('test.js');
    const jsonFile = createMockFileMetadata('config.json');
    const config = createMockConfig({
      globalExtensions: ['.js'],
      includeGlobalExtensions: true,
      projectTypes: ['node'],
      customExtensions: { node: ['.json'] },
    });
    const context: FilterContext = { config, workspaceRoot: '/workspace' };

    // Act & Assert
    assert.strictEqual(filter.filter(jsFile, context), true);
    assert.strictEqual(filter.filter(jsonFile, context), true);
  });
});
