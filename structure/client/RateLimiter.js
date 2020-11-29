const { TextChannel, Message, Webhook } = require("discord.js");

class RateLimiter {

    constructor(client) {

        this.client = client;

        this.sendQueue = {}; //items to bulk send, sendQueue[CHANNEL_ID] = ARRAY[TEXT]
        this.sendTimeouts = {}; //timeouts for sends in each channel

        this.sendQueueEmbed = {}; //same thing, except for things that are to be sent in one embed
        this.sendEmbedTimeouts = {}; // same as above

        this.deleteQueue = {}; //items to bulk delete
        this.deleteTimeouts = {}; //same as above

        this.lastSend = {}; //used by limitSend

        this.sendInterval = 7.5; //How frequently sending is allowed in seconds
        this.deleteInterval = 2.5; //How frequently delete queues should be executed

    }

    /**
     * Queues message deletion for bulk deletes, to avoid multiple singular delete calls
     *
     * @param {TextChannel} channel The channel in which to delete
     * @param {Message} message The message to delete
     * @returns {Promise<Boolean>}
     * @memberof RateLimiter
     */
    queueDelete(channel, message) {

        return new Promise((resolve, reject) => {

            if(!channel || !(channel instanceof TextChannel)) reject(new Error('Missing channel'));
            if(!message || !(message instanceof Message)) reject(new Error('Missing message'));
            if(!channel.permissionsFor(channel.guild.me).has('MANAGE_MESSAGES')) reject(new Error('Missing permission MANAGE_MESSAGES'));

            if(!this.deleteQueue[channel.id]) this.deleteQueue[channel.id] = [];
            this.deleteQueue[channel.id].push({ message, resolve, reject });

            if(!this.deleteTimeouts[channel.id] || this.deleteTimeouts[channel.id]._destroyed) this.deleteTimeouts[channel.id] = setTimeout(this.delete.bind(this), this.deleteInterval*1000, channel);

        });

    }

    async delete(channel) {

        if(!this.deleteQueue[channel.id] || !this.deleteQueue[channel.id].length) return;

        const resolves = [],
            rejects = [],
            queue = [...this.deleteQueue[channel.id]],
            deleteThese = [];
        
        for(const item of queue) {
            const { message, resolve, reject } = item;
            if(deleteThese.length <= 100) {
                deleteThese.push(message);
                resolves.push(resolve);
                rejects.push(reject);
                this.deleteQueue[channel.id].shift();
            } else {
                this.deleteTimeouts[channel.id] = setTimeout(this.delete.bind(this), this.deleteInterval*1000, channel);
                break;
            }
        }

        if(deleteThese.length === 1) {
            deleteThese[0].delete().then(resolves[0]).catch(rejects[0]);
        } else try {
            await channel.bulkDelete(deleteThese);
            for(const resolve of resolves) resolve(true);
        } catch (err) {
            for(const reject of rejects) reject(err);
        }

    }

    /**
     * Queue sending of multiple messages into one
     *
     * @param {TextChannel} channel The channel in which to send
     * @param {String} message The text to send 
     * @returns {Promise<Message>} Resolves when the message is sent, rejects if sending fails
     * @memberof RateLimiter
     */
    queueSend(channel, message) {

        return new Promise((resolve, reject) => {

            if(!channel || !(channel instanceof TextChannel)) reject(new Error('Missing channel.'));
            if(!message || !message.length) reject(new Error('Missing message.'));
            if(!channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES')) reject(new Error('Missing permission SEND_MESSAGES'));

            //Initiate queue
            if(!this.sendQueue[channel.id]) this.sendQueue[channel.id] = [];

            //Possibly check for duplicates, probably not necessary
            this.sendQueue[channel.id].push({ message, resolve, reject });

            //Check if an active timeout exists, if not, create one
            if(!this.sendTimeouts[channel.id] || this.sendTimeouts[channel.id]._destroyed) this.sendTimeouts[channel.id] = setTimeout(this.send.bind(this), this.sendInterval*1000, channel);

        });

    }

    /**
     * Queue sending of multiple messages into one
     *
     * @param {Webhook} hook The hook to send to
     * @param {String} message The text to send 
     * @returns {Promise<Message>} Resolves when the message is sent, rejects if sending fails
     * @memberof RateLimiter
     */
    queueSendWebhook(hook, message) {

        return new Promise((resolve, reject) => {

            if (!hook || !(hook instanceof Webhook)) reject(new Error('Missing channel.'));
            if (!message || !message.length) reject(new Error('Missing message.'));
            //if (!channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES')) reject(new Error('Missing permission SEND_MESSAGES'));

            //Initiate queue
            if (!this.sendQueue[hook.id]) this.sendQueue[hook.id] = [];

            //Possibly check for duplicates, probably not necessary
            this.sendQueue[hook.id].push({ message, resolve, reject });

            //Check if an active timeout exists, if not, create one
            if (!this.sendTimeouts[hook.id] || this.sendTimeouts[hook.id]._destroyed) this.sendTimeouts[hook.id] = setTimeout(this.sendHook.bind(this), this.sendInterval * 1000, hook);

        });

    }

    async send(channel) {

        if(!this.sendQueue[channel.id] || !this.sendQueue[channel.id].length) return;

        const resolves = [],
            rejects = [],
            queue = [...this.sendQueue[channel.id]];

        let sendThis = '',
            temp = '';

        //Compile all messages into one
        for(const item of queue) {
            const { message, resolve, reject } = item;
            temp = `\n${message}`;
            if(sendThis.length + temp.length > 2000) {
                //Max length message, send the remaining messages at the next send
                this.sendTimeouts[channel.id] = setTimeout(this.send.bind(this), this.sendInterval*1000, [channel]);
                break;
            } else {
                sendThis += temp;
                resolves.push(resolve);
                rejects.push(reject);
                this.sendQueue[channel.id].shift();
            }
        }

        try {
            const message = await channel.send(sendThis);
            for(const resolve of resolves) resolve(message);
        } catch (err) {
            for(const reject of rejects) reject(err);
        }

    }

    async sendHook(hook) {

        if (!this.sendQueue[hook.id] || !this.sendQueue[hook.id].length) return;

        const resolves = [],
            rejects = [],
            queue = [...this.sendQueue[hook.id]];

        let sendThis = '',
            temp = '';

        //Compile all messages into one
        for (const item of queue) {
            const { message, resolve, reject } = item;
            temp = `\n${message}`;
            if (sendThis.length + temp.length > 2000) {
                //Max length message, send the remaining messages at the next send
                this.sendTimeouts[hook.id] = setTimeout(this.sendHook.bind(this), this.sendInterval * 1000, [hook]);
                break;
            } else {
                sendThis += temp;
                resolves.push(resolve);
                rejects.push(reject);
                this.sendQueue[hook.id].shift();
            }
        }

        try {
            const message = await hook.send(sendThis);
            for (const resolve of resolves) resolve(message);
        } catch (err) {
            for (const reject of rejects) reject(err);
        }

    }

    queueSendEmbed(channel, message) {
        //TODO
    }

    async sendEmbed(channel) {
        //TODO
    }

    /**
     * Limit sending of messages to one every x seconds. 
     * Useful for stopping multiple instances of "Invites aren't permitted" being sent
     *
     * @param {TextChannel} channel channel in which to send
     * @param {String} message the message to send
     * @param {Number} [limit=15] how frequently the message can send
     * @param {String} utility Limit by utility, ex invitefilter or messagefilter - so they don't overlap
     * @returns {Promise<Message>} The message object of the sent message
     * @memberof RateLimiter
     */
    limitSend(channel, message, limit = 15, utility = 'default') {

        return new Promise((resolve, reject) => {
            if(!channel || !(channel instanceof TextChannel)) reject(new Error('Missing channel'));
            if(!channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES')) reject(new Error('Missing permission SEND_MESSAGES'));
            if(!message) reject(new Error('Missing message'));

            const now = Math.floor(Date.now()/1000);
            if(!this.lastSend[channel.id]) this.lastSend[channel.id] = {};
            if(!this.lastSend[channel.id][utility]) this.lastSend[channel.id][utility] = 0;

            const lastSent = this.lastSend[channel.id][utility];
            if(now-limit >= lastSent) {
                this.lastSend[channel.id][utility] = now;
                resolve(channel.send(message));
            } else resolve(false);
        });

    }

}

module.exports = RateLimiter;