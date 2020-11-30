const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = class Registry {

    constructor(client, componentPath) {

        this.client = client;
        this.path = componentPath;
        this.components = new Collection();

    }

    get listeners() {
        return this.components.filter(comp => comp.type === 'listener');
    }

    get commands() {
        return this.components.filter(comp => comp.type === 'command');
    }

    get recurring() {
        return this.components.filter(comp => comp.type === 'recurring');
    }

    findRecurring(key) {
        return this.findComponent(key, 'recurring');
    }

    findCommand(key) {
        return this.findComponent(key, 'command');
    }

    findListener(key) {
        return this.findComponent(key, 'listener');
    }

    findComponent(name, type, caseSensitive = false) {

        if (!caseSensitive) {
            name = name.toLowerCase();
            type = type.toLowerCase();
        }

        const resolve = `${type}:${name}`;
        if (this.components.has(resolve)) return this.components.get(resolve);

        const component = this.components.find((comp) => comp.aliases?.includes(name));
        if (component) return component;
        return null;

    }

    async loadComponents(folderName) {

        this.client.logger.log(`Loading ${folderName}`);
        const componentPath = path.join(this.path, folderName);
        const folder = fs.readdirSync(componentPath);

        for (const file of folder) {

            this.client.logger.log(`\tLoading ${file}`);
            const _path = path.join(componentPath, file);
            const _component = require(_path);
            const component = new _component(this.client);
            if (component.init) await component.init();
            this.components.set(component.resolve, component);

        }

    }

};