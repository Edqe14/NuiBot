const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const tmi = require('tmi.js');
const readline = require('readline');
const chalk = require('chalk');
const { readdirSync } = require('fs');
const { createHash } = require('crypto');
const watch = require('node-watch');
const camelCase = require('camelcase');

let config = buildConfig(require(path.join(__dirname, 'config.json')));
watch(path.join(__dirname, 'config.json'), { recursive: true }, () => {
  try {
    const oldConfHash = createHash('md5').update(JSON.stringify(config)).digest('hex');
    delete require.cache[require.resolve(path.join(__dirname, 'config.json'))];

    const newConf = buildConfig(require(path.join(__dirname, 'config.json'), 'utf-8'));
    const newConfHash = createHash('md5').update(JSON.stringify(newConf)).digest('hex');
    if (oldConfHash === newConfHash) return;
    config = newConf;
  } catch (e) {
    console.error(e);
  }
});

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
rl.on('line', (line) => {
  const { args, name } = parse(line);

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

function parse (txt) {
  const args = txt.split(' ');
  const name = (args.shift() || '').toLowerCase();

  return { args, name };
}

function buildConfig (obj) {
  return Object.assign({
    enable: true,
    username: 'osu!np',
    channels: [],
    prefix: '!',
    sc: {
      proto: 'http',
      host: 'localhost',
      port: 20727,
      watchTokens: [],
      listeners: {
        tokens: true,
        mapData: true,
        liveData: false
      }
    }
  }, obj);
}

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
