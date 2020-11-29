module.exports = class Listener {

    constructor(client, options) {

        this.client = client;
        this.name = options.name;
        this.priority = options.priority || 10;

    }

};