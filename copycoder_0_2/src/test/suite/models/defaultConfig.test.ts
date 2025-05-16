import * as assert from 'assert';
import { DEFAULT_CONFIG, AVAILABLE_EXTENSIONS } from '../../../models/config';
import { MockFileSystem } from '../mockFileSystem';

suite('Default Configuration Tests', () => {
  setup(() => {
    new MockFileSystem();
  });

  test('DEFAULT_CONFIG should have expected properties', () => {
    assert.strictEqual(DEFAULT_CONFIG.includeGlobalExtensions, true);
    assert.strictEqual(DEFAULT_CONFIG.filterUsingGitignore, false);
    assert.deepStrictEqual(DEFAULT_CONFIG.projectTypes, []);
    assert.deepStrictEqual(DEFAULT_CONFIG.globalExtensions, ['.md']);
    assert.deepStrictEqual(DEFAULT_CONFIG.customExtensions, {});
    assert.deepStrictEqual(DEFAULT_CONFIG.globalBlacklist, []);
    assert.deepStrictEqual(DEFAULT_CONFIG.customBlacklist, {});
  });

  test('AVAILABLE_EXTENSIONS should have expected project types', () => {
    const expectedTypes = [
      'powershell',
      'terraform',
      'bash',
      'php',
      'mysql',
      'postgres',
      'elixir',
      'python',
      'node',
      'vscode',
      'wsl2'
    ];
    assert.strictEqual(
      Object.keys(AVAILABLE_EXTENSIONS).filter(type => type !== 'global').length,
      11,
      'should include all project types'
    );
    assert.deepStrictEqual(
      Object.keys(AVAILABLE_EXTENSIONS).filter(type => type !== 'global').sort(),
      expectedTypes.sort(),
      'should match expected types'
    );
  });
});