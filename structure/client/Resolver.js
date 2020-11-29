const timestring = require('timestring');

module.exports = class Resolver {

    constructor(client) {
        this.client = client;
    }

    timeAgo(diff, extraMin = false, extraHours = false, extraDays = false) {

        diff = parseInt(diff);
        if (isNaN(diff)) return 'that ain\'t it chief (not a number)';

        const years = Math.floor(diff / 60 / 60 / 24 / 365),
            months = Math.floor(diff / 60 / 60 / 24 / 30.4),
            weeks = extraDays ? Math.floor(diff / 60 / 60 / 24 / 7) : (diff / 60 / 60 / 24 / 7).toFixed(),
            days = extraHours ? Math.floor(diff / 60 / 60 / 24) : (diff / 60 / 60 / 24).toFixed(),
            hours = extraMin ? Math.floor(diff / 60 / 60) : (diff / 60 / 60).toFixed(),
            minutes = (diff / 60).toFixed();

        if (days > 365) {
            return `${years > 0 ? years : 1} year${years > 1 ? 's' : ''}${months % 12 > 0 ? ` ${months % 12} month${months % 12 > 1 ? 's' : ''}` : ''}`;
        } else if (weeks > 4) {
            return `${months} month${months % 12 > 1 ? 's' : ''}${days % 30 > 0 ? ` ${days % 30} day${days % 30 > 1 ? 's' : ''}` : ''}`;
        } else if (days >= 7) {
            return `${weeks} week${weeks > 1 ? 's' : ''}${extraDays && days % 7 > 0 ? ` ${days % 7} day${days % 7 > 1 ? 's' : ''}` : ''}`;
        } else if (hours >= 24) {
            return `${days} day${days > 1 ? 's' : ''}${extraHours && hours % 24 > 0 ? ` ${hours % 24} hour${hours % 24 > 1 ? 's' : ''}` : ''}`;
        } else if (minutes >= 60) {
            return `${hours} hour${hours > 1 ? 's' : ''}${extraMin && minutes % 60 > 0 ? ` ${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}` : ''}`;
        } else if (diff >= 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        return diff.toFixed() + ` second${diff.toFixed() !== 1 ? 's' : ''}`;

    }

    resolveBoolean(input) {
        input = input.toLowerCase();
        const truthy = ['on', 'true', 'yes', 'enable', 'y', 't'];
        const falsey = ['off', 'false', 'no', 'disable', 'n', 'f'];

        if (truthy.includes(input)) {
            return true;
        } else if (falsey.includes(input)) {
            return false;
        }
        return null;

    }

    /**
     * Resolves methods used primarily for settings, also deals with appending the arguments into existing lists
     *
     * @param {Array<String>} args The incoming arguments with the first element being the method ex. ['add','ban','kick']
     * @param {Array<String>} valid An array of items to compare to, if an argument doesn't exist in this array it'll be skipped over, can be omitted from arguments with null
     * @param {Array<String>} [existing=[]] Existing values in the array, valid elements will be appended to this
     * @param {Function} resolver One of the resolver functions used to resolve the passed values into objects (should always be one of the mass resolvers due to the nature of this method, might break otherwise) NOTE: REMEMBER TO BIND 'this' ARG!
     * @param {Guild} guild The guild for the resolver to use when resolving
     * @param {Boolean} caseSensitive Whether or not the arguments are case sensitive
     * @returns {Object}
     * @memberof Resolver
     */
    async resolveMethod(args, valid, existing = [], resolver, guild, caseSensitive = false) {

        const methods = {
            list: ['view', 'list', '?', 'show'],
            add: ['add', '+'],
            set: ['set', '='],
            remove: ['remove', 'delete', '-'],
            reset: ['clear', 'reset', 'default'],
            off: ['off', 'disable', 'false', 'no', 'n', 'f'],
            on: ['on', 'enable', 'true', 'yes', 'y', 't']
        };

        if (!args.length) return false;
        // eslint-disable-next-line prefer-const
        let [method, ...rest] = args;
        method = method.toLowerCase();
        let resolved = [];

        if (methods.reset.includes(method)) return { method: 'reset' };
        if (methods.off.includes(method)) return { method: 'off' };
        if (methods.on.includes(method)) return { method: 'on' };

        if (!rest.length) {
            if (methods.add.includes(method)) return { method: 'add' };
            if (methods.remove.includes(method)) return { method: 'remove' };
            if (methods.set.includes(method)) return { method: 'set' };
        }

        if (methods.list.includes(method)) {

            if (resolver) resolved = await resolver(existing, false, guild);
            return { method: 'list', resolved };

        } else if (methods.add.includes(method)) {

            const added = [];
            for (let elem of rest) {
                if (resolver) {
                    const _resolved = await resolver(elem, false, guild);
                    if (_resolved) {
                        if (!resolved.includes(_resolved[0])) resolved.push(_resolved[0]);
                        elem = _resolved[0].id;
                    }
                }

                if (!caseSensitive) elem = elem.toLowerCase();
                if (existing.includes(elem) || valid && !valid.includes(elem)) continue;

                added.push(elem);
                existing.push(elem);

            }

            return { rest, method: 'add', changed: added, result: existing, resolved };

        } else if (methods.remove.includes(method)) {

            const removed = [];
            for (let elem of rest) {

                if (resolver) {
                    const _resolved = await resolver(elem, false, guild);
                    if (_resolved) {
                        if (!resolved.includes(_resolved[0])) resolved.push(_resolved[0]);
                        elem = _resolved[0].id;
                    }
                }

                if (!caseSensitive) elem = elem.toLowerCase();
                if (!existing.includes(elem) || removed.includes(elem) || valid && !valid.includes(elem)) continue;
                removed.push(elem);
                existing.splice(existing.indexOf(elem), 1);

            }

            return { rest, method: 'remove', changed: removed, result: existing, resolved };

        } else if (methods.set.includes(method)) {

            const set = [];
            for (let elem of rest) {

                if (resolver) {
                    const _resolved = await resolver(elem, false, guild);
                    if (_resolved) {
                        if (!resolved.includes(_resolved[0])) resolved.push(_resolved[0]);
                        elem = _resolved[0].id;
                    }
                }

                if (!caseSensitive) elem = elem.toLowerCase();
                if (valid && !valid.includes(elem)) continue;
                set.push(elem);

            }

            return { rest, method: 'set', changed: set, result: set, resolved };

        }

        return false;

    }

    /**
     * Resolve several user resolveables
     *
     * @param {array<string>} [resolveables=[]] an array of user resolveables (name, id, tag)
     * @param {boolean} [strict=false] whether or not to attempt resolving by partial usernames
     * @returns {array || boolean} Array of resolved users or false if none were resolved
     * @memberof Resolver
     */
    async resolveUsers(resolveables = [], strict = false) {

        if (typeof resolveables === 'string') resolveables = [resolveables];
        if (resolveables.length === 0) return false;
        const { users } = this.client;
        const resolved = [];

        for (const resolveable of resolveables) {

            if ((/<@!?([0-9]{17,21})>/u).test(resolveable)) {

                const [, id] = resolveable.match(/<@!?([0-9]{17,21})>/u);
                const user = await users.fetch(id).catch((err) => {
                    if (err.code === 10013) return false;
                    // this.client.logger.warn(err); return false; 

                });
                if (user) resolved.push(user);

            } else if ((/(id:)?([0-9]{17,21})/u).test(resolveable)) {

                const [, , id] = resolveable.match(/(id:)?([0-9]{17,21})/u);
                const user = await users.fetch(id).catch((err) => {
                    if (err.code === 10013) return false;
                    // this.client.logger.warn(err); return false; 

                });
                if (user) resolved.push(user);

            } else if ((/^@?([\S\s]{1,32})#([0-9]{4})/u).test(resolveable)) {

                const m = resolveable.match(/^@?([\S\s]{1,32})#([0-9]{4})/u);
                const username = m[1].toLowerCase();
                const discrim = m[2].toLowerCase();
                const user = users.cache.sort((a, b) => a.username.length - b.username.length).filter((u) => u.username.toLowerCase() === username && u.discriminator === discrim).first();
                if (user) resolved.push(user);

            } else if (!strict) {

                const name = resolveable.toLowerCase();
                const user = users.cache.sort((a, b) => a.username.length - b.username.length).filter((u) => u.username.toLowerCase().includes(name)).first();
                if (user) resolved.push(user);

            }

        }

        return resolved.length ? resolved : false;

    }

    async resolveUser(resolveable, strict) {

        if (!resolveable) return false;
        if (resolveable instanceof Array) throw new Error('Resolveable cannot be of type Array, use resolveUsers for resolving arrays of users');
        const result = await this.resolveUsers([resolveable], strict);
        return result ? result[0] : false;

    }

    /**
     * Resolve multiple member resolveables
     *
     * @param {array<string>} [resolveables=[]] an array of member resolveables (name, nickname, tag, id)
     * @param {boolean} [strict=false] whether or not to attempt resolving by partial matches
     * @param {Guild} guild the guild in which to look for members
     * @returns {array<GuildMember> || boolean} an array of resolved members or false if none were resolved
     * @memberof Resolver
     */
    async resolveMembers(resolveables = [], strict = false, guild = null) {

        if (typeof resolveables === 'string') resolveables = [resolveables];
        if (resolveables.length === 0) return false;
        if (!guild) return false;
        const { members } = guild;
        const resolved = [];

        for (const resolveable of resolveables) {

            if ((/<@!?([0-9]{17,21})>/u).test(resolveable)) {

                const [, id] = resolveable.match(/<@!?([0-9]{17,21})>/u);
                const member = await members.fetch(id).catch((err) => {
                    if (err.code === 10007) return false;
                    // this.client.logger.warn(err); return false; 

                });
                if (member) resolved.push(member);

            } else if ((/(id:)?([0-9]{17,21})/u).test(resolveable)) {

                const [, , id] = resolveable.match(/(id:)?([0-9]{17,21})/u);
                const member = await members.fetch(id).catch((err) => {
                    if (err.code === 10007) return false;
                    // this.client.logger.warn(err); return false; 

                });
                if (member) resolved.push(member);

            } else if ((/^@?([\S\s]{1,32})#([0-9]{4})/u).test(resolveable)) {

                const m = resolveable.match(/^@?([\S\s]{1,32})#([0-9]{4})/u);
                const username = m[1].toLowerCase();
                const discrim = m[2].toLowerCase();
                const member = members.cache.filter((m) => m.user.username.toLowerCase() === username && m.user.discriminator === discrim).first();
                if (member) resolved.push(member);

            } else if ((/^@?([\S\s]{1,32})/u).test(resolveable) && guild && !strict) {

                const nickname = resolveable.match(/^@?([\S\s]{1,32})/u)[0].toLowerCase();
                const member = members.cache.sort((a, b) => a.user.username.length - b.user.username.length).filter((m) => m && m.user &&
                    ((!m.nickname ? false : m.nickname.toLowerCase() === nickname) ||
                        (!m.nickname ? false : m.nickname.toLowerCase().includes(nickname)) ||
                        m.user.username.toLowerCase().includes(nickname) ||
                        m.user.username.toLowerCase() === nickname)).first();
                if (member) resolved.push(member);

            }

        }

        return resolved.length > 0 ? resolved : false;

    }

    async resolveMember(resolveable, strict, guild) {

        if (!resolveable) return false;
        if (resolveable instanceof Array) throw new Error('Resolveable cannot be of type Array, use resolveMembers for resolving arrays of members');
        const result = await this.resolveMembers([resolveable], strict, guild);
        return result ? result[0] : false;

    }

    /**
     * Resolve multiple channels
     *
     * @param {array<string>} [resolveables=[]] an array of channel resolveables (name, id)
     * @param {guild} guild the guild in which to look for channels
     * @param {boolean} [strict=false] whether or not partial names are resolved
     * @returns {array<GuildChannel> || false} an array of guild channels or false if none were resolved
     * @memberof Resolver
     */
    async resolveChannels(resolveables = [], strict = false, guild = null, filter = () => true) {

        if (typeof resolveables === 'string') resolveables = [resolveables];
        if (resolveables.length === 0) return false;
        if (!guild) return false;
        const CM = guild.channels;
        const resolved = [];

        const name = /^#?([a-z0-9\-_0]*)/iu;
        const id = /^<?#?([0-9]*)>?/iu;

        for (const resolveable of resolveables) {

            const channel = CM.resolve(resolveable);
            if (channel && filter(channel)) {
                resolved.push(channel);
                continue;
            }

            const idMatch = resolveable.match(id);
            const nameMatch = resolveable.match(name);

            if (idMatch[1].length) {

                const [, ch] = idMatch;
                const channel = await this.client.channels.fetch(ch).catch((e) => { }); //eslint-disable-line no-empty, no-empty-function, no-unused-vars

                if (channel && filter(channel)) resolved.push(channel);

            } else if (nameMatch[1].length) {

                const ch = nameMatch[1].toLowerCase();

                const channel = CM.cache.sort((a, b) => a.name.length - b.name.length).filter(filter).filter((c) => {
                    if (!strict) return c.name.toLowerCase().includes(ch);
                    return c.name.toLowerCase() === ch;
                }).first();

                if (channel) resolved.push(channel);

            }

        }

        return resolved.length > 0 ? resolved : false;

    }

    async resolveChannel(resolveable, strict, guild, filter) {

        if (!resolveable) return false;
        if (resolveable instanceof Array) throw new Error('Resolveable cannot be of type Array, use resolveChannels for resolving arrays of channels');
        const result = await this.resolveChannels([resolveable], strict, guild, filter);
        return result ? result[0] : false;

    }

    /**
     * Resolve multiple roles
     *
     * @param {array<string>} [resolveables=[]] an array of roles resolveables (name, id)
     * @param {Guild} guild the guild in which to look for roles
     * @param {boolean} [strict=false] whether or not partial names are resolved
     * @returns {array<GuildRole> || false} an array of roles or false if none were resolved
     * @memberof Resolver
     */
    async resolveRoles(resolveables = [], strict = false, guild = null) {

        if (typeof resolveables === 'string') resolveables = [resolveables];
        if (resolveables.length === 0) return false;
        if (!guild) return false;
        const { roles } = guild;
        const resolved = [];

        for (const resolveable of resolveables) {

            const id = /^(<@&)?([0-9]{16,22})>?/iu;

            if (id.test(resolveable)) {

                const match = resolveable.match(id);
                const [, , rId] = match;

                const role = await roles.fetch(rId).catch(this.client.logger.error);

                if (role) resolved.push(role);

            } else {

                const role = roles.cache.sort((a, b) => a.name.length - b.name.length).filter((r) => {
                    if (!strict) return r.name.toLowerCase().includes(resolveable.toLowerCase());
                    return r.name.toLowerCase() === resolveable.toLowerCase();
                }).first();

                if (role) resolved.push(role);

            }

        }

        return resolved.length > 0 ? resolved : false;

    }

    async resolveRole(resolveable, strict, guild) {
        if (!resolveable) return false;
        if (resolveable instanceof Array) throw new Error('Resolveable cannot be of type Array, use resolveRoles for resolving arrays of roles');
        const result = await this.resolveRoles([resolveable], strict, guild);
        return result ? result[0] : false;
    }

    resolveTime(string) {
        let time = null;
        try {
            time = timestring(string);
        } catch (err) {
            return null;
        }
        return time;
    }


    /**
     * Iterate through several arguments attempting to resolve them with the passed resolvers
     *
     * @param {Array<string>} [args=[]]
     * @param {Array<Function>} [resolvers=[]]
     * @param {boolean} strict
     * @param {Guild} guild
     * @returns
     */
    async infinite(args = [], resolvers = [], strict, guild) {
        let parsed = [], //eslint-disable-line prefer-const
            parameters = [];

        if (resolvers.length === 0) return { parsed, parameters: args };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            let resolved = null;
            for (const resolver of resolvers) {
                if (resolved) break;
                resolved = resolver(arg, strict, guild);
                if (resolved instanceof Promise) resolved = await resolved;
            }
            if (resolved) {
                const ids = parsed.map((p) => p.id);
                if (!ids.includes(resolved.id)) parsed.push(resolved);
                continue;
            } else {
                parameters = args.splice(i);
                break;
            }
        }

        return { parsed, parameters };

    }

};