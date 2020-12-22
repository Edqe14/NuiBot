/**
 * @type {import('../typedef').Command}
 */
module.exports = {
  name: 'nowPlaying',
  usage: 'nowplaying',
  description: 'Show osu! currently playing',
  aliases: ['np'],
  type: 'all',
  exec (processer) {
    const np = processer.sc.getData('np') || 'none';
    return processer.send(np);
  }
};
