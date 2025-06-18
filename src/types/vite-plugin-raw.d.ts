declare module 'vite-plugin-raw' {
  interface PluginOptions {
    match?: RegExp | RegExp[];
    exclude?: RegExp | RegExp[];
  }

  function rawPlugin(options?: PluginOptions): import('vite').Plugin;
  export = rawPlugin;
}
