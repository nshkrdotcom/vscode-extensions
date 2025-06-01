import { FileFilter, FileMetadata, FilterContext } from '../../../models/fileMetadata';
import { Config } from '../../../models/config';
import * as path from 'path';

/**
 * Filters files based on allowed file extensions
 */
export class ExtensionFilter implements FileFilter {
  filter(file: FileMetadata, context: FilterContext): boolean {
    // Exclude directories
    if (file.isDirectory) {
      return false;
    }

    const allowedExtensions = this.buildAllowedExtensions(context.config);
    
    if (allowedExtensions.size === 0) {
      return false;
    }

    return this.hasAllowedExtension(file.relativePath, allowedExtensions);
  }

  private buildAllowedExtensions(config: any): Set<string> {
    const extensions: string[] = [];

    // Add global extensions if enabled
    if (config.includeGlobalExtensions) {
      extensions.push(...config.globalExtensions);
    }

    // Add project-specific extensions
    config.projectTypes.forEach((projectType: string) => {
      const projectExtensions = config.customExtensions[projectType] || [];
      extensions.push(...projectExtensions);
    });

    // Normalize extensions (ensure they start with a dot)
    const normalizedExtensions = extensions.map(ext => {
      const trimmed = ext.trim();
      return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
    });

    return new Set(normalizedExtensions);
  }

  private hasAllowedExtension(filePath: string, allowedExtensions: Set<string>): boolean {
    const fileExtension = path.extname(filePath).toLowerCase();
    return allowedExtensions.has(fileExtension);
  }
}
