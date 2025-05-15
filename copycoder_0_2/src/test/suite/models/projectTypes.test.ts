// src/test/suite/models/projectTypes.test.ts
import * as assert from 'assert';
import { DEFAULT_EXTENSIONS, DEFAULT_BLACKLIST } from '../../../models/projectTypes';

suite('Project Types Tests', () => {
    test('DEFAULT_EXTENSIONS should have expected project types', () => {
        const expectedProjectTypes = [
            'global', 'powershell', 'terraform', 'bash', 'php',
            'mysql', 'postgres', 'elixir', 'python', 'node',
            'vscode', 'wsl2'
        ];
        
        expectedProjectTypes.forEach(type => {
            assert.ok(DEFAULT_EXTENSIONS[type], `Project type ${type} should exist`);
            assert.ok(Array.isArray(DEFAULT_EXTENSIONS[type]), `Extensions for ${type} should be an array`);
            assert.ok(DEFAULT_EXTENSIONS[type].length > 0, `Extensions for ${type} should not be empty`);
        });
    });

    test('Global extensions should include commonly used file types', () => {
        const globalExtensions = DEFAULT_EXTENSIONS['global'];
        const expectedExtensions = ['.md', '.txt', '.gitignore', '.env.example', '.editorconfig'];
        
        expectedExtensions.forEach(ext => {
            assert.ok(globalExtensions.includes(ext), `Global extensions should include ${ext}`);
        });
    });

    test('DEFAULT_BLACKLIST should have expected project types', () => {
        const expectedBlacklistTypes = ['global', 'node', 'python', 'terraform', 'vscode', 'powershell'];
        
        expectedBlacklistTypes.forEach(type => {
            assert.ok(DEFAULT_BLACKLIST[type], `Blacklist for ${type} should exist`);
            assert.ok(Array.isArray(DEFAULT_BLACKLIST[type]), `Blacklist for ${type} should be an array`);
            assert.ok(DEFAULT_BLACKLIST[type].length > 0, `Blacklist for ${type} should not be empty`);
        });
    });

    test('Global blacklist should include common excluded patterns', () => {
        const globalBlacklist = DEFAULT_BLACKLIST['global'];
        const expectedPatterns = [
            '*.min.js',
            '*.min.css',
            '.DS_Store',
            'Thumbs.db',
            '.vscode/*',
            '.idea/*',
            '.vs/*'
        ];
        
        expectedPatterns.forEach(pattern => {
            assert.ok(globalBlacklist.includes(pattern), `Global blacklist should include ${pattern}`);
        });
    });

    test('Global blacklist should include directory patterns', () => {
        const globalBlacklist = DEFAULT_BLACKLIST['global'];
        const expectedDirectoryPatterns = [
            '.vscode/*',
            '.idea/*',
            '.vs/*'
        ];
        
        expectedDirectoryPatterns.forEach(pattern => {
            assert.ok(globalBlacklist.includes(pattern), `Global blacklist should include directory pattern ${pattern}`);
        });
    });

    test('Node blacklist should include directory patterns', () => {
        const nodeBlacklist = DEFAULT_BLACKLIST['node'];
        const expectedDirectoryPatterns = [
            'node_modules/*'
        ];
        
        expectedDirectoryPatterns.forEach(pattern => {
            assert.ok(nodeBlacklist.includes(pattern), `Node blacklist should include directory pattern ${pattern}`);
        });
    });
});