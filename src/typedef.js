/* eslint-disable */
const Processer = require('./modules/Processer.js');
const DotObj = require('./modules/DotObj.js');
const { Chalk } = require('chalk');

/**
 * @typedef {Object} Command
 * @property {string} name Command name
 * @property {string} usage Command usage
 * @property {string} description Command description
 * @property {string[]} [aliases=[]] Command aliases
 * @property {'chat'|'cli'|'all'} type Command type
 * @property {(processer: Processer, args: any[], message: ?string) => any} exec Execute command
 *
 * @typedef {Object} ColorizeDef
 * @property {Chalk} def Default color
 * @property {Chalk} cmd Command color
 * @property {Chalk} opt Optional color
 * @property {Chalk} req Required color
 * 
 * @typedef {Object} SCConfig
 * @property {'http'|'https'} proto HTTP protocol
 * @property {string} [host='localhost'] HTTP host address
 * @property {number} [port=20727] HTTP host port
 * @property {string[]} [watchTokens=[]] Token to watch/receive
 * @property {{
 *    tokens: boolean,
 *    mapData: boolean,
 *    liveData: boolean
 * }} listeners Listeners to use
 * 
 * @typedef {Object} Config
 * @property {string} username Twitch username
 * @property {string[]} [channels=[]] Channels to join
 * @property {string} prefix Prefix
 * @property {{
 *    proto: 'http'|'https',
 *    host: string | 'localhost',
 *    port: number | 20727,
 *    watchTokens: string[] | [],
 *    listeners: {
 *       tokens: boolean,,
 *       mapData: boolean,
 *       liveData: boolean
 *    }
 * }} sc
 * 
 * @typedef {Object} Utils
 * @property {(ms: number = 500) => Promise<any>} sleep Sleep function
 * @property {(obj: any, _dir: string) => Config} buildConfig Build config scheme
 * @property {(txt: string) => { args: any[], name: ?string }} parse Parse text to command usable format
 * @property {(text: string, def: ColorizeDef=)} colorize Colorize usage string
 * 
 * @private
 * @typedef {DotObj} DotConfig Watch config changes
 */
