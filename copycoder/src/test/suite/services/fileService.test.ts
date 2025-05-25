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

  test('should use git tracking when filterUsingGitignore is true', async () => {
    fileSystem.writeFileSync('/project/node_modules/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');
    
    // Set up git tracked files (simulating that only src/file.js is tracked, not node_modules)
    fileSystem.setGitTrackedFiles(['src/file.js']);

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

    assert.strictEqual(files.length, 1, 'should only include git tracked files');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(!files.some((f: FileContent) => f.path.includes('node_modules')), 'should exclude node_modules/file.js (not tracked)');
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

  test('should respect git tracking when scanning files', async () => {
    fileSystem.writeFileSync('/project/node_modules/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/README.md', 'Readme content', 'utf-8');
    
    // Set up git tracked files (simulating that only src/file.js and README.md are tracked)
    fileSystem.setGitTrackedFiles(['src/file.js', 'README.md']);

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: ['.js', '.md'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 2, 'should only include git tracked files');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(files.some((f: FileContent) => f.path === 'README.md'), 'should include README.md');
    assert.ok(!files.some((f: FileContent) => f.path.includes('node_modules')), 'should exclude node_modules/file.js (not tracked)');
  });

  test('should not use git tracking when filterUsingGitignore is false', async () => {
    fileSystem.writeFileSync('/project/node_modules/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');
    
    // Set up git tracked files, but they shouldn't be used since filterUsingGitignore is false
    fileSystem.setGitTrackedFiles(['src/file.js']);

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

    assert.strictEqual(files.length, 2, 'should include all files when git filtering is disabled');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(files.some((f: FileContent) => f.path.includes('node_modules')), 'should include node_modules/file.js when git filtering is disabled');
  });

  test('should handle extensions with and without dots', async () => {
    fileSystem.writeFileSync('/project/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/file.py', 'Python content', 'utf-8');
    fileSystem.writeFileSync('/project/file.txt', 'Text content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['js', '.py'], // Mix of with and without dots
      customExtensions: { node: ['txt'] }, // Without dot
      globalBlacklist: [],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 3, 'should include all files regardless of dot notation');
    assert.ok(files.some((f: FileContent) => f.path === 'file.js'), 'should include file.js');
    assert.ok(files.some((f: FileContent) => f.path === 'file.py'), 'should include file.py');
    assert.ok(files.some((f: FileContent) => f.path === 'file.txt'), 'should include file.txt');
  });

  test('should respect global blacklist patterns', async () => {
    fileSystem.writeFileSync('/project/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/file.min.js', 'Minified JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'Source JS content', 'utf-8');
    fileSystem.writeFileSync('/project/.DS_Store', 'System file', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: ['*.min.js', '.DS_Store'],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 2, 'should exclude blacklisted files');
    assert.ok(files.some((f: FileContent) => f.path === 'file.js'), 'should include file.js');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(!files.some((f: FileContent) => f.path === 'file.min.js'), 'should exclude file.min.js');
    assert.ok(!files.some((f: FileContent) => f.path === '.DS_Store'), 'should exclude .DS_Store');
  });

  test('should handle directory blacklist patterns', async () => {
    fileSystem.writeFileSync('/project/node_modules/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/src/file.js', 'JS content', 'utf-8');
    fileSystem.writeFileSync('/project/dist/file.js', 'Built JS content', 'utf-8');

    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: ['node_modules', 'dist'],
      customBlacklist: { node: [] }
    };

    const files = fileService.getFiles('/project', config);

    assert.strictEqual(files.length, 1, 'should exclude blacklisted directories');
    assert.ok(files.some((f: FileContent) => f.path === 'src/file.js'), 'should include src/file.js');
    assert.ok(!files.some((f: FileContent) => f.path.includes('node_modules')), 'should exclude node_modules directory');
    assert.ok(!files.some((f: FileContent) => f.path.includes('dist')), 'should exclude dist directory');
  });
});