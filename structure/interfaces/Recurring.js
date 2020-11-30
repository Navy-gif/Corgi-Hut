module.exports = class Recurring {

    constructor(client, options) {

        this.client = client;
        this.name = options.name;
        this.interval = options.interval || 10; // Time in minutes

    }

    init() {
        throw new Error('Init missing implementation');
    }

    execute() {
        throw new Error('Execute missing implementation');
    }

};