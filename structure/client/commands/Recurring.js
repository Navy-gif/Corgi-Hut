const { Command } = require('../../interfaces');

module.exports = class Recurring extends Command {

    constructor(client) {

        super(client, {
            name: 'recurring',
            aliases: [],
            permissions: ['ADMINISTRATOR'],
            usage: '[method] [name] [#channel] [interval] [source..]'
        });

    }

    async run(message, args) {

        const method = args.shift().toLowerCase();
        const { settings } = this.client;
        if (!settings.recurring) settings.recurring = {};

        if (['new', 'create'].includes(method)) {
            
            if (args.length < 3) return `Missing args, need a name, a channel and an interval, optionally sources`;
            const name = args.shift().toLowerCase();
            if (settings.recurring[name]) return `Recurring post already eixsts, remove or modify it instead`;

            const _channel = args.shift();
            const channel = await this.client.resolveChannel(_channel);
            if (!channel) return `Could not resolve channel.`;

            const time = args.shift();
            const interval = this.client.resolveTime(time);
            if (!interval) return `Could not resolve interval`;
            if (interval < 5 * 60) return `Interval cannot be faster than 5 minutes`;

            const sources = args.length ? args : null;

            settings.recurring[name] = {
                sources,
                channel: channel.id,
                interval
            };

            this.client.logger.log(`Adding new recurrer in ${message.guild.id}: ${name}, every ${interval/60} minutes`);
            await this.client.updateSettings();
            await this.client.registry.recurring.get('recurring:posts').init();
            return `OK`;

        } else if (['delete', 'remove'].includes(method)) {
            
            if (args.length < 1) return `Need name of recurrer to remove.`;
            const name = args.shift().toLowerCase();
            if (!settings.recurring[name]) return `No such recurrer exists.`;

            this.client.logger.log(`Removing recurrer in ${message.guild.id}: ${name}`);
            delete settings.recurring[name];
            await this.client.updateSettings();
            await this.client.registry.recurring.get('recurring:posts').init();
            return `OK`;

        }
        
    }

};