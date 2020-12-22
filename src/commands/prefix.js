const chalk = require('chalk');

module.exports = {
  name: 'prefix',
  usage: ['prefix [newprefix]'],
  description: 'Show or set new prefix',
  aliases: [],
  type: 'cli',
  exec ({ type, send, sc }, args, config) {
    const newPrefix = (args[0] || '').trim();
    if (newPrefix || !!newPrefix.length) {
      config.set('prefix', newPrefix);
      return send(type, `${chalk.dim.gray('Changed prefix:')} ${chalk.dim.bold.yellow(newPrefix)}`);
    }
    return send(type, `${chalk.dim.gray('Current prefix:')} ${chalk.dim.bold.yellow(config.get('prefix'))}`);
  }
};
