const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);

  // Add platform-specific handling
  webpack.chainWebpack((config) => {
    config.resolve.extensions
      .add('.ts')
      .add('.js');

    // Optimize build
    config.optimization
      .minimize(true);

    // Improve performance
    config.performance.hints(false);
  });

  return webpack.resolveConfig();
};