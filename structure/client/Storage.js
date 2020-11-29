const fs = require('fs');
const path = require('path')

module.exports = class Storage {

    constructor(client) {

        this.client = client;
        this.db = null;

        this.ready = false;

    }

    async init() {
        try {
            this.client.logger.log('Storage initializing.');
            
            if (!fs.existsSync('./storage')) fs.mkdirSync('./storage');
            const files = fs.readdirSync('./storage');

            this.ready = true;
            this.client.logger.log('Storage handler done.');
        } catch (error) {
            this.client.logger.error(`Failed to initialize database:\n${error.stack}`);
        }
    }

};