const util = require('util');

module.exports = (data, deep = 4) => {
    process.stdout.write(util.inspect(data, false, deep, true) + '\n');
};
