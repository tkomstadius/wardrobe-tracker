const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for GitHub Pages subdirectory
if (process.env.NODE_ENV === 'production') {
  config.transformer.publicPath = '/wardrobe-tracker/';
}

module.exports = config;
