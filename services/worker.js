const Promise = require('bluebird');
const striptags = require('striptags');

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

        if (readyToPush && this.queue.length <= 1) {
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
                this._fetchSteamSpyDetails(app.appid)
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
                    this.io.emit('post::fetch::app', app);
                } else {
                    this.inProgress = false;
                    this.io.emit('post::fetch::queue::empty');
                }
            })
            .catch(error => {
                inspect(error);

                // this.queue.push(app);
                if (this.queue.length) {
                    this._next();
                }
            });
    }

    _fetchSteamSpyDetails(appID) {
        return request.get(config.get('STEAMSPYAPI:GAME_DETAILS').replace('${ID}', appID))
            .then(steamspy => ({
                appid: appID,
                name: steamspy.name,
                multiplayer: Object.keys(steamspy.tags).findIndex(tag => tag === 'Multiplayer') !== -1,
                empty: false,
            }))
            .then(steamspyApp => Promise.props({
                steamspyApp,
                steamApp: this._fetchSteamDetails(appID),
            }))
            .then(({ steamspyApp, steamApp }) => ({ ...steamspyApp, ...steamApp }));
    }

    _fetchSteamDetails(appID) {
        return request.get(config.get('STEAM:API:GET_GAME_DETAILS').replace('${ID}', appID))
            .then(result => result[appID])
            .then(response => {
                const data = response && response.success ? response.data : {};

                return {
                    short_description: 'no description',
                    header_image: config.get('IMAGEPLACEHOLDER'),
                    recommendations: { total: -1 },
                    screenshots: [{ path_full: config.get('IMAGEPLACEHOLDER') }],
                    release_date: { date: 'no date ' },
                    ...data,
                };
            })
            .then(data => ({
                description: striptags(data.short_description || data.detailed_description)
                    .replace('&quot;', '')
                    .replace('&reg;', ''),
                image: data.header_image,
                score: data.recommendations.total,
                bg: data.screenshots[0].path_full,
                date: data.release_date.date,
            }));
    }
}

module.exports = Worker;
