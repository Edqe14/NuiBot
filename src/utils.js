const { createHash } = require('crypto');
const watch = require('node-watch');
const { writeFileSync } = require('fs');
const path = require('path');

module.exports = {
  sleep (ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
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
        }
      }
    }, obj);
  },
  parse (txt) {
    const args = txt.split(' ');
    const name = (args.shift() || '').toLowerCase();

    return { args, name };
  },
  _watchConfig (config) {
    let lock = false;
    config.on('change', async () => {
      if (lock) return;

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
      if (lock) return;

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
