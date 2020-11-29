const { Command } = require('../../interfaces');
const { inspect } = require('util');

module.exports = class Eval extends Command {

    constructor(client) {

        super(client, {
            name: 'eval',
            aliases: ['e'],
            devOnly: true
        });

    }

    async run(message) {

        // eslint-disable-next-line no-unused-vars
        const { guild, channel, author, member, client } = message;

        try {
            // eslint-disable-next-line no-eval
            let result = eval(message._clean);
            if (result instanceof Promise) result = await result;
            if (typeof result !== 'string') result = inspect(result);
            result = result.replace(new RegExp(this.client.token, 'igu'), '<redacted>');
            if (result.length > 1850) result = `${result.substring(0, 1850)}...`;
            return `:thumbsup:\`\`\`js\n${result}\`\`\``;

        } catch (error) {
            
            let msg = `${error}${error.stack ? `\n${error.stack}` : ''}`;
            if (msg.length > 2000) msg = `${msg.substring(0, 1900)}...`;
            return `:thumbsdown:\`\`\`js\n${msg}\`\`\``;

        }

    }

};