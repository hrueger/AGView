/**
 * Custom angular webpack configuration
 */
const { rootPath } = require('electron-root-path');
const path = require("path");
const webpack = require("webpack");

module.exports = (config, options) => {
    config.target = "electron-renderer";
    if (options.customWebpackConfig.target) {
        config.target = options.customWebpackConfig.target;
    } else if (options.fileReplacements) {
        for (let fileReplacement of options.fileReplacements) {
            if (fileReplacement.replace !== "src/environments/environment.ts") {
                continue;
            }

            let fileReplacementParts = fileReplacement["with"].split(".");
            if (["dev", "prod", "test", "electron-renderer"].indexOf(fileReplacementParts[1]) < 0) {
                config.target = fileReplacementParts[1];
            }
            break;
        }
    }
    config.module.rules.push({
        test: /\.node$/,
        use: "node-loader"
    });
    const pkg = require(path.join(rootPath, 'package.json'));
    config.plugins.push(new webpack.DefinePlugin({
        PKG_INFO: {
            productName: JSON.stringify(pkg.productName),
            description: JSON.stringify(pkg.description),
            name: JSON.stringify(pkg.name),
            author: JSON.stringify(pkg.author),
            version: JSON.stringify(pkg.version),
            repository: JSON.stringify(pkg.repository),
            homepage: JSON.stringify(pkg.homepage),
            bugs: JSON.stringify(pkg.bugs),
        }
    }));
    config.externals = {
        express: "require('express')",
    }
    return config;
}