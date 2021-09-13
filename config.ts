// tslint:disable-next-line:no-var-requires
require('toml-require').install();
// tslint:disable-next-line:no-var-requires
const configFile = require('./config.toml');
// tslint:disable-next-line:no-var-requires
const assert = require('assert').strict

const NODE_ENV = process.env.NODE_ENV!
assert.ok(NODE_ENV, 'The "NODE_ENV" environment variable is required')
export const config = configFile[NODE_ENV];

