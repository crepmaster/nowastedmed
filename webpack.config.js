const webpack = require("@nativescript/webpack");

module.exports = (env) => {
  webpack.init(env);
  webpack.useConfig('typescript');

  webpack.chainWebpack((config) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false
    };
  });

  return webpack.resolveConfig();
};