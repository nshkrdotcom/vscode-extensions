import * as fs from 'fs';
import { FileSystem } from './fileSystem';

export class NodeFileSystem implements FileSystem {
  existsSync(path: string): boolean {
    try {
      return fs.existsSync(path);
    } catch (error) {
      console.error('Error checking if path exists:', path, error);
      return false;
    }
  }

  mkdirSync(path: string, options?: { recursive: boolean }): void {
    try {
      console.log('Debug: Creating directory at', path);
      fs.mkdirSync(path, options);
      console.log('Debug: Directory created successfully');
    } catch (error) {
      console.error('Error creating directory:', path, error);
      throw error;
    }
  }

  readFileSync(path: string, encoding: string): string {
    try {
      console.log('Debug: Reading file from', path);
      const content = fs.readFileSync(path, { encoding: encoding as BufferEncoding }).toString();
      console.log('Debug: File read successfully, content length:', content.length);
      return content;
    } catch (error) {
      console.error('Error reading file:', path, error);
      throw error;
    }
  }

  writeFileSync(path: string, data: string, encoding: string): void {
    try {
      console.log('Debug: Writing file to', path);
      fs.writeFileSync(path, data, { encoding: encoding as BufferEncoding });
      console.log('Debug: File written successfully');
    } catch (error) {
      console.error('Error writing file:', path, error);
      throw error;
    }
  }

  unlinkSync(path: string): void {
    try {
      console.log('Debug: Deleting file at', path);
      fs.unlinkSync(path);
      console.log('Debug: File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', path, error);
      throw error;
    }
  }

  readdirSync(path: string): string[] {
    try {
      console.log('Debug: Reading directory', path);
      const files = fs.readdirSync(path);
      console.log('Debug: Directory read successfully, file count:', files.length);
      return files;
    } catch (error) {
      console.error('Error reading directory:', path, error);
      throw error;
    }
  }

  isDirectory(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
    } catch (error) {
      console.error('Error checking if path is directory:', path, error);
      return false; // Return false if the path doesn't exist or is inaccessible
    }
  }
}