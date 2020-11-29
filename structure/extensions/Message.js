const { Structures } = require("discord.js");

module.exports = Structures.extend('Message', (Message) => {

    return class ExtendedMessage extends Message {

        constructor(...args) {

            super(...args);

            this.command = null;

        }

        async respond(message) {

            if (this.guild) {
                const perms = this.channel.permissionsFor(this.guild.me);
                if (perms.missing(['VIEW_CHANNEL', 'SEND_MESSAGES']).length) return;
                if (typeof message !== 'string' && perms.missing('EMBED_LINKS').length) return;
            }

            return this.channel.send(message).catch(console.error);

        }

    };

});