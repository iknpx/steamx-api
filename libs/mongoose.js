const mongoose = require('mongoose');

const inspect = require('./inspect');
const log = require('./log');
const config = require('../config');

const CONNECTION_STRING = `${config.get('MONGODB:HOST')}/${config.get('MONGODB:DB')}`;

mongoose.Promise = require('bluebird');
mongoose
    .connect(CONNECTION_STRING, config.get('MONGODB:OPTIONS'))
    .then(() => log(`:: MONGOOSE CONNECTED > ${CONNECTION_STRING}`, 'blue'))
    .catch(error => inspect(error));

module.exports = mongoose;
