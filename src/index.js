const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const chalk = require('chalk');
const utils = require('./utils.js');
const { buildConfig, _watchConfig } = utils;

const DotObj = require('./modules/DotObj.js');
const config = module.exports.config = new DotObj(buildConfig(require(path.join(__dirname, 'config.json')), path.join(__dirname, 'config.json'))).watch();
_watchConfig(config);

module.exports = new (require('./modules/Client.js'))(config);

console.log(chalk.dim.bold.magenta('osu!np Twitch Bot v1'));
console.log(chalk.dim.yellow('Type "help" to show help'));
