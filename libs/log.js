const colors = require('colors');

module.exports = (message, color = 'white') => {
    process.stdout.write(colors[color](message) + '\n');
};
