const nconf = require('nconf');
const path = require('path');

nconf.argv()
    .env('_')
    .file({ file: path.join(__dirname, 'options.json') });

module.exports = nconf;
