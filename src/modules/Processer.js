const { Client } = require('tmi.js');
const StreamCompanion = require('streamcompanion');
const { BanchoClient } = require('bancho.js');
const DotObj = require('./DotObj.js');

/**
 * @typedef {object} Struct
 * @property {Client} client tmi.js Client instance
 * @property {StreamCompanion} sc node-sc instance
 * @property {'chat'|'cli'|'bancho'|'all'} type Runner type
 * @property {DotObj} config Config
 * @property {Map} commands Commands map
 * @property {Object} utils Utils object
 * @property {string=} channel Channel name (type === chat)
 * @property {object=} tags Message tags
 * @property {object} message
 */

/**
 * Create Processer class instance
 * @class
 */
module.exports = class Processer {
  /**
   * @param {Struct} args0
   */
  constructor ({
    client,
    sc,
    bancho,
    type,
    config,
    commands,
    utils,
    channel,
    tags,
    message
  }) {
    if (!(client instanceof Client)) throw new TypeError('Client is not instance of tmi.Client');
    if (!(sc instanceof StreamCompanion)) throw new TypeError('SC is not instance of StreamCompanion');
    if (!(bancho instanceof BanchoClient)) throw new TypeError('Bancho is not instance of BanchoClient');
    if (!type || !['chat', 'cli', 'all'].includes(type)) throw new Error(`Invalid type "${type}" in type`);
    if (!(config instanceof DotObj)) throw new TypeError('config is  not instance of DotObj');
    if (!(commands instanceof Map)) throw new TypeError('commands is not instance of Map');
    if (this.type === 'chat' && !channel) throw new TypeError('Invalid chat channel name');
    if (this.type === 'chat' && !tags) throw new TypeError('Invalid message tag');

    this.client = client;
    this.sc = sc;
    this.bancho = bancho;
    this.config = config;
    this.commands = commands;
    this.utils = utils;
    this.type = type;
    this.channel = channel;
    this.tags = tags;
    this.message = message;
  }

  /**
   * Send response
   * @param {*} response
   */
  send (response) {
    if (this.type === 'cli') return console.log(response);
    if (this.type === 'bancho') return this.message.user.sendMessage(response);
    return this.client.say(this.channel, response);
  }
};
