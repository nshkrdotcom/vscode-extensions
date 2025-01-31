// Types to represent our parsed code blocks
type CodeBlock = {
    path: string;
    filename: string;
    extension: string;
    code: string;
    language: CodeLanguage;  // Added language enum for stronger typing
    metadata?: Record<string, any>;  // For additional file-specific metadata
  };
  
  // Enumeration of supported languages for stronger typing
  enum CodeLanguage {
    PHP = 'php',
    MySQL = 'mysql',
    JavaScript = 'javascript',
    CSS = 'css',
    HTML = 'html',
    Shell = 'shell',
    PowerShell = 'powershell',
    Terraform = 'terraform',
    Unknown = 'unknown'
  }
  
  type ParseResult = CodeBlock[];
  
  /**
   * Language-specific patterns to help identify file types and validate content
   */
  const LANGUAGE_PATTERNS = {
    PHP: {
      extensions: ['php', 'phtml', 'php7', 'phps', 'php-s', 'pht', 'phar'],
      markers: [
        '<?php',
        'namespace',
        'use ',
        'class ',
        'function ',
        '->'
      ],
      isValid: (code: string): boolean => 
        code.includes('<?php') || code.includes('<?=') || /\bfunction\s+\w+\s*\(/.test(code)
    },
    
    MySQL: {
      extensions: ['sql'],
      markers: [
        'SELECT ',
        'INSERT ',
        'UPDATE ',
        'DELETE ',
        'CREATE TABLE',
        'ALTER TABLE'
      ],
      isValid: (code: string): boolean => 
        /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i.test(code)
    },
    
    JavaScript: {
      extensions: ['js', 'mjs', 'cjs'],
      markers: [
        'function ',
        'const ',
        'let ',
        'var ',
        'import ',
        'export ',
        '=>'
      ],
      isValid: (code: string): boolean => 
        /\b(function|const|let|var|import|export)\b/.test(code) || 
        code.includes('=>')
    },
    
    CSS: {
      extensions: ['css', 'scss', 'sass', 'less'],
      markers: [
        '{',
        '}',
        ';',
        '@media',
        '@import'
      ],
      isValid: (code: string): boolean => 
        /[^}]*{[^{]*}/.test(code) || code.includes('@media') || code.includes('@import')
    },
    
    HTML: {
      extensions: ['html', 'htm', 'xhtml'],
      markers: [
        '<!DOCTYPE',
        '<html',
        '<head',
        '<body',
        '<div',
        '<p>'
      ],
      isValid: (code: string): boolean => 
        /<!DOCTYPE|<html|<head|<body/.test(code) || /<[^>]+>/.test(code)
    },
    
    Shell: {
      extensions: ['sh', 'bash', 'zsh'],
      markers: [
        '#!/bin/bash',
        '#!/bin/sh',
        'echo ',
        'chmod',
        'chown',
        'sudo '
      ],
      isValid: (code: string): boolean => 
        code.includes('#!/bin') || /\b(echo|chmod|chown|sudo)\b/.test(code)
    },
    
    PowerShell: {
      extensions: ['ps1', 'psm1', 'psd1'],
      markers: [
        'Write-Host',
        'Get-',
        'Set-',
        '$PSScriptRoot',
        'param('
      ],
      isValid: (code: string): boolean => 
        /\b(Write-Host|Get-|Set-|\$\w+)\b/.test(code)
    },
    
    Terraform: {
      extensions: ['tf', 'tfvars', 'hcl'],
      markers: [
        'resource "',
        'provider "',
        'variable "',
        'output "',
        'terraform {'
      ],
      isValid: (code: string): boolean => 
        /\b(resource|provider|variable|output)\s+"[^"]+"/.test(code) ||
        code.includes('terraform {')
    }
  };
  
  /**
   * Regex patterns for different code block formats
   */
  const CODE_BLOCK_PATTERNS = {
    // Matches markdown code blocks with language identifier
    MARKDOWN: /```(?:(\w+)\n)?([\s\S]*?)```/g,
    
    // Matches common file paths
    FILE_PATH: /(?:(?:[\w-]+\/)*[\w.-]+\.[\w]+)|(?:[\w-]+\.[\w]+)/g,
    
    // Special pattern for PHP tags
    PHP_TAGS: /<\?(?:php|=)[\s\S]*?\?>/g,
    
    // Pattern for HTML documents
    HTML_DOC: /<!DOCTYPE[^>]*>[\s\S]*<html[\s\S]*?>/i,
    
    // Pattern for SQL statements
    SQL_STATEMENT: /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i,
  };
  
  /**
   * A specialized parser for handling code blocks from various languages
   */
  class SpecializedCodeParser {
    /**
     * Main parsing function that processes raw text into structured code blocks
     */
    public parse(input: string): ParseResult {
      const blocks = this.extractCodeBlocks(input);
      return this.processBlocks(blocks);
    }
  
    /**
     * Extracts all code blocks from the input text, handling various formats
     */
    private extractCodeBlocks(input: string): Array<{code: string, language?: string}> {
      const blocks: Array<{code: string, language?: string}> = [];
      let match;
  
      // Extract markdown code blocks with language identifiers
      while ((match = CODE_BLOCK_PATTERNS.MARKDOWN.exec(input)) !== null) {
        blocks.push({
          code: match[2],
          language: match[1]?.toLowerCase()
        });
      }
  
      // If no markdown blocks found, try to parse as raw code
      if (blocks.length === 0 && input.trim()) {
        blocks.push({
          code: input.trim()
        });
      }
  
      return blocks;
    }
  
    /**
     * Process extracted blocks into structured format with language detection
     */
    private processBlocks(blocks: Array<{code: string, language?: string}>): ParseResult {
      return blocks
        .map(block => this.parseBlock(block))
        .filter((block): block is CodeBlock => block !== null);
    }
  
    /**
     * Parse a single block, detecting its language and extracting metadata
     */
    private parseBlock(block: {code: string, language?: string}): CodeBlock | null {
      const code = this.cleanCode(block.code);
      if (!code) return null;
  
      // Detect the language if not explicitly specified
      const language = block.language ? 
        this.mapLanguageIdentifier(block.language) :
        this.detectLanguage(code);
  
      // Extract path information if available
      const pathInfo = this.extractPathInfo(block.code, language);
  
      // Create the code block with detected information
      return {
        path: pathInfo.path,
        filename: pathInfo.filename,
        extension: pathInfo.extension || this.getDefaultExtension(language),
        code: code,
        language: language,
        metadata: this.extractMetadata(code, language)
      };
    }
  
    /**
     * Clean the code block by removing unnecessary artifacts
     */
    private cleanCode(code: string): string {
      return code
        .trim()
        .replace(/^```[\w]*\n/, '')
        .replace(/```$/, '')
        .trim();
    }
  
    /**
     * Map various language identifiers to our supported languages
     */
    private mapLanguageIdentifier(identifier: string): CodeLanguage {
      const mappings: Record<string, CodeLanguage> = {
        'php': CodeLanguage.PHP,
        'mysql': CodeLanguage.MySQL,
        'sql': CodeLanguage.MySQL,
        'js': CodeLanguage.JavaScript,
        'javascript': CodeLanguage.JavaScript,
        'css': CodeLanguage.CSS,
        'html': CodeLanguage.HTML,
        'shell': CodeLanguage.Shell,
        'bash': CodeLanguage.Shell,
        'sh': CodeLanguage.Shell,
        'powershell': CodeLanguage.PowerShell,
        'ps1': CodeLanguage.PowerShell,
        'terraform': CodeLanguage.Terraform,
        'tf': CodeLanguage.Terraform,
        'hcl': CodeLanguage.Terraform
      };
  
      return mappings[identifier.toLowerCase()] || CodeLanguage.Unknown;
    }
  
    /**
     * Detect the language of a code block based on its content
     */
    private detectLanguage(code: string): CodeLanguage {
      // Check each language's patterns and validation rules
      for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
        if (patterns.isValid(code)) {
          return CodeLanguage[language as keyof typeof CodeLanguage];
        }
      }
  
      // Look for specific markers if validation didn't yield results
      for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
        if (patterns.markers.some(marker => code.includes(marker))) {
          return CodeLanguage[language as keyof typeof CodeLanguage];
        }
      }
  
      return CodeLanguage.Unknown;
    }
  
    /**
     * Extract path information from code or comments
     */
    private extractPathInfo(code: string, language: CodeLanguage): {
      path: string;
      filename: string;
      extension: string;
    } {
      // Look for path in comments or code
      const pathMatch = code.match(CODE_BLOCK_PATTERNS.FILE_PATH);
      
      if (pathMatch) {
        const fullPath = pathMatch[0];
        const parts = fullPath.split('/');
        const filename = parts.pop() || '';
        const [name, ext] = filename.split('.');
  
        return {
          path: parts.join('/'),
          filename: name,
          extension: ext || ''
        };
      }
  
      // Return default values if no path found
      return {
        path: '',
        filename: 'unnamed',
        extension: this.getDefaultExtension(language)
      };
    }
  
    /**
     * Get the default file extension for a language
     */
    private getDefaultExtension(language: CodeLanguage): string {
      const defaults: Record<CodeLanguage, string> = {
        [CodeLanguage.PHP]: 'php',
        [CodeLanguage.MySQL]: 'sql',
        [CodeLanguage.JavaScript]: 'js',
        [CodeLanguage.CSS]: 'css',
        [CodeLanguage.HTML]: 'html',
        [CodeLanguage.Shell]: 'sh',
        [CodeLanguage.PowerShell]: 'ps1',
        [CodeLanguage.Terraform]: 'tf',
        [CodeLanguage.Unknown]: 'txt'
      };
  
      return defaults[language];
    }
  
    /**
     * Extract additional metadata based on the language
     */
    private extractMetadata(code: string, language: CodeLanguage): Record<string, any> {
      const metadata: Record<string, any> = {};
  
      switch (language) {
        case CodeLanguage.PHP:
          metadata.hasNamespace = code.includes('namespace');
          metadata.isClass = /\bclass\s+\w+/.test(code);
          metadata.dependencies = this.extractPhpDependencies(code);
          break;
  
        case CodeLanguage.MySQL:
          metadata.queryType = this.detectSqlQueryType(code);
          metadata.tables = this.extractSqlTables(code);
          break;
  
        case CodeLanguage.JavaScript:
          metadata.hasExports = code.includes('export');
          metadata.hasImports = code.includes('import');
          metadata.isModule = code.includes('export') || code.includes('import');
          break;
  
        case CodeLanguage.Terraform:
          metadata.resources = this.extractTerraformResources(code);
          metadata.providers = this.extractTerraformProviders(code);
          break;
      }
  
      return metadata;
    }
  
    /**
     * Extract PHP dependencies from use statements
     */
    private extractPhpDependencies(code: string): string[] {
      const useStatements = code.match(/use\s+[\w\\]+(?:\s+as\s+\w+)?;/g) || [];
      return useStatements.map(statement => 
        statement.replace(/^use\s+/, '').replace(/;$/, ''));
    }
  
    /**
     * Detect SQL query type
     */
    private detectSqlQueryType(code: string): string {
      const types = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER'];
      for (const type of types) {
        if (new RegExp(`\\b${type}\\b`, 'i').test(code)) {
          return type;
        }
      }
      return 'UNKNOWN';
    }
  
    /**
     * Extract table names from SQL query
     */
    private extractSqlTables(code: string): string[] {
      const tableMatches = code.match(/(?:FROM|JOIN|INTO|UPDATE)\s+`?\w+`?/gi) || [];
      return tableMatches.map(match => 
        match.replace(/(?:FROM|JOIN|INTO|UPDATE)\s+`?(\w+)`?/i, '$1'));
    }
  
    /**
     * Extract Terraform resource blocks
     */
    private extractTerraformResources(code: string): string[] {
      const resources: string[] = [];
      const resourceMatches = code.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];
      
      for (const match of resourceMatches) {
        const [, type, name] = match.match(/resource\s+"([^"]+)"\s+"([^"]+)"/) || [];
        if (type && name) {
          resources.push(`${type}.${name}`);
        }
      }
      
      return resources;
    }
  
    /**
     * Extract Terraform providers
     */
    private extractTerraformProviders(code: string): string[] {
      const providers: string[] = [];
      const providerMatches = code.match(/provider\s+"[^"]+"/g) || [];
      
      for (const match of providerMatches) {
        const [, name] = match.match(/provider\s+"([^"]+)"/) || [];
        if (name) {
          providers.push(name);
        }
      }
      
      return providers;
    }
  }
  
  // Example usage:
  /*
  const parser = new SpecializedCodeParser();
  
  const input = `
  Here's a PHP class:
  
  \`\`\`php
  <?php
  namespace App\\Controllers;
  
  use App\\Models\\User;
  
  class UserController {
      public function index() {
          return User::all();
      }
  }
  \`\`\`
  
  And some MySQL:
  
  \`\`\`sql
  SELECT u.name, u.email 
  FROM users u 
  JOIN orders o ON u.id = o.