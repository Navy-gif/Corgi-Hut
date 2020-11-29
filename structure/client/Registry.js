const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = class Registry {

    constructor(client, componentPath) {

        this.client = client;
        this.path = componentPath;
        this.commands = new Collection();
        this.listeners = new Collection();

    }

    listener(key) {
        if (this.listeners.has(key)) return this.listeners.get(key);
        return false;
    }

    findCommand(key) {

        key = key.toLowerCase();
        if (this.commands.has(key)) return this.commands.get(key);

        const command = this.commands.find((cmd) => cmd.aliases.includes(key));
        if (command) return command;

        return null;

    }

    loadCommands() {

        this.client.logger.log('Loading commands');
        const commandsPath = path.join(this.path, 'commands');
        const folder = fs.readdirSync(commandsPath);

        for (const file of folder) {

            this.client.logger.log(`\tLoading ${file}`);
            const _path = path.join(commandsPath, file);
            const _command = require(_path);
            const command = new _command(this.client);
            this.commands.set(command.name, command);

        }

    }
    
    loadListeners() {

        this.client.logger.log('Loading listeners');
        const listenerPath = path.join(this.path, 'listeners');
        const folder = fs.readdirSync(listenerPath);

        for (const file of folder) {

            this.client.logger.log(`\tLoading ${file}`);
            const _path = path.join(listenerPath, file);
            const _listener = require(_path);
            const listener = new _listener(this.client);
            this.listeners.set(listener.name, listener);

        }

    }

}