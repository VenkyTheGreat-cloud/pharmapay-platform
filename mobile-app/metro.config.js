// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude android/ios build dirs from Metro's file watcher to speed up web exports
config.resolver.blockList = [
  /android\/app\/build\/.*/,
  /android\/build\/.*/,
  /android\/\.gradle\/.*/,
];

module.exports = config;


