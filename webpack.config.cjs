const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


/** @type {import("webpack").Configuration}  */
const testConfig = {
    target: "node",
    entry: "./src/test/firstTurn.ts",
    output: { path: path.resolve(__dirname, "dist"), filename: "test.cjs" },
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

exports.default = [testConfig];
