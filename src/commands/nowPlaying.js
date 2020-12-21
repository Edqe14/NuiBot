module.exports = {
  name: 'nowPlaying',
  usage: ['nowplaying'],
  description: 'Show osu! currently playing',
  aliases: ['np'],
  type: 'all',
  exec ({ type, send, sc }, _, __, channel) {
    const np = sc.getData('np');
    return send(type, np, channel);
  }
};
