const { Structures } = require('discord.js');

module.exports = Structures.extend('User', (User) => {

    return class ExtendedUser extends User {

        get developer() {
            return this.client._config.Developers.includes(this.id);
        }

    };

});