import * as assert from 'assert';
import { AVAILABLE_EXTENSIONS, AVAILABLE_BLACKLIST } from '../../../models/config';
import { MockFileSystem } from '../mockFileSystem'; // Import MockFileSystem for consistency

suite('Project Types Tests', () => {
  setup(() => {
    // No file system interaction, but included for consistency
    new MockFileSystem();
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
    const actualTypes = Object.keys(AVAILABLE_EXTENSIONS).filter(type => type !== 'global');
    assert.strictEqual(actualTypes.length, 11, 'should include all project types');
    expectedTypes.forEach(type => {
      assert.ok(Object.keys(AVAILABLE_EXTENSIONS).includes(type), `should include ${type} project type`);
    });
  });

  test('Global extensions should include commonly used file types', () => {
    assert.deepStrictEqual(AVAILABLE_EXTENSIONS['global'], [
      '.md',
      '.txt',
      '.gitignore',
      '.env.example',
      '.editorconfig'
    ]);
  });

  test('AVAILABLE_BLACKLIST should have expected project types', () => {
    const expectedBlacklistTypes = ['global', 'node', 'python', 'terraform', 'vscode', 'powershell'];
    assert.deepStrictEqual(Object.keys(AVAILABLE_BLACKLIST).sort(), expectedBlacklistTypes.sort());
  });

  test('Global blacklist should include common excluded patterns', () => {
    assert.ok(AVAILABLE_BLACKLIST['global'].includes('*.min.js'));
    assert.ok(AVAILABLE_BLACKLIST['global'].includes('*.min.css'));
    assert.ok(AVAILABLE_BLACKLIST['global'].includes('.DS_Store'));
  });

  test('Global blacklist should include directory patterns', () => {
    assert.ok(AVAILABLE_BLACKLIST['global'].includes('.vscode/*'));
    assert.ok(AVAILABLE_BLACKLIST['global'].includes('.idea/*'));
  });

  test('Node blacklist should include directory patterns', () => {
    assert.ok(AVAILABLE_BLACKLIST['node'].includes('node_modules/*'));
  });
});