const Component = require("./Component.js");

module.exports = class Recurring extends Component {

    constructor(client, options) {

        super(client, {
            name: options.name,
            type: 'recurring'
        });

        this.interval = options.interval || 10; // Time in minutes
        this.args = options.args || [];

        this.recurrer = null;

    }

    init() {
        if (this.recurrer) this.client.clearInterval(this.recurrer);
        this.recurrer = this.client.setInterval(this.execute.bind(this), this.interval * 60 * 1000, this.args);
        this.client.logger.log(`${this.resolve} running every ${this.interval} minutes`);
    }

    execute() {
        throw new Error('Execute missing implementation');
    }

};