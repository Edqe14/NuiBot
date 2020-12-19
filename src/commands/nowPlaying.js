const { readFileSync } = require('fs');

module.exports = {
  name: 'nowPlaying',
  usage: ['nowplaying'],
  description: 'Show osu! currently playing',
  aliases: ['np'],
  type: 'all',
  exec ({ send }, type, _, config, channel) {
    const np = readFileSync(config.scDir, 'utf-8');
    if (!np) return send(type, 'Failed to fetch data.', channel);

    return send(type, np, channel);
  }
};
