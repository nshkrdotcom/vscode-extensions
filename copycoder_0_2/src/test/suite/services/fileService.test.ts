import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { FileService, FileContent } from '../../../services/fileService';
import { Config } from '../../../models/config';

suite('FileService Tests', () => {
  let fileService: FileService;
  let sandbox: sinon.SinonSandbox;
  let mockFs: {
    existsSync: sinon.SinonStub;
    readFileSync: sinon.SinonStub;
    readdirSync: sinon.SinonStub;
    statSync: sinon.SinonStub;
  };

  setup(() => {
    sandbox = sinon.createSandbox();
    mockFs = {
      existsSync: sandbox.stub(),
      readFileSync: sandbox.stub(),
      readdirSync: sandbox.stub(),
      statSync: sandbox.stub(),
    };
    fileService = new FileService(mockFs as any);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should include global extensions when includeGlobalExtensions is true', () => {
    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.md', '.js'],
      customExtensions: { node: [] },
      globalBlacklist: [],
      customBlacklist: { node: [] },
    };
    const extensions = fileService.getAllowedExtensions(config);
    assert.ok(extensions.has('.md'), 'should include global .md extension');
    assert.ok(extensions.has('.js'), 'should include global .js extension');
  });

  test('should exclude global extensions when includeGlobalExtensions is false', () => {
    const config: Config = {
      includeGlobalExtensions: false,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.md'],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] },
    };
    const extensions = fileService.getAllowedExtensions(config);
    assert.strictEqual(extensions.has('.md'), false, 'should not include global .md extension');
    assert.ok(extensions.has('.js'), 'should include node .js extension');
  });

  test('should include global blacklist when filterUsingGitignore is true', () => {
    const config: Config = {
      includeGlobalExtensions: false,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: [],
      customExtensions: { node: [] },
      globalBlacklist: ['*.min.js'],
      customBlacklist: { node: ['node_modules'] },
    };
    const blacklist = fileService.getBlacklistedFiles(config);
    assert.ok(blacklist.has('*.min.js'), 'should include global *.min.js pattern');
    assert.ok(blacklist.has('node_modules'), 'should include node node_modules pattern');
    assert.ok(blacklist.has('.git'), 'should include .git from gitignore');
  });

  test('should exclude files in blacklisted directories', () => {
    const config: Config = {
      includeGlobalExtensions: false,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: [],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: ['node_modules'] },
    };
    const extensions = fileService.getAllowedExtensions(config);
    const blacklist = fileService.getBlacklistedFiles(config);
    const result = fileService.shouldIncludeFile('script.js', 'node_modules/pkg/script.js', extensions, blacklist);
    assert.strictEqual(result, false, 'should exclude files in node_modules');
  });

  test('should include files with allowed extensions and not blacklisted', () => {
    const config: Config = {
      includeGlobalExtensions: false,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: [],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] },
    };
    const extensions = fileService.getAllowedExtensions(config);
    const blacklist = fileService.getBlacklistedFiles(config);
    const result = fileService.shouldIncludeFile('app.js', 'src/app.js', extensions, blacklist);
    assert.strictEqual(result, true, 'should include .js files not in blacklist');
  });

  test('should respect .gitignore when scanning files', async () => {
    const workspaceFolder = {
      uri: { fsPath: '/fake/workspace' },
    } as vscode.WorkspaceFolder;
    mockFs.existsSync.withArgs('/fake/workspace/.gitignore').returns(true);
    mockFs.readFileSync.withArgs('/fake/workspace/.gitignore', 'utf-8').returns('ignored.txt\nnode_modules/*');
    mockFs.readFileSync.withArgs('/fake/workspace/app.js', 'utf-8').returns('console.log("test");');
    sandbox.stub(vscode.workspace, 'findFiles').resolves([
      { fsPath: '/fake/workspace/app.js', path: '/fake/workspace/app.js' } as vscode.Uri,
    ]);
    sandbox.stub(vscode.workspace, 'asRelativePath').callsFake((uri: vscode.Uri | string) => {
      if (typeof uri === 'string') {
        return uri.replace('/fake/workspace/', '');
      }
      return uri.fsPath.replace('/fake/workspace/', '');
    });
    const config: Config = {
      includeGlobalExtensions: false,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: [],
      customExtensions: { node: ['.js'] },
      globalBlacklist: [],
      customBlacklist: { node: [] },
    };
    const result = await fileService.scanWorkspaceFiles(config, '/fake/workspace');
    assert.strictEqual(result.length, 1, 'should include only non-ignored files');
    assert.strictEqual(result[0].path, 'app.js', 'should include app.js');
  });
});