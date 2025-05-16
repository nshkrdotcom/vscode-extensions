import * as assert from 'assert';
import * as sinon from 'sinon';
import { FileService, FileContent } from '../../../services/fileService';
import { MockFileSystem } from '../mockFileSystem';
import { Config } from '../../../models/config';

suite('FileService Tests', () => {
  let fileService: FileService;
  let fileSystem: MockFileSystem;

  setup(() => {
    fileSystem = new MockFileSystem();
    fileService = new FileService(fileSystem);
  });

  teardown(() => {
    sinon.restore();
  });

  test('should include global extensions when includeGlobalExtensions is true', async () => {
    fileSystem.writeFileSync('/project/file.md', 'Markdown content', 'utf-8');
    fileSystem.writeFileSync('/project/file.js', 'JS content', 'utf-8');
    console.log('Test: include global extensions - files in MockFileSystem:', Object.keys(fileSystem['files']));
    console.log('Test: include global extensions - directories in MockFileSystem:', fileSystem['directories']);

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.md'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: {}
    };
    console.log('Test: include global extensions - config:', config);

    const files = fileService.getFiles('/project', config);
    console.log('Test: include global extensions - returned files:', files.map(f => f.path));

    assert.strictEqual(files.length, 2, 'should include both .md and .js files');
    assert.ok(files.some((f: FileContent) => f.path === 'file.md'), 'should include file.md');
    assert.ok(files.some((f: FileContent) => f.path === 'file.js'), 'should include file.js');
  });

  test('should exclude global extensions when includeGlobalExtensions is false', async () => {
    fileSystem.writeFileSync('/project/file.md', 'Markdown content', 'utf-8');
    fileSystem.writeFileSync('/project/file.js', 'JS content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: false,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.md'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 1, 'should include only .js file');
    assert.ok(files.some((f: FileContent) => f.path === 'file.js'), 'should include file.js');
    assert.ok(!files.some((f: FileContent) => f.path === 'file.md'), 'should exclude file.md');
  });

  test('should include global blacklist when filterUsingGitignore is true', async () => {
    fileSystem.writeFileSync('/project/node_modules/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: ['node_modules'],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 1, 'should exclude node_modules');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(!files.some((f: FileContent) => f.path.includes('node_modules')), 'should exclude node_modules/file.js');
  });

  test('should exclude files in blacklisted directories', async () => {
    fileSystem.writeFileSync('/project/dist/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: ['dist'] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 1, 'should exclude dist directory');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(!files.some((f: FileContent) => f.path.includes('dist')), 'should exclude dist/file.js');
  });

  test('should include files with allowed extensions and not blacklisted', async () => {
    fileSystem.writeFileSync('/project/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/file.exe', 'Binary content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 1, 'should include only .js file');
    assert.ok(files.some((f: FileContent) => f.path === 'file.js'), 'should include file.js');
    assert.ok(!files.some((f: FileContent) => f.path === 'file.exe'), 'should exclude file.exe');
  });

  test('should respect .gitignore when scanning files', async () => {
    fileSystem.writeFileSync('/project/.gitignore', 'node_modules\n', 'utf-8');
    fileSystem.writeFileSync('/project/node_modules/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 1, 'should respect .gitignore');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(!files.some((f: FileContent) => f.path.includes('node_modules')), 'should exclude node_modules/file.js');
  });
});