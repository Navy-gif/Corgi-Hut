const path = require('path');
// eslint-disable-next-line no-unused-vars
const { inspect } = require('util');

const Registry = require('./Registry.js');
const Storage = require('./Storage.js');
const RateLimiter = require('./RateLimiter.js');
const Logger = require('../../logger');
const EventHooker = require('./EventHooker.js');
const Resolver = require('./Resolver.js');
const { Reddit } = require('../../util');

const { Client } = require('discord.js');

// eslint-disable-next-line no-unused-vars
const { Guild, User, Message } = require('../extensions');

module.exports = class CorgiHutBot extends Client {

    constructor(options) {

        super(options.bot.clientOptions);

        /**Holds the config file
         * @private
         */
        this._config = options.bot;
        this.settings = null; //{ guild: '207880433432657920', recurring: {} }//require('../../settings.json');

        this.logger = new Logger(this, options.logging);
        this.registry = new Registry(this, path.join(process.cwd(), '/structure/client'));
        this.storage = new Storage(this, options.storage);
        this.rateLimiter = new RateLimiter(this);
        this.eventHooker = new EventHooker(this);
        this.resolver = new Resolver(this);
        this.reddit = new Reddit(this, options.reddit);

        this.ready = false;

        this.on('ready', async () => {
            const guilds = this.guilds.cache.size;
            this.logger.log(`Successfully logged in as ${this.user.tag} with ${guilds} guild${guilds > 1 ? 's' : ''}`);
            this.ready = true;
        });

        // process.on('unhandledRejection', (error) => {
        //     this.logger.error(`Unhandled promise rejection:\n${error.stack}`);
        // });

    }

    async build() {

        this.logger.log('Building client');
        
        await this.storage.init();
        this.settings = await this.storage.findOne('settings', { guild: this._config.guild });
        if (!this.settings) this.settings = { guild: this._config.guild };

        await this.registry.loadComponents('commands');
        await this.registry.loadComponents('recurring');
        await this.registry.loadComponents('listeners');
        //this.registry.loadCommands();
        //this.registry.loadListeners();
        this.eventHooker.init();

        this.emit('built');
        await super.login(this._config.token);
        //await this.reddit.init();

    }

    async updateSettings() {
        await this.storage.updateOne('settings', { guild: this.guild.id }, this.settings);
    }

    get prefix() {
        return this._config.prefix;
    }

    get guild() {
        return this.guilds.cache.get(this._config.guild);
    }

    resolveChannel(channel) {

        return this.resolver.resolveChannel(channel, true, this.guild);

    }

    get resolveTime() {
        return this.resolver.resolveTime;
    }

};