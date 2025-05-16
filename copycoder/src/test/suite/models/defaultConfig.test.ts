import * as assert from 'assert';
import { DEFAULT_CONFIG, AVAILABLE_EXTENSIONS } from '../../../models/config';
import { PROJECT_TYPES, TEST_DEFAULT_CONFIG } from '../../../constants/configConstants';
import { MockFileSystem } from '../mockFileSystem';

suite('Default Configuration Tests', () => {
  setup(() => {
    new MockFileSystem();
  });

  test('DEFAULT_CONFIG should have expected properties', () => {
    assert.strictEqual(DEFAULT_CONFIG.includeGlobalExtensions, TEST_DEFAULT_CONFIG.includeGlobalExtensions);
    assert.strictEqual(DEFAULT_CONFIG.filterUsingGitignore, TEST_DEFAULT_CONFIG.filterUsingGitignore);
    assert.deepStrictEqual(DEFAULT_CONFIG.projectTypes, TEST_DEFAULT_CONFIG.projectTypes);
    assert.deepStrictEqual(DEFAULT_CONFIG.globalExtensions, TEST_DEFAULT_CONFIG.globalExtensions);
    assert.deepStrictEqual(DEFAULT_CONFIG.customExtensions, TEST_DEFAULT_CONFIG.customExtensions);
    assert.deepStrictEqual(DEFAULT_CONFIG.globalBlacklist, TEST_DEFAULT_CONFIG.globalBlacklist);
    assert.deepStrictEqual(DEFAULT_CONFIG.customBlacklist, TEST_DEFAULT_CONFIG.customBlacklist);
  });

  test('AVAILABLE_EXTENSIONS should have expected project types', () => {
    const expectedTypes = PROJECT_TYPES;
    assert.strictEqual(
      Object.keys(AVAILABLE_EXTENSIONS).filter(type => type !== 'global').length,
      expectedTypes.length,
      `should include all ${expectedTypes.length} project types`
    );
    assert.deepStrictEqual(
      Object.keys(AVAILABLE_EXTENSIONS).filter(type => type !== 'global').sort(),
      [...expectedTypes].sort(),
      'should match expected types'
    );
  });
});