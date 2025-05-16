// src/test/suite/services/codeBlockParserService.test.ts
import * as assert from 'assert';
import { CodeBlockParserService } from '../../../services/codeBlockParserService';
import { ParsedCodeBlock } from '../../../models';

suite('CodeBlockParserService Tests', () => {
    let parser: CodeBlockParserService;

    setup(() => {
        parser = new CodeBlockParserService();
    });

    test('should parse single code block with file path', () => {
        const content = '=== src/app.js ===\n```\nconsole.log("Hello");\n```\n';
        const result = parser.parseContent(content);
        const expected: ParsedCodeBlock[] = [{
            path: 'src/app.js',
            filename: 'app.js',
            extension: 'js',
            code: 'console.log("Hello");'
        }];
        assert.deepStrictEqual(result, expected, 'should parse single code block with file path');
    });

    test('should parse multiple code blocks', () => {
        const content = '=== src/app.js ===\n```\nconsole.log("Hello");\n```\n=== README.md ===\n```\n# Project\n```\n';
        const result = parser.parseContent(content);
        const expected: ParsedCodeBlock[] = [
            {
                path: 'src/app.js',
                filename: 'app.js',
                extension: 'js',
                code: 'console.log("Hello");'
            },
            {
                path: 'README.md',
                filename: 'README.md',
                extension: 'md',
                code: '# Project'
            }
        ];
        assert.deepStrictEqual(result, expected, 'should parse multiple code blocks with file paths');
    });

    test('should handle empty content', () => {
        const result = parser.parseContent('');
        assert.deepStrictEqual(result, [], 'should return empty array for empty content');
    });

    test('should ignore invalid code blocks', () => {
        const content = '=== src/app.js ===\n```\nconsole.log("Hello");\n'; // Missing closing ```
        const result = parser.parseContent(content);
        assert.deepStrictEqual(result, [], 'should ignore incomplete code blocks');
    });

    test('should parse paths without extensions', () => {
        const content = '=== Dockerfile ===\n```\nFROM node:16\n```\n';
        const result = parser.parseContent(content);
        const expected: ParsedCodeBlock[] = [{
            path: 'Dockerfile',
            filename: 'Dockerfile',
            extension: '',
            code: 'FROM node:16'
        }];
        assert.deepStrictEqual(result, expected, 'should handle files without extensions');
    });

    test('should handle trailing newlines', () => {
        const content = '=== src/test.js ===\n```\nlet x = 1;\n```\n\n\n';
        const result = parser.parseContent(content);
        const expected: ParsedCodeBlock[] = [{
            path: 'src/test.js',
            filename: 'test.js',
            extension: 'js',
            code: 'let x = 1;'
        }];
        assert.deepStrictEqual(result, expected, 'should parse code block with multiple trailing newlines');
    });

    test('should handle Windows line endings', () => {
        const content = '=== src/test.js ===\r\n```\r\nlet x = 1;\r\n```\r\n';
        const result = parser.parseContent(content);
        const expected: ParsedCodeBlock[] = [{
            path: 'src/test.js',
            filename: 'test.js',
            extension: 'js',
            code: 'let x = 1;'
        }];
        assert.deepStrictEqual(result, expected, 'should parse code block with Windows line endings');
    });

    test('should handle messy formatting', () => {
        const content = '===  src/app.js  === \n ```javascript \n console.log("Hello"); \n ``` \n';
        const result = parser.parseContent(content);
        const expected: ParsedCodeBlock[] = [{
            path: 'src/app.js',
            filename: 'app.js',
            extension: 'js',
            code: 'console.log("Hello");'
        }];
        assert.deepStrictEqual(result, expected, 'should parse code block with extra spaces and language identifier');
    });
});