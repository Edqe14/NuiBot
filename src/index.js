const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});
const config = Object.assign({
  enable: true,
  username: 'osu!np',
  scDir: './sc/np.txt',
  prefix: '!'
}, require('./config.json'));

const tmi = require('tmi.js');
const readline = require('readline');
const chalk = require('chalk');
const { readdirSync } = require('fs');

console.log(chalk.dim.bold.magenta('osu!np Twitch Bot v1'));
console.log(chalk.dim.yellow('Type "help" to show help'));

const commands = new Map();
const aliases = new Map();
const commandsDir = readdirSync(path.join(__dirname, 'commands'));
commandsDir.filter(f => f.split('.').pop() === 'js').map(f => {
  return { path: path.join(__dirname, 'commands', f), filename: f };
}).forEach(c => {
  const command = require(c.path);
  if (!command.name) return console.warn(chalk.dim.yellow(`Invalid command: ${chalk.dim.bold.yellow.underline(c.filename)}`));
  commands.set(command.name, command);

  if (command.aliases || (command.aliases && command.aliases.length)) {
    command.aliases.forEach(a => aliases.set(a, command.name));
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  removeHistoryDuplicates: true,
  terminal: true,
  prompt: chalk.dim.bold.white('» ')
});

rl.prompt();
rl.on('line', (line) => {
  const { args, name } = parse(line);

  const command = commands.get(name) || commands.get(aliases.get(name));
  if (!command || (command && command.type.toLowerCase() === 'chat')) {
    console.log(chalk.dim.red('Unknown Command.'));
    return rl.prompt();
  }

  command.exec(module.exports.utils, 'cli', args, config);
  return rl.prompt();
});

const client = new tmi.Client({
  options: { debug: false, messagesLogLevel: 'info' },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: config.username,
    password: process.env.TWITCH_TOKEN
  },
  channels: [config.username]
});
client.connect().catch(console.error);
client.on('message', (channel, tags, message, self) => {
  if (self) return;
  if (!message.startsWith(config.prefix)) return;

  const { args, name } = parse(message.slice(config.prefix.length));
  const command = commands.get(name) || commands.get(aliases.get(name));
  if (!command || (command && command.type.toLowerCase() === 'cli')) return;

  command.exec(module.exports.utils, 'chat', args, config, channel, tags, message, self);
});

function parse (txt) {
  const args = txt.split(' ');
  const name = (args.shift() || '').toLowerCase();

  return { args, name };
}

module.exports.utils = {
  client,
  commands,
  aliases,
  send (type, response, channel) {
    if (type === 'cli') console.log(response);
    else client.say(channel, response);
  }
};
