const request = require('request-promise');

class Request {
    constructor() {
        this.options = {
            json: true,
        };

        this.dr = [];
    }

    /**
     *
     * @param {string} destination
     * @param {object} options
     * @return {Promise}
     */
    get(destination, options = {}) {
        return request({
            ...this.options,
            ...options,
            method: 'GET',
            uri: destination,
        });
    }

    /**
     *
     * @param {string} destination
     * @param {object} payload
     * @param {object} options
     * @return {Promise}
     */
    post(destination, payload = {}, options = {}) {
        return request({
            ...this.options,
            ...options,
            body: payload,
            method: 'POST',
            uri: destination,
        });
    }
}

/**
 * @type {Request}
 */
module.exports = new Request();
