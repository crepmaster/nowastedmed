import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.pharmexchange',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    codeCache: true
  },
  ios: {
    discardUncaughtJsExceptions: true,
    v8Flags: '--expose_gc'
  },
  useLegacyWorkflow: false,
  webpackConfigPath: 'webpack.config.js'
} as NativeScriptConfig;