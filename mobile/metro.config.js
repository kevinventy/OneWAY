// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Le SDK Firebase publie une partie de ses modules en CommonJS (.cjs). Sans
// cette extension, Metro résout un bundle incomplet et l'app échoue au
// démarrage avec « Component auth has not been registered yet ».
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}
// Firebase v11 n'est pas compatible avec la résolution par « package exports »
// de Metro (modules Node résolus à la place des builds navigateur/RN).
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
