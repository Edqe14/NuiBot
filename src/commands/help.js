const chalk = require('chalk');

/**
 * @type {import('../typedef').Command}
 */
module.exports = {
  name: 'help',
  usage: 'help',
  description: 'Help Menu',
  aliases: [],
  type: 'cli',
  exec (processer, args) {
    const cmd = args[0];
    if (!cmd) {
      return Array.from(processer.commands.values()).filter(c => !c.hidden).forEach((c, i) => {
        processer.send(`${chalk.dim.gray(i + 1 + '.')} ${processer.utils.colorize(c.usage)} | ${chalk.dim.yellow(c.description)}`);
      });
    } else {
      const command = processer.commands.get(cmd) || processer.commands.get(processer.commands.aliases.get(cmd));
      if (!command) return processer.send(chalk.dim.red('Unknown Command.'));

      processer.send(`${chalk.dim.blue('Name:')} ${chalk.dim.bold.white(command.name)}`);
      processer.send(`${chalk.dim.blue('Aliases:')} ${command.aliases.length ? command.aliases.map(a => chalk.dim.bold.white(a)).join(chalk.dim.yellow(', ')) : 'none'}`);
      processer.send(`${chalk.dim.blue('Description:')} ${chalk.dim.bold.yellow(command.description)}`);
    }
  }
};
