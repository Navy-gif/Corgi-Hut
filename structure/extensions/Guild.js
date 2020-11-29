const { Structures } = require("discord.js");

module.exports = Structures.extend('Guild', (Guild) => {

    return class ExtendedGuild extends Guild {

        constructor(...args) {

            super(...args);

            this.ready = false;
            this._settings = this.defaultSettings;

            //this.fetchData();

        }

        async updateSettings() {
            const result = await this.client.storage.updateOne('guilds', { id: this.id }, { settings: this._settings }).catch(() => false);
            if (result) return true;
            return false;
        }

        /**
         * Load the guild's settings and whatnot
         *
         */
        async fetchData() {

            this.client.logger.log(`Fetching data for ${this.name} (${this.id})`);
            const data = await this.client.storage.fetchGuildData(this.id).catch((error) => this.client.logger.error(error));
            if(data) this._settings = { ...this.defaultSettings, ...data.settings };
            this.ready = true;

        }

        async resolveMembers(members, strict) {

            return this.client.resolver.resolveMembers(members, strict, this);

        }

        async resolveMember(member, strict) {

            return this.client.resolver.resolveMembers(member, strict, this);

        }

        async resolveChannels(channels, strict) {

            return this.client.resolver.resolveChannels(channels, strict, this);

        }

        async resolveChannel(channel, strict) {

            return this.client.resolver.resolveChannel(channel, strict, this);

        }

        async resolveRoles(roles, strict) {

            return this.client.resolver.resolveRoles(roles, strict, this);

        }

        async resolveRole(role, strict) {

            return this.client.resolver.resolveRole(role, strict, this);

        }

        get prefix() {
            return this._settings.prefix || this.client.prefix;
        }

        get defaultSettings() {
            return {
                ignored: {
                    channels: [],
                    users: []
                }
            };
        }

    };

});