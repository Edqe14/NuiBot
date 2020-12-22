/**
 * @type {import('../typedef').Command}
 */
module.exports = {
  name: 'exit',
  usage: 'exit',
  description: 'Exit the program',
  aliases: [],
  type: 'cli',
  exec () {
    return process.emit('SIGINT', 'exit');
  }
};
