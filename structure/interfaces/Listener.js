const Component = require("./Component.js");

module.exports = class Listener extends Component {

    constructor(client, options) {

        super(client, {
            name: options.name,
            type: 'listener'
        });
        
        this.priority = options.priority || 10;

    }

};