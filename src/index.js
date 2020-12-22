const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const tmi = require('tmi.js');
const readline = require('readline');
const chalk = require('chalk');
const { readdirSync } = require('fs');
const camelCase = require('camelcase');
const DotObj = require('./modules/DotObj.js');
const { parse, buildConfig, _watchConfig } = require('./utils.js');

const config = new DotObj(buildConfig(require(path.join(__dirname, 'config.json')), path.join(__dirname, 'config.json'))).watch();
config.on('error', (r, e) => {
  if (r.message === 'reload') return console.error(chalk.dim.red('Failed to reload config.json!'), e.message);
  console.error(r);
});
_watchConfig(config);

const StreamCompanion = require('streamcompanion');
const SC = new StreamCompanion(config.sc);
SC.on('error', ({ ws, error }) => console.error(`"${camelCase(ws.type)}" websocket error: ${error.message}`));

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
  terminal: false,
  prompt: chalk.dim.bold.white('» ')
});

rl.prompt();

let exit = false;
process.on('SIGINT', (code) => {
  if (!exit) {
    exit = true;
    console.log(chalk.dim.bold.yellow('Please press "CTRL + C" or type "exit" again to exit.'));
    if (code !== 'exit') return rl.prompt();
    return;
  }
  process.exit(1);
});
rl.on('SIGINT', () => process.emit('SIGINT'));

rl.on('line', (line) => {
  const { args, name } = parse(line);
  if (exit && name !== 'exit') exit = false;

  const command = commands.get(name) || commands.get(aliases.get(name));
  if (!command || (command && command.type.toLowerCase() === 'chat')) {
    console.log(chalk.dim.red('Unknown Command.'));
    return rl.prompt();
  }

  command.exec(Object.assign(module.exports.CONSTRUCTOR, { type: 'cli' }), args, config);
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
  channels: config.channels
});
client.commands = commands;
client.aliases = aliases;

client.connect().catch(console.error);
client.on('message', (channel, tags, message, self) => {
  if (self) return;
  if (!message.startsWith(config.prefix)) return;

  const { args, name } = parse(message.slice(config.prefix.length));
  const command = commands.get(name) || commands.get(aliases.get(name));
  if (!command || (command && command.type.toLowerCase() === 'cli')) return;

  command.exec(Object.assign(module.exports.CONSTRUCTOR, { type: 'chat' }), args, config, channel, tags, message, self);
});

module.exports.CONSTRUCTOR = {
  client,
  sc: SC,
  send (type, response, channel) {
    if (typeof type === 'object') type = type.type;
    if (!type) throw new TypeError('Invalid type');

    if (type === 'cli') console.log(response);
    else client.say(channel, response);
  }
};
