const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the config file
const configDir = path.join(os.homedir(), '.copycoder');
const configPath = path.join(configDir, 'config.json');

console.log('Testing reset functionality...');
console.log(`Config path: ${configPath}`);

// First, back up the current config if it exists
if (fs.existsSync(configPath)) {
  const backupPath = path.join(configDir, 'config.json.backup');
  console.log(`Backing up existing config to: ${backupPath}`);
  fs.copyFileSync(configPath, backupPath);

  // Read the current config
  console.log('Reading current config...');
  const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('Current config has:');
  console.log('- Project types:', currentConfig.projectTypes.length);
  console.log('- Global extensions:', currentConfig.globalExtensions.length);
  console.log('- Custom extensions:', Object.keys(currentConfig.customExtensions).length);
}

// Modify the config to a simpler version to test reset
console.log('\nCreating a minimal test config...');
const minConfig = {
  includeGlobalExtensions: false,
  filterUsingGitignore: false,
  projectTypes: ['test-only'],
  globalExtensions: ['.test'],
  customExtensions: {},
  globalBlacklist: [],
  customBlacklist: {}
};

// Make sure the directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Write the minimal config
fs.writeFileSync(configPath, JSON.stringify(minConfig, null, 2), 'utf8');
console.log('Minimal test config written');

// Read the modified config
const testConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log('Test config has:');
console.log('- Project types:', testConfig.projectTypes.length, testConfig.projectTypes);
console.log('- Global extensions:', testConfig.globalExtensions.length, testConfig.globalExtensions);

// Now run the VS Code extension and manually reset the config through the UI

console.log('\nNow:');
console.log('1. Launch VS Code with the extension');
console.log('2. Click on the CopyCoder icon in the sidebar');
console.log('3. Under "General", click on "Reset Configuration"');
console.log('4. Confirm the reset');
console.log('5. Run this script again to verify the reset worked');
console.log('\nThen, examine ~/.copycoder/config.json manually to verify it contains the rich defaults\n');

// If the backup file exists, show instructions to restore it
if (fs.existsSync(path.join(configDir, 'config.json.backup'))) {
  console.log('To restore your previous config:');
  console.log(`cp ${path.join(configDir, 'config.json.backup')} ${configPath}`);
} 