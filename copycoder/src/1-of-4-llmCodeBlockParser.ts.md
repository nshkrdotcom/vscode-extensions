// Types for our parser system
type CodeBlock = {
    path: string;
    filename: string;
    extension: string;
    code: string;
  };
  
  type ParseResult = CodeBlock[];
  
  // Interface for LLM integration
  interface ILLMProvider {
    processRequest(prompt: string): Promise<string>;
  }
  
  // Regex patterns for different code block formats
  const CODE_BLOCK_PATTERNS = {
    // Matches standard markdown code blocks with optional language
    MARKDOWN: /```(?:\w+)?\n([\s\S]*?)```/g,
    
    // Matches file paths in common formats
    FILE_PATH: /(?:\/[\w.-]+)+\.\w+|(?:[\w.-]+\/)+[\w.-]+\.\w+|\w+\.\w+/g,
    
    // Matches diff markers
    DIFF: /^[+-]{3}\s+(\S+)/gm,
  };
  
  /**
   * A class to parse code blocks from LLM responses into structured data
   */
  class CodeBlockParser {
    private llmProvider?: ILLMProvider;
  
    constructor(llmProvider?: ILLMProvider) {
      this.llmProvider = llmProvider;
    }
  
    /**
     * Main parsing function that processes raw text into structured code blocks
     */
    public parse(input: string): ParseResult {
      const blocks = this.extractCodeBlocks(input);
      return this.processBlocks(blocks);
    }
  
    /**
     * Extracts all code blocks from the input text
     */
    private extractCodeBlocks(input: string): string[] {
      const blocks: string[] = [];
      let match;
  
      // Extract markdown code blocks
      while ((match = CODE_BLOCK_PATTERNS.MARKDOWN.exec(input)) !== null) {
        blocks.push(match[1]);
      }
  
      return blocks;
    }
  
    /**
     * Process extracted blocks into structured format
     */
    private processBlocks(blocks: string[]): ParseResult {
      return blocks.map(block => this.parseBlock(block)).filter(Boolean) as ParseResult;
    }
  
    /**
     * Parse a single block into structured format
     */
    private parseBlock(block: string): CodeBlock | null {
      // Try to find a file path in the block or surrounding context
      const pathMatch = block.match(CODE_BLOCK_PATTERNS.FILE_PATH);
      if (!pathMatch) {
        return this.createDefaultBlock(block);
      }
  
      const fullPath = pathMatch[0];
      const pathParts = this.parsePathParts(fullPath);
  
      return {
        path: pathParts.path,
        filename: pathParts.filename,
        extension: pathParts.extension,
        code: this.cleanCode(block),
      };
    }
  
    /**
     * Parse path components from a file path
     */
    private parsePathParts(fullPath: string): {
      path: string;
      filename: string;
      extension: string;
    } {
      const parts = fullPath.split('/');
      const filename = parts.pop() || '';
      const [name, ext] = filename.split('.');
  
      return {
        path: parts.join('/'),
        filename: name,
        extension: ext || '',
      };
    }
  
    /**
     * Clean extracted code by removing common artifacts
     */
    private cleanCode(code: string): string {
      return code
        .trim()
        .replace(/^```[\w]*\n/, '') // Remove opening code fence
        .replace(/```$/, '')        // Remove closing code fence
        .trim();
    }
  
    /**
     * Create a default block when no path is found
     */
    private createDefaultBlock(code: string): CodeBlock {
      return {
        path: '',
        filename: 'unnamed',
        extension: this.inferFileType(code),
        code: this.cleanCode(code),
      };
    }
  
    /**
     * Attempt to infer the file type from code content
     */
    private inferFileType(code: string): string {
      // Simple inference based on content patterns
      if (code.includes('import React')) return 'tsx';
      if (code.includes('export class') || code.includes('interface ')) return 'ts';
      if (code.includes('function ') || code.includes('const ')) return 'js';
      if (code.includes('<html>') || code.includes('<!DOCTYPE')) return 'html';
      if (code.includes('body {') || code.includes('@media')) return 'css';
      return 'txt';
    }
  
    /**
     * Process a diff format if detected
     */
    private processDiff(block: string): ParseResult {
      const diffBlocks: ParseResult = [];
      const lines = block.split('\n');
      let currentFile: CodeBlock | null = null;
      let currentCode: string[] = [];
  
      lines.forEach(line => {
        const diffMatch = line.match(CODE_BLOCK_PATTERNS.DIFF);
        if (diffMatch) {
          // Save previous block if exists
          if (currentFile) {
            currentFile.code = currentCode.join('\n');
            diffBlocks.push(currentFile);
          }
          // Start new block
          const pathParts = this.parsePathParts(diffMatch[1]);
          currentFile = {
            path: pathParts.path,
            filename: pathParts.filename,
            extension: pathParts.extension,
            code: '',
          };
          currentCode = [];
        } else if (currentFile && !line.startsWith('+++') && !line.startsWith('---')) {
          currentCode.push(line);
        }
      });
  
      // Add final block
      if (currentFile) {
        currentFile.code = currentCode.join('\n');
        diffBlocks.push(currentFile);
      }
  
      return diffBlocks;
    }
  
    /**
     * Batch process multiple inputs
     */
    public async batchProcess(inputs: string[]): Promise<ParseResult[]> {
      return Promise.all(inputs.map(input => Promise.resolve(this.parse(input))));
    }
  
    /**
     * Process with LLM if provider is configured
     */
    public async processWithLLM(input: string): Promise<ParseResult> {
      if (!this.llmProvider) {
        throw new Error('LLM provider not configured');
      }
  
      const response = await this.llmProvider.processRequest(input);
      return this.parse(response);
    }
  }
  
  // Example usage:
  /*
  const parser = new CodeBlockParser();
  
  const input = `
  Here's a React component:
  
  \`\`\`tsx
  // src/components/Button.tsx
  import React from 'react';
  
  export const Button = () => {
    return <button>Click me</button>;
  };
  \`\`\`
  
  And here's some CSS:
  
  \`\`\`css
  .button {
    background: blue;
  }
  \`\`\`
  `;
  
  const result = parser.parse(input);
  console.log(result);
  */
  
  export { CodeBlockParser, type CodeBlock, type ParseResult, type ILLMProvider };