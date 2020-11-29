const { Listener } = require('../../interfaces');

module.exports = class CommandHandler extends Listener {

    constructor(client) {

        super(client, {
            name: 'commandHandler',
            priority: 1
        });

        this.events = [
            ['message', this.onMessage.bind(this)]
        ];
        
        this.ratelimits = {};

    }

    async onMessage(message) {

        if (!this.client.ready) return;
        if (message.author.bot) return;

        const { content, guild, channel, author, member } = message;

        let { prefix } = this.client;
        let settings = null;
        const inLower = content.toLowerCase();
        // if (guild && guild.ready) ({ prefix, _settings: settings } = guild);
        // else if (guild && !guild.ready) {
        //     await guild.fetchData();
        //     ({ prefix, _settings: settings } = guild);
        // }
        
        if (settings && (settings.ignored.channels.includes(channel.id)
            || settings.ignored.users.includes(author.id))) return;

        if (!inLower.startsWith(prefix)) return;
        const withoutPrefix = content.substring(prefix.length);
        const [commandName, ..._args] = withoutPrefix.split(' ');
        const command = this.client.registry.findCommand(commandName);
        if (!command) return;
        
        if (command.devOnly && !author.developer) return message.respond('This is a dev only command.');
        if (command.showUsage && !_args.length) return command.displayUsage(message);
        if (command.guildOnly && !guild) return message.respond('This command can only be used in a server');
        if (command.perms.length && !member.permissions.has(command.perms) && !author.developer) return message.respond(`This command requires you to have one these permissions:\n\`${command.perms.join('`, `')}\``);

        if (command.ratelimit && !message.author.developer) {
            const now = Math.floor(Date.now() / 1000);
            if (!this.ratelimits[command.name]) this.ratelimits[command.name] = {};
            if (!this.ratelimits[command.name][channel.id]) this.ratelimits[command.name][channel.id] = 0;
            const diff = now - this.ratelimits[command.name][channel.id];
            if (diff < command.ratelimit) return message.respond(`Ratelimited: try again in ${command.ratelimit - diff} seconds`);
            this.ratelimits[command.name][channel.id] = now;
        }
       
        message.command = command;
        message._caller = commandName.toLowerCase();
        message._clean = _args.join(' ');

        const args = message._clean.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, "\"").match(/("[^"']*"|[^"'\s]+)(\s+|$)/img);
        if(args) for (let i = 0; i < args.length; i++) args[i] = args[i].replace(/["'\n]/gi, '').trim();

        try {
            const response = await command.run(message, args);
            if (typeof response === 'string') await message.respond(response);
        } catch (err) {
            this.client.logger.error(err.stack);
            message.channel.send('Command errored.');
        }

    }

};