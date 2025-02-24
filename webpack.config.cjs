const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

/** @type {import("webpack").Configuration}  */
const browserConfig = {
    target: "web",
    entry: {
        content: "./src/browser/content.ts",
        worker: "./src/browser/worker.ts"
    },
    resolve: {
        extensions: [".ts", ".js"],
        extensionAlias: {
            '.js': ['.ts', '.js'],
            '.jsx': ['.tsx', '.jsx']
        },
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [
                    {
                        loader: "babel-loader",
                        /** @type {import("@babel/core").TransformOptions} */
                        options: {
                            presets: [
                                "@babel/preset-env",
                            ]
                        }
                    },
                    {
                        loader: "ts-loader",
                        /** @type {import("ts-loader").Options} */
                        options: {
                            logInfoToStdOut: true,
                            logLevel: "INFO",
                        }

                    }
                ],
                exclude: /node_modules/,
            },
        ],
    },
    devtool: false,
    plugins: [
        process.env.ANALYZE_FLAG ? new BundleAnalyzerPlugin({ analyzerPort: 9000 }) : undefined
    ].filter(Boolean),
};

exports.default = [browserConfig]


