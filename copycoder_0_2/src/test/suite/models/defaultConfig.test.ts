// src/test/suite/models/defaultConfig.test.ts
import * as assert from 'assert';
import { DEFAULT_CONFIG } from '../../../models/config';

suite('Default Configuration Tests', () => {
  test('DEFAULT_CONFIG should have expected properties', () => {
    assert.strictEqual(DEFAULT_CONFIG.includeGlobalExtensions, true, 'includeGlobalExtensions should be true');
    assert.strictEqual(DEFAULT_CONFIG.filterUsingGitignore, true, 'filterUsingGitignore should be true');
    assert.deepStrictEqual(DEFAULT_CONFIG.projectTypes, [
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
    ], 'projectTypes should include all defined types');
    assert.deepStrictEqual(DEFAULT_CONFIG.globalExtensions, [
      '.md',
      '.txt',
      '.gitignore',
      '.env.example',
      '.editorconfig'
    ], 'globalExtensions should match global defaults');
    assert.deepStrictEqual(DEFAULT_CONFIG.customExtensions['node'], [
      '.js',
      '.mjs',
      '.cjs',
      '.ts',
      '.tsx',
      '.jsx',
      '.json',
      '.node'
    ], 'customExtensions for node should match defaults');
    assert.deepStrictEqual(DEFAULT_CONFIG.globalBlacklist, [
      '*.min.js',
      '*.min.css',
      '.DS_Store',
      'Thumbs.db',
      '.vscode/*',
      '.idea/*',
      '.vs/*'
    ], 'globalBlacklist should match global defaults');
    assert.deepStrictEqual(DEFAULT_CONFIG.customBlacklist['python'], [
      'Pipfile.lock',
      'poetry.lock',
      '__pycache__',
      '*.pyc',
      '.pytest_cache',
      'venv/*',
      '.venv/*'
    ], 'customBlacklist for python should match defaults');
  });
});