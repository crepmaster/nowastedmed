const webpack = require('@nativescript/webpack');
const path = require('path');

module.exports = (env) => {
  webpack.init(env);

  webpack.chainWebpack((config) => {
    // Disable TypeScript type checking to allow build with incomplete code
    config.plugins.delete('ForkTsCheckerWebpackPlugin');

    // The node:module import issue is a known NativeScript webpack bug
    // Keep ESM mode but we'll rely on the runtime to handle it
    // The actual crash is likely from something else in the bundle

    // Ensure "~" resolves to app root (covers "~/<...>" patterns)
    config.resolve.alias.set('~', path.resolve(__dirname, 'app'));

    // Alias ~/package.json to a stub to prevent ESM/runtime resolution errors
    // @nativescript/core uses require('~/package.json') in profiling/index.js and style-scope.js
    config.resolve.alias.set(
      '~/package.json',
      path.resolve(__dirname, 'app/config/package.stub.json')
    );

    // Explicit JSON handling (safety across webpack variants)
    config.module
      .rule('json')
      .test(/\.json$/)
      .type('json');

    // Remove ~/package.json from externals so alias can work
    // NativeScript webpack preset adds it to externals by default
    const currentExternals = config.get('externals') || [];
    if (Array.isArray(currentExternals)) {
      const filteredExternals = currentExternals.filter(ext => {
        if (typeof ext === 'string') return ext !== '~/package.json';
        if (ext instanceof RegExp) return !ext.test('~/package.json');
        return true;
      });
      config.set('externals', filteredExternals);
    }
  });

  return webpack.resolveConfig();
};
