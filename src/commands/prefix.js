const chalk = require('chalk');

module.exports = {
  name: 'prefix',
  usage: 'prefix [newprefix]',
  description: 'Show or set new prefix',
  aliases: [],
  type: 'cli',
  exec (processer, args, config) {
    const newPrefix = (args[0] || '').trim();
    if (newPrefix || !!newPrefix.length) {
      config.set('prefix', newPrefix);
      return processer.send(`${chalk.dim.gray('Changed prefix:')} ${chalk.dim.bold.yellow(newPrefix)}`);
    }
    return processer.send(`${chalk.dim.gray('Current prefix:')} ${chalk.dim.bold.yellow(config.get('prefix'))}`);
  }
};
