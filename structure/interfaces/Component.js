module.exports = class Component {

    constructor(client, options) {
        this.client = client;
        this.name = options.name;
        this.type = options.type;
    }

    get resolve() {
        return `${this.type}:${this.name}`;
    }

};