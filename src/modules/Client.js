const { EventEmitter } = require('events');
const { readdirSync } = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const Processer = require('./Processer.js');
const camelCase = require('camelcase');
const StreamCompanion = require('streamcompanion');
const { BanchoClient } = require('bancho.js');
const utils = require('../utils.js');
const { _handleExit, parse } = utils;

module.exports = class Client extends EventEmitter {
  /**
   * Client
   * @param {import('./DotObj.js')} config
   */
  constructor (config) {
    super();

    this.config = config;

    const SC = this.sc = new StreamCompanion(config.sc);
    SC.on('error', ({ ws, error }) => console.error(`"${camelCase(ws.type)}" websocket error: ${error.message}`));

    const Bancho = this.bancho = new BanchoClient({
      username: process.env.OSU_USERNAME,
      password: process.env.OSU_PASSWORD,
      apiKey: process.env.OSU_API_KEY
    });
    Bancho.connect().then(() => {
      if (process.env.NODE_ENV === 'development') console.log('[Bancho] Connected');
    }).catch((e) => {
      console.error(e);
    });

    //    /$$$$$$                                                                  /$$
    //   /$$__  $$                                                                | $$
    //  | $$  \__/  /$$$$$$  /$$$$$$/$$$$  /$$$$$$/$$$$   /$$$$$$  /$$$$$$$   /$$$$$$$
    //  | $$       /$$__  $$| $$_  $$_  $$| $$_  $$_  $$ |____  $$| $$__  $$ /$$__  $$
    //  | $$      | $$  \ $$| $$ \ $$ \ $$| $$ \ $$ \ $$  /$$$$$$$| $$  \ $$| $$  | $$
    //  | $$    $$| $$  | $$| $$ | $$ | $$| $$ | $$ | $$ /$$__  $$| $$  | $$| $$  | $$
    //  |  $$$$$$/|  $$$$$$/| $$ | $$ | $$| $$ | $$ | $$|  $$$$$$$| $$  | $$|  $$$$$$$
    //   \______/  \______/ |__/ |__/ |__/|__/ |__/ |__/ \_______/|__/  |__/ \_______/

    /**
     * @type {Map<string, import('../typedef').Command>}
     */
    this.commands = new Map();
    this.commands.aliases = new Map();
    const commandsDir = readdirSync(path.join(__dirname, '..', 'commands'));
    commandsDir.filter(f => f.split('.').pop() === 'js').map(f => {
      return { path: path.join(__dirname, '..', 'commands', f), filename: f };
    }).forEach(c => {
      const command = require(c.path);
      if (!command.name) return console.warn(chalk.dim.yellow(`Invalid command: ${chalk.dim.bold.yellow.underline(c.filename)}`));
      this.commands.set(command.name, command);

      if (command.aliases || (command.aliases && command.aliases.length)) {
        command.aliases.forEach(a => this.commands.aliases.set(a, command.name));
      }
    });

    //  /$$       /$$             /$$
    // | $$      |__/            | $$
    // | $$       /$$  /$$$$$$$ /$$$$$$    /$$$$$$  /$$$$$$$   /$$$$$$   /$$$$$$
    // | $$      | $$ /$$_____/|_  $$_/   /$$__  $$| $$__  $$ /$$__  $$ /$$__  $$
    // | $$      | $$|  $$$$$$   | $$    | $$$$$$$$| $$  \ $$| $$$$$$$$| $$  \__/
    // | $$      | $$ \____  $$  | $$ /$$| $$_____/| $$  | $$| $$_____/| $$
    // | $$$$$$$$| $$ /$$$$$$$/  |  $$$$/|  $$$$$$$| $$  | $$|  $$$$$$$| $$
    // |________/|__/|_______/    \___/   \_______/|__/  |__/ \_______/|__/

    const listenerDir = readdirSync(path.join(__dirname, '..', 'listeners'));
    listenerDir.filter(f => f.split('.').pop() === 'js').map(f => {
      return { path: path.join(__dirname, '..', 'listeners', f), filename: f };
    }).forEach(c => {
      const listener = require(c.path);
      if (!listener || typeof listener !== 'function') return console.warn(chalk.dim.yellow(`Invalid listener: ${chalk.dim.bold.yellow.underline(c.filename)}`));
      return listener(this);
    });

    //  /$$$$$$                                 /$$
    // |_  $$_/                                | $$
    //   | $$   /$$$$$$$   /$$$$$$  /$$   /$$ /$$$$$$
    //   | $$  | $$__  $$ /$$__  $$| $$  | $$|_  $$_/
    //   | $$  | $$  \ $$| $$  \ $$| $$  | $$  | $$
    //   | $$  | $$  | $$| $$  | $$| $$  | $$  | $$ /$$
    //  /$$$$$$| $$  | $$| $$$$$$$/|  $$$$$$/  |  $$$$/
    // |______/|__/  |__/| $$____/  \______/    \___/
    //                   | $$
    //                   | $$
    //                   |__/

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      removeHistoryDuplicates: true,
      terminal: false,
      prompt: chalk.dim.bold.white('» ')
    });
    this.rl.prompt();
    _handleExit(this.rl);

    const client = this.tmi = require('./TwitchClient.js')(config);
    this.rl.on('line', (line) => {
      /**
       * @event Client#message
       *
       * @type {object}
       * @property {'cli'|'chat'|'bancho'} type
       * @property {string} message
       */
      this.emit('message', { type: 'cli', message: line });

      const { args, name } = parse(line);
      const command = this.commands.get(name) || this.commands.get(this.commands.aliases.get(name));
      if (!command || (command && command.type.toLowerCase() === 'chat')) {
        console.log(chalk.dim.red('Unknown Command.'));
        return this.rl.prompt();
      }

      const processer = new Processer({
        client,
        sc: SC,
        bancho: Bancho,
        type: 'cli',
        config,
        commands: this.commands,
        utils: { content: line }
      });
      command.exec(processer, args, config);

      /**
       * @event Client#command
       * @param {Processer} processer
       * @param {Array} args
       * @param {import('./DotObj')} config
       */
      this.emit('command', processer, args, config);
      return this.rl.prompt();
    });

    client.on('message', (channel, tags, message, self) => {
      this.emit('message', { type: 'chat', channel, tags, message, self });

      if (self) return;
      if (!message.startsWith(config.prefix)) return;

      const { args, name } = parse(message.slice(config.prefix.length));
      const command = this.commands.get(name) || this.commands.get(this.commands.aliases.get(name));
      if (!command || (command && command.type.toLowerCase() === 'cli')) return;

      const processer = new Processer({
        client,
        sc: SC,
        bancho: Bancho,
        type: 'chat',
        config,
        commands: this.commands,
        utils,
        message: { channel, tags, content: message, self }
      });
      this.emit('command', processer, args, config);
      command.exec(processer, args, config);
    });

    Bancho.on('PM', ({ user, recipient, message, self }) => {
      this.emit('message', { type: 'bancho', user, recipient, message, self });

      if (self) return;
      if (!message.startsWith(config.prefix)) return;

      const { args, name } = parse(message.slice(config.prefix.length));
      const command = this.commands.get(name) || this.commands.get(this.commands.aliases.get(name));
      if (!command || (command && (command.type.toLowerCase() === 'cli' || command.type.toLowerCase() === 'chat'))) return;

      const processer = new Processer({
        client,
        sc: SC,
        bancho: Bancho,
        type: 'bancho',
        config,
        commands: this.commands,
        utils,
        message: { user, recipient, content: message, self }
      });
      this.emit('command', processer, args, config);
      command.exec(processer, args, config);
    });
  }
};
