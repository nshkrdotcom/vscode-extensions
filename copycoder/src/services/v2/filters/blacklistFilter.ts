import { FileFilter, FileMetadata, FilterContext } from "../../../models/fileMetadata";

export class BlacklistFilter implements FileFilter {
  filter(file: FileMetadata, context: FilterContext): boolean {
    const allBlacklistPatterns = this.buildBlacklistPatterns(context.config);
    
    if (allBlacklistPatterns.length === 0) {
      return true; // No blacklist patterns means allow all files
    }

    return !this.isBlacklisted(file.relativePath, allBlacklistPatterns);
  }

  private buildBlacklistPatterns(config: any): string[] {
    const patterns: string[] = [];
    
    // Add global blacklist patterns
    if (config.globalBlacklist && Array.isArray(config.globalBlacklist)) {
      patterns.push(...config.globalBlacklist);
    }
    
    // Add project-specific blacklist patterns
    if (config.projectTypes && Array.isArray(config.projectTypes)) {
      config.projectTypes.forEach((projectType: string) => {
        const projectBlacklist = config.customBlacklist?.[projectType];
        if (projectBlacklist && Array.isArray(projectBlacklist)) {
          patterns.push(...projectBlacklist);
        }
      });
    }
    
    return patterns;
  }

  private isBlacklisted(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => this.matchesPattern(filePath, pattern));
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    // Convert glob pattern to regex
    
    // Escape special regex characters except for * and ?
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    
    // Handle ** for recursive directory matching
    const regexPattern = escapedPattern.replace(/\.\*\.\*/g, ".*");
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}
