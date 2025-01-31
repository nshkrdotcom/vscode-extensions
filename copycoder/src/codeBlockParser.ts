interface ParsedCodeBlock {
    path: string;
    filename: string;
    extension: string;
    code: string;
}

export class CodeBlockParser {
    private static readonly FILE_PATH_REGEX = /^===\s*(.*?)\s*===$/;
    private static readonly CODE_BLOCK_START = "```diff";
    private static readonly CODE_BLOCK_END = "```";

    public static parseContent(content: string): ParsedCodeBlock[] {
        const blocks: ParsedCodeBlock[] = [];
        const lines = content.split('\n');
        console.log("lines: ", lines);
        let currentPath = '';
        let currentCode = '';
        let inCodeBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for file path
            const pathMatch = line.match(this.FILE_PATH_REGEX);
            if (pathMatch) {
                currentPath = pathMatch[1].trim();
                continue;
            }
            
            // Handle code block start/end
            if (line.startsWith(this.CODE_BLOCK_START)) {
                inCodeBlock = true;
                currentCode = '';
                continue;
            }
            
            if (line === this.CODE_BLOCK_END && inCodeBlock) {
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
            
            // Collect code content
            if (inCodeBlock) {
                currentCode += line + '\n';
            }
        }
        
        return blocks;
    }
    
    private static parsePathComponents(path: string): Omit<ParsedCodeBlock, 'code'> {
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