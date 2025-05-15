// src/services/codeBlockParserService.ts
import { ParsedCodeBlock } from '../models';

export class CodeBlockParserService {
    private static readonly FILE_PATH_REGEX = /^\s*===\s*(.*?)\s*===\s*$/;
    private static readonly CODE_BLOCK_START_REGEX = /^```.*$/;
    private static readonly CODE_BLOCK_END_REGEX = /^```$/;

    public parseContent(content: string): ParsedCodeBlock[] {
        const blocks: ParsedCodeBlock[] = [];
        const normalizedContent = content.replace(/\r\n/g, '\n');
        const lines = normalizedContent.split('\n').filter(line => line.trim() !== '');
        let currentPath = '';
        let currentCode = '';
        let inCodeBlock = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check for file path
            const pathMatch = line.match(CodeBlockParserService.FILE_PATH_REGEX);
            if (pathMatch) {
                currentPath = pathMatch[1].trim();
                continue;
            }
            
            // Handle code block end (check first when in code block)
            if (inCodeBlock && CodeBlockParserService.CODE_BLOCK_END_REGEX.test(trimmedLine)) {
                inCodeBlock = false;
                if (currentPath) {
                    const parsed = this.parsePathComponents(currentPath);
                    blocks.push({
                        ...parsed,
                        code: currentCode.trim()
                    });
                }
                continue;
            }
            
            // Handle code block start
            if (!inCodeBlock && CodeBlockParserService.CODE_BLOCK_START_REGEX.test(trimmedLine)) {
                inCodeBlock = true;
                currentCode = '';
                continue;
            }
            
            // Collect code content
            if (inCodeBlock) {
                currentCode += line + '\n';
            }
        }
        
        return blocks;
    }
    
    private parsePathComponents(path: string): Omit<ParsedCodeBlock, 'code'> {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        const extension = filename.includes('.') ? 
            filename.split('.').pop() || '' : '';
            
        return {
            path: path,
            filename: filename,
            extension: extension
        };
    }
}