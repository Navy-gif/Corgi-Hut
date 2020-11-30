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

    loadComponents(folderName) {

        this.client.logger.log(`Loading ${folderName}`);
        const commandsPath = path.join(this.path, folderName);
        const folder = fs.readdirSync(commandsPath);

        for (const file of folder) {

            this.client.logger.log(`\tLoading ${file}`);
            const _path = path.join(commandsPath, file);
            const _command = require(_path);
            const command = new _command(this.client);
            this.commands.set(command.name, command);

        }

    }

};