// src/test/suite/models/defaultConfig.test.ts
import * as assert from 'assert';
import { DEFAULT_CONFIG } from '../../../models/defaultConfig';

suite('Default Configuration Tests', () => {
    test('DEFAULT_CONFIG should have expected properties', () => {
        assert.strictEqual(typeof DEFAULT_CONFIG.includeGlobalExtensions, 'boolean');
        assert.strictEqual(DEFAULT_CONFIG.includeGlobalExtensions, true);
        assert.strictEqual(typeof DEFAULT_CONFIG.applyGlobalBlacklist, 'boolean');
        assert.strictEqual(DEFAULT_CONFIG.applyGlobalBlacklist, true);
        assert.ok(Array.isArray(DEFAULT_CONFIG.enabledProjectTypes));
        assert.deepStrictEqual(DEFAULT_CONFIG.enabledProjectTypes, ['powershell', 'python', 'node']);
        assert.ok(Array.isArray(DEFAULT_CONFIG.customExtensions));
        assert.strictEqual(DEFAULT_CONFIG.customExtensions.length, 0);
        assert.ok(Array.isArray(DEFAULT_CONFIG.customBlacklist));
        assert.strictEqual(DEFAULT_CONFIG.customBlacklist.length, 0);
    });
});