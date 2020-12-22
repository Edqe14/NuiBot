const { Client } = require('tmi.js');
const StreamCompanion = require('streamcompanion');
const DotObj = require('./DotObj.js');

/**
 * Create Processer class instance
 * @class
 */
module.exports = class Processer {
  /**
   * @param {Client} client tmi.js Client instance
   * @param {StreamCompanion} sc node-sc instance
   * @param {'chat'|'cli'|'all'} type Runner type
   * @param {DotObj} config Config
   * @param {Map} commands Commands map
   * @param {Object} utils Utils object
   * @param {string=} channel Channel name (type === chat)
   * @param {Object=} tags Message tags
   */
  constructor (client, sc, type, config, commands, utils, channel, tags) {
    if (!(client instanceof Client)) throw new TypeError('Client is not instance of tmi.Client');
    if (!(sc instanceof StreamCompanion)) throw new TypeError('sc is not instance of StreamCompanion');
    if (!type || !['chat', 'cli', 'all'].includes(type)) throw new Error(`Invalid type "${type}" in type`);
    if (!(config instanceof DotObj)) throw new TypeError('config is  not instance of DotObj');
    if (!(commands instanceof Map)) throw new TypeError('commands is not instance of Map');
    if (this.type === 'chat' && !channel) throw new TypeError('Invalid chat channel name');
    if (this.type === 'chat' && !tags) throw new TypeError('Invalid message tag');

    this.client = client;
    this.config = config;
    this.commands = commands;
    this.utils = utils;
    this.sc = sc;
    this.type = type;
    this.channel = channel;
    this.tags = tags;
  }

  /**
   * Send response
   * @param {*} response
   */
  send (response) {
    if (this.type === 'cli') return console.log(response);
    return this.client.say(this.channel, response);
  }
};
