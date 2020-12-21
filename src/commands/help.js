const chalk = require('chalk');

module.exports = {
  name: 'help',
  usage: ['help'],
  description: 'Help Menu',
  aliases: [],
  type: 'cli',
  exec ({ send, client, type }, args) {
    const cmd = args[0];
    if (!cmd) {
      let count = 1;
      return client.commands.forEach((c) => {
        send(type, `${chalk.dim.gray(count + '.')} ${chalk.dim.bold.white(c.name)} - ${chalk.dim.yellow(c.description)}`);
        count++;
      });
    } else {
      const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
      if (!command) return send(type, chalk.dim.red('Unknown Command.'));

      send(type, `${chalk.dim.blue('Name:')} ${chalk.dim.bold.white(command.name)}`);
      send(type, `${chalk.dim.blue('Aliases:')} ${command.aliases.length ? command.aliases.map(a => chalk.dim.bold.white(a)).join(chalk.dim.yellow(', ')) : 'none'}`);
      send(type, `${chalk.dim.blue('Description:')} ${chalk.dim.bold.yellow(command.description)}`);
    }
  }
};
