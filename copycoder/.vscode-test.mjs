// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';
import { glob } from 'glob';

const testFiles = glob.sync('out/test/**/*.test.js');
console.log('Discovered test files:', testFiles);

export default defineConfig({
  files: 'out/test/**/*.test.js',
});
