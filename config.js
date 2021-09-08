require('toml-require').install();
const configFile = require('./config.toml');
const assert = require('assert').strict

const NODE_ENV = process.env.NODE_ENV
assert.ok(NODE_ENV, 'The "NODE_ENV" environment variable is required')
exports.config = configFile[NODE_ENV];

