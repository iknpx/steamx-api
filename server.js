const http = require('http');
const config = require('./config');
const Socket = require('socket.io');
const service = require('./services/apps.service');
const Worker = require('./services/worker');

const server = http.createServer();
const io = Socket(server);
const worker = new Worker(io);

server.listen(config.get('PORT'));

io.on('connection', service(worker));
