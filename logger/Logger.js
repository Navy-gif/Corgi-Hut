const { createLogger, format, transports: { Console }, config } = require('winston');
const moment = require('moment');
const chalk = require('chalk');

const { DiscordWebhook, FileExtension } = require('./transports');

const Constants = {
    Colors: {
        error: 'red',
        warn: 'yellow',
        info: 'blue',
        verbose: 'cyan',
        debug: 'magenta',
        silly: 'green'
    }
};

module.exports = class Logger {

    constructor(client, loggingOpts) {
        
        this.client = client;

        this.logger = createLogger({
            levels: config.npm.levels,
            format: 
                format.cli({
                    colors: Constants.Colors 
                }),
            transports: [
                new FileExtension({ filename: `logs/${this.date.split(' ')[0]}.log`, level: 'debug' }), //Will NOT log "silly" logs, could change in future.
                new FileExtension({ filename: `logs/errors/${this.date.split(' ')[0]}-error.log`, level: 'error' }),
                new Console({ level: 'silly' }), //Will log EVERYTHING.
                new DiscordWebhook({ level: 'error' }, loggingOpts) //Broadcast errors to a discord webhook.
            ]
        });

        //TODO: Add proper date-oriented filenames and add a daily rotation file (?).

        this.client.on('built', () => {
            this.write('info', 'Client done.');
        });

        process.on('unhandledRejection', (error) => {
            this.write('error', `Unhandled promise rejection:\n${error.stack}`);
        });

    }

    write(type = 'silly', string = '', shard = null) {

        const color = Constants.Colors[type];
        const header = `${chalk[color](`[${this.date}][${shard ? `shard${this._shardId(shard)}` : 'client'}]`)}`;

        this.logger.log(type, `${header}: ${string}`);

    }

    log(message) {
        this.write('info', message);
    }

    get info() {
        return this.log;
    }

    debug(message, opts) {
        this.write('debug', message);
    }

    warn(message, opts) {
        this.write('warn', message);
    }

    error(message, opts) {
        this.write('error', message);
    }

    get date() {
        return moment().format("MM-DD-YYYY hh:mm:ss");
    }

};