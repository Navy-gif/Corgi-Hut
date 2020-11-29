const { stripIndents } = require('common-tags');

module.exports = class Command {

    constructor(client, options) {

        this.client = client;
        this.name = options.name;
        this.aliases = options.aliases || [];
        this.description = options.description || `Command ${this.name} is missing description`;
        this.usage = options.usage || `${this.client.prefix}${this.name}`;
        this.showUsage = options.showUsage || false;
        this.display = this.name[0].toUpperCase() + this.name.substring(1);
        this.guildOnly = options.guildOnly || false;
        this.devOnly = options.devOnly || false;
        this.ratelimit = options.ratelimit || 0;
        this.perms = options.perms || [];

    }

    async run(message) {

        await message.channel.send('Implementation pending.');

    }

    async displayUsage(message) {

        await message.channel.send(stripIndents`**__${this.display}__ command**
                                                ${this.description}
                                                
                                                **Usage:**
                                                \`${this.usage}\``);

    }

};