const Transport = require('winston-transport');
const { WebhookClient } = require('discord.js');
const { username } = require('os').userInfo();
const config = require('../../config');

//eslint-disable-next-line no-control-regex
const regex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gu;

class DiscordWebhook extends Transport {
    constructor(opts, loggingOpts) {
        super(opts);

        this.webhookClient = new WebhookClient(
            loggingOpts.webhook.id, 
            loggingOpts.webhook.token
        );
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        const message = info.message.replace(regex, '')
            .replace(new RegExp(config.bot.token, 'gu'), '<redacted>')
            .replace(new RegExp(username, 'gu'), '<redacted>');

        const developers = [
            'nolan',
            'navy',
            'sema'
        ];
        const random = developers[Math.floor(Math.random() * developers.length)];

        const embed = {
            color: 0xe88388,
            timestamp: new Date(),
            description: `\`\`\`${message}\`\`\``,
            footer: {
                text: `probably ${random}'s fault`
            }
        };

        this.webhookClient.send('', { embeds: [embed] });

        callback();
    }
}

module.exports = DiscordWebhook;