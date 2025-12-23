const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);

  // Disable TypeScript type checking to allow build with incomplete code
  webpack.chainWebpack((config) => {
    config.plugins.delete('ForkTsCheckerWebpackPlugin');
  });

  return webpack.resolveConfig();
};
