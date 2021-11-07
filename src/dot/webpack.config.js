const webpack = require("webpack");
const { resolve } = require("path");
const {
    CleanWebpackPlugin
} = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { glob } = require("glob");
const FluentPlugin = require("./fluent.webpack.plugin");

const scss = glob.sync(
    resolve(__dirname, "{,!(node_modules)/**}", "*.scss")
);

const browser_styles = scss.filter(
    (s) =>
        !s
            .split("/")
            [s.split("/").length - 1].includes(
                ".webui.scss"
            )
);

const webui_styles = scss.filter(
    (s) => !browser_styles.includes(s)
);

const recursiveIssuer = (m, c) => {
    const issuer = c.moduleGraph.getIssuer(m);
    // For webpack@4 issuer = m.issuer

    if (issuer) {
        return recursiveIssuer(issuer, c);
    }

    const chunks = c.chunkGraph.getModuleChunks(m);
    // For webpack@4 chunks = m._chunks

    for (const chunk of chunks) {
        return chunk.name;
    }

    return false;
};

const webuiEntry = {
    newtab: "./core/newtab/start-page.tsx",
    settings: "./core/settings/settings.tsx",
    config: "./core/webui/config/config.tsx"
};

let entry = {};
let cacheGroups = {};

Object.entries(webuiEntry).forEach(([key, value]) => {
    entry[key] = [
        value,
        ...glob
            .sync(
                resolve(
                    __dirname,
                    value.substring(
                        0,
                        value.lastIndexOf("/")
                    ),
                    "{,!(node_modules)/**}",
                    `*.scss`
                )
            )
            .map((x) => x.replace(__dirname, "."))
    ];

    cacheGroups[`${key}Styles`] = {
        name: `${key}.chunk`,
        test: (m, c, entry = key) =>
            m.constructor.name === "CssModule" &&
            recursiveIssuer(m, c) === entry,
        chunks: "all",
        enforce: true
    };
});

entry = {
    ...entry,
    browser: ["./index.tsx", ...browser_styles],
    webui: [...webui_styles]
};

cacheGroups = {
    ...cacheGroups,
    browserStyles: {
        name: "browser.chunk",
        test: (m, c, entry = "browser") =>
            m.constructor.name === "CssModule" &&
            recursiveIssuer(m, c) === entry,
        chunks: "all",
        enforce: true
    },
    webuiStyles: {
        name: "webui.chunk",
        test: (m, c, entry = "webui") =>
            m.constructor.name === "CssModule" &&
            recursiveIssuer(m, c) === entry,
        chunks: "all",
        enforce: true
    }
};

module.exports = {
    target: "web",
    entry,
    // Production is messing with me
    // TODO: This should be changed based on an option in melon build
    // mode: "production",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(ts)x?$/,
                exclude: /node_modules/,
                use: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            webpackImporter: false,
                            sassOptions: {
                                outputStyle: "compressed"
                            }
                        }
                    },
                    {
                        loader: resolve(
                            __dirname,
                            "inject-sass-globals.js"
                        )
                    }
                ]
            },
            {
                test: /\.js/,
                include:
                    /@fluent[\\/](bundle|langneg|syntax|react|sequence)[\\/]/,
                type: "javascript/auto"
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        fallback: {
            path: false,
            fs: false
        }
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css"
        }),
        new CleanWebpackPlugin(),
        new FluentPlugin(),
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"]
        })
    ],
    output: {
        filename: "[name].js",
        path: resolve(__dirname, "dist")
    },
    optimization: {
        splitChunks: {
            cacheGroups
        }
    }
};
