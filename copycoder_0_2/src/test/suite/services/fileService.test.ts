// src/test/suite/services/fileService.test.ts
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { FileService } from '../../../services/fileService';
import { CopyCodeConfig, DEFAULT_EXTENSIONS, DEFAULT_BLACKLIST } from '../../../models';

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
            statSync: sandbox.stub()
        };
        fileService = new FileService(mockFs as any);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should include global extensions when includeGlobalExtensions is true', () => {
        const config: CopyCodeConfig = {
            includeGlobalExtensions: true,
            applyGlobalBlacklist: false,
            enabledProjectTypes: ['node'],
            customExtensions: [],
            customBlacklist: []
        };
        const extensions = fileService.getAllowedExtensions(config);
        assert.ok(extensions.has('.md'), 'should include global .md extension');
        assert.ok(extensions.has('.js'), 'should include node .js extension');
    });

    test('should exclude global extensions when includeGlobalExtensions is false', () => {
        const config: CopyCodeConfig = {
            includeGlobalExtensions: false,
            applyGlobalBlacklist: false,
            enabledProjectTypes: ['node'],
            customExtensions: [],
            customBlacklist: []
        };
        const extensions = fileService.getAllowedExtensions(config);
        assert.strictEqual(extensions.has('.md'), false, 'should not include global .md extension');
        assert.ok(extensions.has('.js'), 'should include node .js extension');
    });

    test('should include global blacklist when applyGlobalBlacklist is true', () => {
        const config: CopyCodeConfig = {
            includeGlobalExtensions: false,
            applyGlobalBlacklist: true,
            enabledProjectTypes: ['node'],
            customExtensions: [],
            customBlacklist: []
        };
        const blacklist = fileService.getBlacklistedFiles(config);
        assert.ok(blacklist.has('*.min.js'), 'should include global *.min.js pattern');
        assert.ok(blacklist.has('node_modules/*'), 'should include node node_modules/* pattern');
    });

    test('should exclude files in blacklisted directories', () => {
        const config: CopyCodeConfig = {
            includeGlobalExtensions: false,
            applyGlobalBlacklist: true,
            enabledProjectTypes: ['node'],
            customExtensions: [],
            customBlacklist: []
        };
        const extensions = fileService.getAllowedExtensions(config);
        const blacklist = fileService.getBlacklistedFiles(config);
        const result = fileService.shouldIncludeFile('script.js', 'node_modules/pkg/script.js', extensions, blacklist);
        assert.strictEqual(result, false, 'should exclude files in node_modules/*');
    });

    test('should include files with allowed extensions and not blacklisted', () => {
        const config: CopyCodeConfig = {
            includeGlobalExtensions: false,
            applyGlobalBlacklist: false,
            enabledProjectTypes: ['node'],
            customExtensions: [],
            customBlacklist: []
        };
        const extensions = fileService.getAllowedExtensions(config);
        const blacklist = fileService.getBlacklistedFiles(config);
        const result = fileService.shouldIncludeFile('app.js', 'src/app.js', extensions, blacklist);
        assert.strictEqual(result, true, 'should include .js files not in blacklist');
    });

    test('should respect .gitignore when scanning files', async () => {
        const workspaceFolder = {
            uri: { fsPath: '/fake/workspace' }
        } as vscode.WorkspaceFolder;
        mockFs.existsSync.withArgs('/fake/workspace/.gitignore').returns(true);
        mockFs.readFileSync.withArgs('/fake/workspace/.gitignore', 'utf8').returns('ignored.txt\nnode_modules/*');
        mockFs.readFileSync.withArgs('/fake/workspace/app.js', 'utf8').returns('console.log("test");');
        mockFs.readdirSync.withArgs('/fake/workspace').returns(['app.js', 'ignored.txt', 'node_modules'] as any);
        mockFs.statSync.callsFake((path: fs.PathLike) => {
            const filePath = path.toString();
            return {
                isDirectory: () => filePath.includes('node_modules'),
                isFile: () => !filePath.includes('node_modules'),
                isSymbolicLink: () => false,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isFIFO: () => false,
                isSocket: () => false,
                dev: 0,
                ino: 0,
                mode: 0,
                nlink: 0,
                uid: 0,
                gid: 0,
                rdev: 0,
                size: 0,
                blksize: 0,
                blocks: 0,
                atimeMs: 0,
                mtimeMs: 0,
                ctimeMs: 0,
                birthtimeMs: 0,
                atime: new Date(),
                mtime: new Date(),
                ctime: new Date(),
                birthtime: new Date()
            } as fs.Stats;
        });
        const config: CopyCodeConfig = {
            includeGlobalExtensions: false,
            applyGlobalBlacklist: false,
            enabledProjectTypes: ['node'],
            customExtensions: [],
            customBlacklist: []
        };
        const result = await fileService.scanWorkspaceFiles([workspaceFolder], config);
        assert.strictEqual(result.files.length, 1, 'should include only non-ignored files');
        assert.strictEqual(result.files[0].path, 'app.js', 'should include app.js');
        assert.strictEqual(result.hasGitignore, true, 'should detect .gitignore');
    });
});