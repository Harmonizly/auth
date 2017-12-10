/**
 * { item_description }
 */

// Set Config root dir
process.env.NODE_CONFIG_DIR = 'config/server';

// Allow config mutations
process.env.ALLOW_CONFIG_MUTATIONS = true;

var Server = require('./assets/server').default;
var server = new Server();

server.start();
