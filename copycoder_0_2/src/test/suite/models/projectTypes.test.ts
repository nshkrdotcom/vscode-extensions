import * as assert from 'assert';
import { DEFAULT_CONFIG } from '../../../models/config';

suite('Project Types Tests', () => {
  test('DEFAULT_EXTENSIONS should have expected project types', () => {
    assert.ok(DEFAULT_CONFIG.projectTypes.includes('node'), 'should include node project type');
    assert.ok(DEFAULT_CONFIG.projectTypes.includes('python'), 'should include python project type');
    assert.ok(DEFAULT_CONFIG.projectTypes.includes('terraform'), 'should include terraform project type');
    assert.ok(DEFAULT_CONFIG.projectTypes.includes('bash'), 'should include bash project type');
    assert.ok(DEFAULT_CONFIG.projectTypes.includes('php'), 'should include php project type');
  });

  test('Global extensions should include commonly used file types', () => {
    assert.ok(DEFAULT_CONFIG.globalExtensions.includes('.md'), 'should include .md in global extensions');
    assert.ok(DEFAULT_CONFIG.globalExtensions.includes('.txt'), 'should include .txt in global extensions');
    assert.ok(DEFAULT_CONFIG.globalExtensions.includes('.gitignore'), 'should include .gitignore in global extensions');
  });

  test('DEFAULT_BLACKLIST should have expected project types', () => {
    assert.ok(Object.keys(DEFAULT_CONFIG.customBlacklist).includes('node'), 'should include node project type');
    assert.ok(Object.keys(DEFAULT_CONFIG.customBlacklist).includes('python'), 'should include python project type');
    assert.ok(Object.keys(DEFAULT_CONFIG.customBlacklist).includes('terraform'), 'should include terraform project type');
  });

  test('Global blacklist should include common excluded patterns', () => {
    assert.ok(DEFAULT_CONFIG.globalBlacklist.includes('*.min.js'), 'should include *.min.js in global blacklist');
    assert.ok(DEFAULT_CONFIG.globalBlacklist.includes('*.min.css'), 'should include *.min.css in global blacklist');
    assert.ok(DEFAULT_CONFIG.globalBlacklist.includes('.DS_Store'), 'should include .DS_Store in global blacklist');
  });

  test('Global blacklist should include directory patterns', () => {
    assert.ok(DEFAULT_CONFIG.globalBlacklist.includes('.vscode/*'), 'should include .vscode/* in global blacklist');
    assert.ok(DEFAULT_CONFIG.globalBlacklist.includes('.idea/*'), 'should include .idea/* in global blacklist');
  });

  test('Node blacklist should include directory patterns', () => {
    assert.ok(DEFAULT_CONFIG.customBlacklist['node'].includes('node_modules/*'), 'should include node_modules/* in node blacklist');
    assert.ok(DEFAULT_CONFIG.customBlacklist['node'].includes('package-lock.json'), 'should include package-lock.json in node blacklist');
  });
});