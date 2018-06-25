const Promise = require('bluebird');
const config = require('../config');
const request = require('../libs/request');
const model = require('../models/app.model');
const inspect = require('../libs/inspect');

class Worker {
    constructor(io) {
        this.io = io;

        this.queue = [];
        this.inProgress = false;
    }

    add(app) {
        const readyToPush = app.empty && this.queue.findIndex(_app => _app.appid === app.appid) === -1;

        if (readyToPush && !this.queue.length) {
            this.queue.push(app);
            this.inProgress = true;
            this._exec();
        }

        if (readyToPush) {
            this.queue.push(app);
        }
    }

    stop() {
        this.inProgress = false;
    }

    clear() {
        this.queue = [];
    }

    _next() {
        if (this.inProgress) {
            this._exec();
        }
    }

    _exec() {
        const app = this.queue.pop();

        const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                this._fetchAppDetails(app.appid)
                    .then(resolve)
                    .catch(reject);
            }, config.get('STEAMSPYAPI:DELAY'));
        });

        promise
            .then(result => Promise.props({
                result,
                record: model.findOne({ appid: result.appid }),
            }))
            .then(({ result, record }) => {
                Object.assign(record, result, { empty: false });
                return record.save();
            })
            .then(app => {
                if (this.queue.length) {
                    this._next();
                    this.io.emit('resolve next', app);
                } else {
                    this.inProgress = false;
                    this.io.emit('resolve done');
                }
            })
            .catch(inspect);
    }

    _fetchAppDetails(appID) {
        return request.get(config.get('STEAMSPYAPI:GAME_DETAILS').replace('${ID}', appID))
            .then(steamspy => ({
                appid: appID,
                name: steamspy.name,
                multiplayer: Object.keys(steamspy.tags).findIndex(tag => tag === 'Multiplayer') !== -1,
                empty: false,
            }));
    }
}

module.exports = Worker;
