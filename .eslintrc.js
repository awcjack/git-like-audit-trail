module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parser": "@babel/eslint-parser",
    "parserOptions": {
        "sourceType": "module",
        "allowImportExportEverywhere": false,
        "ecmaFeatures": {
            "globalReturn": false,
        },
        "babelOptions": {
            "configFile": "./.babelrc",
        },
    },
    "rules": {
    }
};
