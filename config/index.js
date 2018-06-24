const nconf = require('nconf');
const path = require('path');
const log = require('../libs/log');

nconf.argv()
    .env('_')
    .file({ file: path.join(__dirname, 'options.json') });

nconf.set('STEAM:KEY', process.env.STEAM_KEY);
log(`:: STEAM:KEY > ${nconf.get('STEAM:KEY')}`, 'yellow');

module.exports = nconf;
