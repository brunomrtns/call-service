const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("svg");
config.maxWorkers = 4;
config.resetCache = true;

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
