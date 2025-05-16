// src/test/suite/handlers/extensionCommandHandler.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import { ExtensionCommandHandler } from '../../../handlers/extensionCommandHandler';
import { MessageService } from '../../../services/messageService';

suite('ExtensionCommandHandler Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let handler: ExtensionCommandHandler;
  let showInfoStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();
    handler = new ExtensionCommandHandler();
    showInfoStub = sandbox.stub(MessageService, 'showInfo');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should show hello world message', async () => {
    await handler.helloWorld();
    assert.strictEqual(showInfoStub.calledWith('Hello from CopyCoder! Thanks for using our extension.'), true);
  });
});