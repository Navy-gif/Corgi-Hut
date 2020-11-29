const { EventEmitter } = require('events');

module.exports = class EventHooker {

    constructor(target) {

        if (!(target instanceof EventEmitter)) TypeError('Invalid target, must be of type EventEmitter');

        this.target = target;
        this.events = new Map();

    }

    init() {

        const listeners = this.target.registry.listeners.sort((a, b) => a.priority - b.priority);
        for (const listener of listeners.values()) {
            for (const [event, func] of listener.events) {
                this.hook(event, func);
            }
        }

    }

    hook(event, func) {

        if (this.events.has(event)) {
            const existing = this.events.get(event);
            this.events.set(event, [...existing, func]);
        } else {
            this.events.set(event, [func]);
            this._setup(event);
        }

    }

    async _setup(event) {

        this.target.on(event, async (...args) => {
            for (const func of this.events.get(event)) {
                const result = await func(...args);
                if (result && result.stop) break;
            }
        });

    }

};