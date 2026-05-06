const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ensure TypeScript source extensions are resolved for packages like reanimated
config.resolver.sourceExts = [
  ...new Set([...(config.resolver.sourceExts ?? []), 'ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs']),
];

module.exports = withNativeWind(config, { input: './global.css' });
