const Component = require("./Component.js");

module.exports = class Recurring extends Component {

    constructor(client, options) {

        super(client, {
            name: options.name,
            type: 'recurring'
        });

        //this.interval = options.interval || 10; // Time in seconds
        //this.args = options.args || [];

        this.recurrers = [];

    }

    init() {
        if (this.recurrers.length) {
            this.recurrers.forEach(rec => this.client.clearInterval(rec));
            this.recurrers = [];
        }
        if (!this.client.settings.recurring) return;
        const tasks = Object.entries(this.client.settings.recurring);
        for (const [name, params] of tasks) {
            params.name = name;
            this.recurrers.push(this.client.setInterval(this.execute.bind(this), params.interval * 1000, params));
        }
    }

    execute() {
        throw new Error('Execute missing implementation');
    }

};