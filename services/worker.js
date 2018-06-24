const Promise = require('bluebird');
const config = require('../config');
const request = require('../libs/request');
const model = require('../models/app.model');

class Worker {
    constructor(io) {
        this.io = io;

        this.queque = [];
        this.inProgress = false;
    }

    add(app) {
        const readyToPush = app.empty && this.queque.findIndex(_app => _app.appid === app.appid) === -1;
        if (readyToPush && !this.queque.length) {
            this.queque.push(app);
            this.inProgress = true;
            this._exec();
        }

        if (readyToPush) {
            this.queque.push(app);
        }
    }

    stop() {
        this.inProgress = false;
    }

    clear() {
        this.queque = [];
    }

    _next() {
        if (this.inProgress) {
            this._exec();
        }
    }

    _exec() {
        const app = this.queque.pop();

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
                if (this.queque.length) {
                    this._next();
                    this.io.emit('resolve next', app);
                } else {
                    this.inProgress = false;
                    this.io.emit('resolve done');
                }
            })
            .catch(() => this.queque.push(app));
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
