const path = require("node:path");

module.exports = (_env, argv) => ({
  target: "web",
  entry: {
    content: "./src/browser/content.ts",
    worker: "./src/browser/worker.ts",
    bridge: "./src/extension/bridge.ts",
    options: "./src/extension/options.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: { ".js": [".ts", ".js"] },
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ }],
  },
  devtool: argv.mode === "production" ? false : "source-map",
});
