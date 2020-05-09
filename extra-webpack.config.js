module.exports = {
    target: 'electron-renderer',
    // don't remove this comments it is used for parsing by postinstall.config.js
    // start of extra configs
    externals: {
        typeorm: "require('typeorm')",
        sqlite3: "require('sqlite3')",
    },
    resolve: {
        alias: {
            typeorm: "../../../../../../node_modules/typeorm/typeorm-model-shim"
        }
    }
    // end of extra configs
};