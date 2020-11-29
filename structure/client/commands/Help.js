const { Command } = require('../../interfaces');
const { stripIndents } = require('common-tags');

module.exports = class Help extends Command {

    constructor(client) {

        super(client, {
            name: 'help',
            aliases: []
        });

    }

    async run(message) {

        return `Will display help message soon:tm:`;

    }

};