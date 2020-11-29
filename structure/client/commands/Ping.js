const { Command } = require('../../interfaces');

module.exports = class Ping extends Command {

    constructor(client) {

        super(client, {
            name: 'ping',
            aliases: ['pong']
        });

    }

    async run(message) {

        const ping = this.client.ws.ping.toFixed(0);
        const number = (ping / 40).toFixed(0);
        const repeat = number > 1 ? number : 1;

        return `P${message._caller === 'pong' ? 'i'.repeat(repeat) : 'o'.repeat(repeat) }ng!\n\`${ping}ms\``;

    }

};