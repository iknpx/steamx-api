const Promise = require('bluebird');
const config = require('../config');
const request = require('../libs/request');
const model = require('../models/app.model');

class AppsService {
    constructor({ config, socket, model, worker }) {
        this.config = config;
        this.socket = socket;
        this.model = model;
        this.worker = worker;

        this.fetchApps = this.fetchApps.bind(this);
        this.fetchPersons = this.fetchPersons.bind(this);
        this.clearApps = this.clearApps.bind(this);

        this._touchApp = this._touchApp.bind(this);
        this._fetchPersonApps = this._fetchPersonApps.bind(this);
        this._fetchPersons = this._fetchPersons.bind(this);
        this._fetchPersonDetails = this._fetchPersonDetails.bind(this);
        this._fetchPersonID = this._fetchPersonID.bind(this);
    }

    fetchApps(appIDS) {
        const result = appIDS
            .map(this._touchApp);

        Promise.all(result)
            .then(apps => this.socket.emit('post::fetch::apps', apps));
    }

    fetchPersons(names) {
        Promise.resolve()
            .then(() => this._fetchPersons(names))
            .map(this._fetchPersonApps)
            .then(apps => this.socket.emit('post::fetch::persons', apps));
    }

    clearApps(appIDS) {
        this.worker.stop();
        this.worker.clear();

        const result = appIDS
            .map(appid => this.model.deleteOne({ appid }));

        Promise.all(result)
            .then(() => this.socket.emit('post::clear::apps', appIDS));
    }

    _touchApp(appidPromise) {
        return Promise.resolve()
            .then(() => appidPromise)
            .then(appid => Promise.props({
                appid,
                app: this.model.findOne({ appid }),
            }))
            .then(({ app, appid }) => {
                return !app
                    ? this.model.create({ appid })
                    : app;
            })
            .then(app => {
                this.worker.add(app);

                return app;
            });
    }

    _fetchPersonApps(personPromise) {
        return Promise.resolve()
            .then(() => personPromise)
            .then(person => {
                const destination = this.config.get('STEAM:API:GET_PERSON_GAMES')
                    .replace('${KEY}', this.config.get('STEAM:KEY'))
                    .replace('${ID}', person.id);

                const apps = request.get(destination)
                    .then(data => data.response.games || [])
                    .then(games => games
                        .reduce((result, game) => [...result, game.appid], [])
                        .sort((a, b) => a < b ? -1 : 1)
                    );

                return Promise.props({ apps, person });
            })
            .then(({ apps, person }) => ({ apps, ...person }));
    }

    _fetchPersons(names) {
        const result = names
            .map(this._fetchPersonID)
            .map(this._fetchPersonDetails);

        return Promise
            .all(result)
            .then(persons => persons.filter(person => person))
            .then(persons => persons.map(
                person => ({
                    id: person.steamid,
                    icon: person.avatarfull,
                    name: person.realname,
                })
            ));
    }

    _fetchPersonDetails(personPromise) {
        return Promise.resolve()
            .then(() => personPromise)
            .then(personID => {
                const destination = this.config.get('STEAM:API:GET_PERSON_DETAILS')
                    .replace('${KEY}', this.config.get('STEAM:KEY'))
                    .replace('${ID}', personID);

                return request.get(destination);
            })
            .then(data => data.response)
            .then(response => {
                return response.players && response.players[0]
                    ? response.players[0]
                    : null;
            });
    }

    _fetchPersonID(name) {
        const destination = this.config.get('STEAM:API:GET_PERSON_ID')
            .replace('${KEY}', this.config.get('STEAM:KEY'))
            .replace('${NAME}', name);

        return Promise.resolve()
            .then(() => request.get(destination))
            .then(data => data.response.steamid);
    }
}

module.exports = worker => socket => {
    const service = new AppsService({ config, socket, model, worker });

    socket.on('get::fetch::apps', service.fetchApps);
    socket.on('get::fetch::persons', service.fetchPersons);
    socket.on('get::clear::apps', service.clearApps);
};
