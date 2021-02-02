const BEATMAP_REGEX = /https?:\/\/osu\.ppy\.sh\/b(eatmapsets)?\/[0-9]{6,7}(#osu\/[0-9]{6,7})?/;
const osu = require('node-osu');
const api = new osu.Api(process.env.OSU_API_KEY, {
  parseNumeric: true // Parse numeric values into numbers/floats, excluding ids
});

/**
 * @param {import('../modules/Client')} client
 */
module.exports = (client) => {
  client.on('message', async (message) => {
    if (message.type === 'chat') {
      if (message.self) return;
      const beatmapUrl = message.message.match(BEATMAP_REGEX);
      if (!beatmapUrl) return;
      const id = beatmapUrl[0].slice(-7).replace(/\//gm, '');
      if (!id || !id.length) return;

      const user = client.bancho.getUser(client.config.channels.find(a => a[0].toLowerCase().includes(message.channel.toLowerCase()))[1]);
      const map = (await api.getBeatmaps({
        b: id
      }))[0];

      const res = `${map.difficulty.rating.toFixed(2)}★ ${map.artist} - ${map.title} [${map.version}] by ${map.creator}`;
      client.tmi.say(message.channel, res);

      await user.sendMessage(`[${beatmapUrl[0]} ${map.title} [${map.version}]] Requested by ${message.tags['display-name'] ?? message.tags.username}`);
    }
  });
};
