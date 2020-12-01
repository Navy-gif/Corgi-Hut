const { MongoClient } = require('mongodb');

module.exports = class Storage {

    constructor(client, options) {

        this._client = client;
        this.host = options.host;
        this.database = options.database;
        this.connection = null;
        this.db = null;

        this.ready = false;

    }

    async init() {
        try {
            this.connection = await MongoClient.connect(this.host + this.database, { useUnifiedTopology: true });
            this.db = await this.connection.db(this.database);
            this.ready = true;
        } catch (error) {
            this.client.logger.error('Failed to initialize database:');
            this.client.logger.error(error);
        }
    }

    push(collection, filter, data, upsert = true) {

        return new Promise((resolve, reject) => {

            if (!this.ready) reject(new Promise('Mongo not ready'));
            this[collection].updateOne(filter, { $push: { data } }, { upsert }, (error, result) => {
                if (error) reject(error);
                resolve(result);
            });

        });

    }

    findOne(collection, filter) {

        return new Promise((resolve, reject) => {

            if (!this.ready) reject(new Promise('Mongo not ready'));
            this[collection].findOne(filter, (error, item) => {

                if (error) reject(error);
                resolve(item);

            });

        });

    }

    updateOne(collection, filter, data, upsert = true) {

        return new Promise((resolve, reject) => {

            if (!this.ready) reject(new Promise('Mongo not ready'));
            this[collection].updateOne(filter, { $set: data }, { upsert }, async (error, result) => {
                
                if (error) return reject(error);
                resolve(result);

            });

        });

    }

    fetchGuildData(guild) {

        return new Promise((resolve, reject) => {

            if (!this.ready) reject(new Promise('Mongo not ready'));
            this.guilds.findOne({ id: guild }, async (error, item) => {

                if (error) return reject(error);
                return resolve(item);

            });

        });

    }

    get users() {
        return this.db.collection('users');
    }

    get guilds() {
        return this.db.collection('guilds');
    }

    get client() {
        return this.db.collection('client');
    }

    get settings() {
        return this.db.collection('settings');
    }

};