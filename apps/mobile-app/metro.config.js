// ============================================================
// Metro Config
//
// NativeWind requires its CSS transformer.
// Also configures monorepo package resolution and React deduplication.
// ============================================================
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve react & react-native strictly from mobile-app
config.resolver.extraNodeModules = {
  react: path.dirname(require.resolve('react/package.json', { paths: [projectRoot] })),
  'react-native': path.dirname(require.resolve('react-native/package.json', { paths: [projectRoot] })),
};

// 4. Block Metro from scanning backend service node_modules
config.resolver.blockList = [
  /apps\/auth-service\/.*/,
  /apps\/game-service\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
