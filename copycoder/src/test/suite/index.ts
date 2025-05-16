import Mocha from 'mocha';
import * as path from 'path';
import { glob } from 'glob';

export async function run(): Promise<void> {
  const mochaInstance = new Mocha({
    ui: 'tdd',
    color: true
  });

  const testsRoot = path.resolve(__dirname, '..');

  try {
    const files = await glob('**/**.test.js', { cwd: testsRoot });
    console.log('Discovered test files:', files); // Debug log
    files.forEach((f: string) => mochaInstance.addFile(path.resolve(testsRoot, f)));

    return new Promise((resolve, reject) => {
      mochaInstance.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    throw err;
  }
}
