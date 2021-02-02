const tmi = require('tmi.js');

/**
 * Create new Twitch client (tmi)
 * @param {import('./DotObj.js')} config
 * @returns
 */
module.exports = (config) => {
  const client = new tmi.Client({
    options: { debug: process.env.NODE_ENV === 'development', messagesLogLevel: 'info' },
    connection: {
      reconnect: true,
      secure: true
    },
    identity: {
      username: config.username,
      password: process.env.TWITCH_TOKEN
    },
    channels: config.channels.map(a => a[0])
  });
  client.connect().catch(console.error);

  return client;
};
