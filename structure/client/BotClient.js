const path = require('path');
// eslint-disable-next-line no-unused-vars
const { inspect } = require('util');

const Registry = require('./Registry.js');
const Storage = require('./Storage.js');
const RateLimiter = require('./RateLimiter.js');
const Logger = require('../../logger');
const EventHooker = require('./EventHooker.js');
const Resolver = require('./Resolver.js');

const { Client } = require('discord.js');

// eslint-disable-next-line no-unused-vars
const { Guild, User, Message } = require('../extensions');

module.exports = class CorgiHutBot extends Client {

    constructor(options) {

        super(options.clientOptions);

        /**Holds the config file
         * @private
         */
        this._config = options;

        this.logger = new Logger(this, options.logging);
        this.registry = new Registry(this, path.join(process.cwd(), '/structure/client'));
        this.storage = new Storage(this);
        this.rateLimiter = new RateLimiter(this);
        this.eventHooker = new EventHooker(this);
        this.resolver = new Resolver(this);

        this.ready = false;

        this.on('ready', () => {
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
        this.registry.loadCommands();
        this.registry.loadListeners();
        this.eventHooker.init();
        // await this.storage.init();
        this.emit('built');
        await super.login(this._config.token);

    }

    get prefix() {
        return this._config.prefix;
    }

};