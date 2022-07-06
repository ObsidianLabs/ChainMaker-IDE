const { IpcChannel } = require('@obsidians/ipc');
const FileOpsChannel = require('@obsidians/file-ops');
const KeypairManager = require('@obsidians/keypair');
const { AutoUpdate } = require('@obsidians/global');
const CompilerManager = require('@obsidians/eth-compiler');
const { InstanceManager } = require('@obsidians/chainmaker-network');
const ProjectChannel = require('@obsidians/chainmaker-project');
const { SdkChannel } = require('@obsidians/chainmaker-sdk');
const AuthChannel = require('@obsidians/auth');

let ipcChannel,
  fileOpsChannel,
  keypairManager,
  autoUpdate,
  compilerManager,
  instanceManager,
  projectChannel,
  sdkChannel,
  authChannel;
module.exports = function () {
  ipcChannel = new IpcChannel();
  fileOpsChannel = new FileOpsChannel();
  keypairManager = new KeypairManager(process.env.PROJECT);
  autoUpdate = new AutoUpdate(
    'https://app.obsidians.io/api/v1/check-update/chainmaker/'
  );
  compilerManager = new CompilerManager();
  instanceManager = new InstanceManager();
  projectChannel = new ProjectChannel();
  sdkChannel = new SdkChannel(keypairManager);
  authChannel = new AuthChannel();
};
