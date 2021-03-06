const { createHash } = require('crypto');
const watch = require('node-watch');
const { writeFileSync } = require('fs');
const path = require('path');
const chalk = require('chalk');
const lexure = require('lexure');

/**
 * @type {import('./typedef').ColorizeDef}
 */
const COLOR_DEF = {
  def: chalk.dim.white,
  cmd: chalk.dim.bold.white,
  opt: chalk.dim.gray,
  req: chalk.dim.yellow
};

/**
 * @type {import('./typedef').Utils}
 */
module.exports = {
  /**
   * Sleep/delay for a specified time (in ms)
   * @param {Number} ms Time to wait
   */
  sleep (ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  /**
   * Build config scheme
   * @param {any} obj
   * @param {string} _dir Config directory path
   * @returns {import('./typedef').Config} Config
   */
  buildConfig (obj, _dir) {
    return Object.assign({
      _dir,
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
        },
        initializeAutomatically: true
      }
    }, obj);
  },
  /**
   * Parse text to command, args
   * @param {string} txt Text to parse
   */
  parse (txt) {
    const args = txt.split(' ');
    const name = (args.shift() || '').toLowerCase();

    return { args, name };
  },
  /**
   * Colorize usage text
   * @param {string} text Original text
   * @param {import('./typedef').ColorizeDef} def Color defaults
   */
  colorize (text, def = COLOR_DEF) {
    const lexer = new lexure.Lexer(text)
      .setQuotes([
        ['[', ']'],
        ['<', '>']
      ]);

    const res = lexer.lex();
    const inputs = res.map((v, i) => { // eslint-disable-line array-callback-return
      const raw = v.raw;
      if (i === 0) return def.cmd(raw);
      else if (raw.startsWith('[') && raw.endsWith(']')) return def.opt(raw);
      else if (raw.startsWith('<') && raw.endsWith('>')) return def.req(raw);
      else return def.def(raw);
    });
    return inputs.join(' ');
  },
  /**
   * Handle exit
   * @private
   * @param {import('readline').Interface} rl
   */
  _handleExit (rl) {
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
      const { name } = module.exports.parse(line);
      if (exit && name !== 'exit') exit = false;
    });
  },
  /**
   * Watch config file
   * @private
   * @param {import('./typedef').DotConfig} config Config
   */
  _watchConfig (config) {
    config.on('error', (r, e) => {
      if (r.message === 'reload') return console.error(chalk.dim.red('Failed to reload config.json!'), e.message);
      console.error(r);
    });

    let lock = false;
    const waitUnlock = () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!lock) {
            clearInterval(interval);
            return resolve();
          }
        }, 500);
      });
    };

    config.on('change', async () => {
      if (lock) await waitUnlock();

      lock = true;
      const confCopy = Object.assign({}, config);
      const dir = confCopy._dir;
      Object.keys(confCopy).filter(k => typeof confCopy[k] === 'function' || k.startsWith('_')).forEach(f => {
        delete confCopy[f];
      });
      writeFileSync(dir, JSON.stringify(confCopy, null, 2));
      await module.exports.sleep(100);
      lock = false;
    });
    watch(config._dir, { recursive: true }, async () => {
      if (lock) await waitUnlock();

      lock = true;
      const oldConfHash = createHash('md5').update(JSON.stringify(config)).digest('hex');
      delete require.cache[require.resolve(config._dir)];

      try {
        const reqConf = require(config._dir, 'utf-8');
        const newConf = module.exports.buildConfig(reqConf, path.join(__dirname, 'config.json'));
        const newConfHash = createHash('md5').update(JSON.stringify(newConf)).digest('hex');
        if (oldConfHash === newConfHash) {
          await module.exports.sleep(100);
          lock = false;
          return;
        }
        config.emit('reload', newConf);
        Object.assign(config, newConf);
        await module.exports.sleep(100);
        lock = false;
      } catch (e) {
        config.emit('error', new Error('reload'), e);
      }
    });
  }
};
