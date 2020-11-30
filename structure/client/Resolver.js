const timestring = require('timestring');
const moment = require('moment');
const dns = require('dns');

//const { InfractionResolves } = require('../../util/Constants.js'); 
// eslint-disable-next-line no-unused-vars
const { Guild, GuildChannel, Role, User } = require('discord.js');

const filterExact = (search) => (comp) => comp.id.toLowerCase() === search ||
    comp.resolveable.toLowerCase() === search ||
    comp.aliases && (comp.aliases.some((ali) => `${comp.type}:${ali}`.toLowerCase() === search) ||
        comp.aliases.some((ali) => ali.toLowerCase() === search));

const filterInexact = (search) => (comp) => comp.id.toLowerCase().includes(search) ||
    comp.resolveable.toLowerCase().includes(search) ||
    comp.aliases && (comp.aliases.some((ali) => `${comp.type}:${ali}`.toLowerCase().includes(search)) ||
        comp.aliases.some((ali) => ali.toLowerCase().includes(search)));

const filterInexactTags = (search) => (comp) => comp.id.toLowerCase().includes(search.toLowerCase()) ||
    comp.resolveable.toLowerCase().includes(search.toLowerCase()) ||
    comp.aliases && (comp.aliases.some((ali) => `${comp.type}:${ali}`.toLowerCase().includes(search.toLowerCase())) ||
        comp.aliases.some((ali) => ali.toLowerCase().includes(search.toLowerCase())) ||
        comp.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())));

class Resolver {

    constructor(client) {
        this.client = client;
    }

    /**
     *
     *
     * @param {string} [str=''] Keyword to search for
     * @param {string} type Type of the component (ex. command)
     * @param {boolean} [exact=true] Exact matching
     * @returns
     * @memberof Resolver
     */

    resolveComponent(arg, strict = true, type = 'any') {

        const string = arg.toLowerCase();

        const components = this.client.registry.components
            .filter((c) => type === 'any' ? ['command', 'setting'].includes(c.type) : c.type === type)
            .filter(strict ? filterExact(string) : filterInexact(string)); //eslint-disable-line no-use-before-define

        return components.first();

    }

    resolveCases(str = '', max = 0) {

        const cases = [];

        const matches = str.match(/(\d{1,6})(?:\.\.\.?|-)(\d{1,6})?/iu);
        if(matches) {
            const [ , first, second ] = matches;
            let difference = Math.abs((second ? second : max) - parseInt(first));
            if(difference+parseInt(first) > max) difference = max;
            new Array(difference+1).fill(0)
                .forEach((item, i) => {
                    const number = i+parseInt(first);
                    if(number <= max) cases.push(i+parseInt(first));
                });
        } else {
            const split = str.split(' ');
            for(const string of split) {
                const number = parseInt(string);
                if(number <= max && !cases.includes(number)) cases.push(number);
            }
        }

        return cases;

    }

    components(str = '', type, exact = true) {

        const string = str.toLowerCase();

        const components = this.client.registry.components
            .filter((c) => type === 'any' ? ['command', 'setting'].includes(c.type) : c.type === type)
            .filter(exact ? filterExact(string) : filterInexact(string)) //eslint-disable-line no-use-before-define
            .array();

        return components || [];

    }

    componentsByTag(str, type = 'any', exact = true) {

        const key = str.toLowerCase();

        const components = this.client.registry.components
            .filter((c) => type === 'any' || c.type === type)
            .filter(exact ? (c) => c.tags.includes(key) : filterInexactTags(key))
            .array();
        
        return components || [];

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
        const truthy = [ 'on', 'true', 'yes', 'enable', 'y', 't' ];
        const falsey = [ 'off', 'false', 'no', 'disable', 'n', 'f' ];

        if(truthy.includes(input)) {
            return true;
        } else if (falsey.includes(input)) {
            return false;
        } 
        return null;
        
    }

    async list(list, options, args, resolver = null, strict = false, guild = null) {
        let [ method, ...changes ] = args;

        method = method.toLowerCase();
        const methods = {
            list: ['view', 'list', '?', 'show'],
            add: ['add', '+'],
            remove: ['remove', 'delete', '-'],
            set: ['set', '=']
        };

        if(resolver) {
            let results = resolver(changes, strict, guild);
            if(results instanceof Promise) results = await results;
            changes = results.map((r) => r.id || r);
        }
        
        if(methods.list.includes(method)) {
            return { list, method: 'list' };
        } else if(methods.add.includes(method)) {
            const added = [];
            for(const change of changes) {
                if(!options.includes(change)) continue;
                if(list.includes(change)) continue;
                
                list.push(change);
                added.push(change);
            }
            return { list, changed: added, method: 'add' };
        } else if(methods.remove.includes(method)) {
            const removed = [];
            for(const change of changes) {
                if(!list.includes(change)) continue;
            
                list.splice(list.indexOf(change), 1);
                removed.push(change);
            }
            return { list, changed: removed, method: 'remove' }; 
        } else if(methods.set.includes(method)) {
            return { list: changes, changed: changes, method: 'set' };
        }
        return null;
        
    }

    /**
     * Resolves methods used primarily for settings, also deals with appending the arguments into existing lists
     * TODO: Refactor to use an options object instead of an ungodly amount of args
     *
     * @param {Array<String>} args The incoming arguments with the first element being the method ex. ['add','ban','kick']
     * @param {Array<String>} valid An array of items to compare to, if an argument doesn't exist in this array it'll be skipped over
     * @param {Array<String>} [existing=[]] Existing values in the array, valid elements will be appended to or removed from this
     * @param {Function} resolver One of the resolver functions used to resolve the passed values into objects (should always be one of the mass resolvers due to the nature of this method, might break otherwise) NOTE: REMEMBER TO BIND 'this' ARG!
     * @param {Guild} guild The guild for the resolver to use when resolving
     * @param {Boolean} caseSensitive Whether or not to preserve case
     * @param {Array || String} [allowedMethods='all'] Which methods to allow to be resolved
     * @returns {Object}
     * @memberof Resolver
     */
    async resolveMethod(args, opts = {}) {

        // eslint-disable-next-line prefer-const
        let { valid, existing = [], resolver, guild, caseSensitive = false, allowedMethods = 'all' } = opts;

        const methods = {
            list: ['view', 'list', '?', 'show'],
            add: ['add', '+', 'create'],
            set: ['set', '='],
            remove: ['remove', 'delete', '-'],
            reset: ['clear', 'reset', 'default'],
            off: ['off', 'disable', 'false', 'no', 'n', 'f'],
            on: ['on', 'enable', 'true', 'yes', 'y', 't'],
            edit: ['edit', 'modify', 'change']
        };

        if(allowedMethods === 'all') allowedMethods = Object.keys(methods);

        if (!args.length) return false;
        // eslint-disable-next-line prefer-const
        let [method, ...rest] = args;
        method = method.toLowerCase();
        let resolved = [];

        if (!existing) existing = [];
        
        if (methods.reset.includes(method) && allowedMethods.includes('reset')) return { method: 'reset', result: [], changed: [], resolved };
        if (methods.off.includes(method) && allowedMethods.includes('off')) return { method: 'off' };
        if (methods.on.includes(method) && allowedMethods.includes('on')) return { method: 'on' };
        if (methods.edit.includes(method) && allowedMethods.includes('edit')) return { method: 'edit' };
        
        if (!rest.length) {
            if (methods.add.includes(method) && allowedMethods.includes('add')) return { method: 'add' };
            if (methods.remove.includes(method) && allowedMethods.includes('remove')) return { method: 'remove' };
            if (methods.set.includes(method) && allowedMethods.includes('set')) return { method: 'set' };
        }

        if (methods.list.includes(method) && allowedMethods.includes('list')) {

            if (resolver) resolved = await resolver(existing, false, guild);
            return { method: 'list', resolved };

        } else if (methods.add.includes(method) && allowedMethods.includes('add')) {

            const added = [];
            const failed = [];
            for (let elem of rest) {
                if (resolver) {
                    const _resolved = await resolver(elem, false, guild);
                    if (_resolved) {
                        if (!resolved.includes(_resolved[0])) resolved.push(_resolved[0]);
                        if (_resolved[0].id) elem = _resolved[0].id;
                    } else {
                        failed.push(elem);
                        continue;
                    }
                }

                if(!caseSensitive) elem = elem.toLowerCase();
                if (existing.includes(elem) || valid && !valid.includes(elem)) continue;

                added.push(elem);
                existing.push(elem);

            }

            return { rest, method: 'add', changed: added, result: existing, resolved, failed };

        } else if (methods.remove.includes(method) && allowedMethods.includes('remove')) {

            const removed = [];
            const failed = [];
            for (let elem of rest) {

                if (resolver) {
                    const _resolved = await resolver(elem, false, guild);
                    if (_resolved) {
                        if (!resolved.includes(_resolved[0])) resolved.push(_resolved[0]);
                        if (_resolved[0].id) elem = _resolved[0].id;
                    } else {
                        failed.push(elem);
                        //continue;
                    }
                }

                if (!caseSensitive) elem = elem.toLowerCase();
                if (!existing.includes(elem) || removed.includes(elem) || valid && !valid.includes(elem)) continue;
                removed.push(elem);
                existing.splice(existing.indexOf(elem), 1);

            }

            return { rest, method: 'remove', changed: removed, result: existing, resolved, failed };

        } else if (methods.set.includes(method) && allowedMethods.includes('set')) {

            const set = [];
            const failed = [];
            existing = set;
            for (let elem of rest) {

                if (resolver) {
                    const _resolved = await resolver(elem, false, guild);
                    if (_resolved) {
                        if (!resolved.includes(_resolved[0])) resolved.push(_resolved[0]);
                        elem = _resolved[0].id;
                    } else {
                        failed.push(elem);
                        continue;
                    }
                }

                if (!caseSensitive) elem = elem.toLowerCase();
                if (valid && !valid.includes(elem)) continue;
                set.push(elem);

            }

            return { rest, method: 'set', changed: set, result: existing, resolved, failed };

        }
        
        return false;

    }

    /**
     * Resolve an array of domains
     *
     * @param {Array<String>} [links=[]]
     * @memberof Resolver
     */
    async resolveDomains(links = []) {

        if (!(links instanceof Array)) links = [links];
        const resolved = [];
        const linkReg = /(https?:\/\/(www\.)?)?(([a-z0-9-]{1,63}\.)?([a-z0-9-]{2,63})(\.[a-z0-9-]{2,63})(\.[a-z0-9-]{2,63})?)/iu;
        const ipReg = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/u; //Very loose IP regex

        for (const link of links) {

            const match = link.match(linkReg);
            if (!match || !match[3]) continue;

            const [,,, domain] = match;
            
            if (ipReg.test(domain)) continue;
            const result = await this.validateDomain(domain);
            
            if (result) resolved.push(domain);

        }

        return resolved.length ? resolved : false;

    }

    validateDomain(domain) {
        return new Promise((resolve) => {
            dns.resolveAny(domain, (error) => {
                if (error) resolve(false);
                resolve(true);
            });
        });
    }

    /**
     * Resolve several user resolveables
     *
     * @param {Array<String>} [resolveables=[]] an array of user resolveables (name, id, tag)
     * @param {Boolean} [strict=false] whether or not to attempt resolving by partial usernames
     * @returns {Promise<Array<User>> || boolean} Array of resolved users or false if none were resolved
     * @memberof Resolver
     */
    async resolveUsers(resolveables = [], strict = false) {

        if(typeof resolveables === 'string') resolveables = [ resolveables ];
        if(resolveables.length === 0) return false;
        const { users } = this.client;
        const resolved = [];
        
        for(const resolveable of resolveables) {

            if((/<@!?([0-9]{17,21})>/u).test(resolveable)) {

                const [, id] = resolveable.match(/<@!?([0-9]{17,21})>/u);
                const user = await users.fetch(id).catch((err) => {
                    if(err.code === 10013) return false; 
                    // this.client.logger.warn(err); return false; 
 
                });
                if(user) resolved.push(user);

            } else if((/(id:)?([0-9]{17,21})/u).test(resolveable)) {

                const [,, id] = resolveable.match(/(id:)?([0-9]{17,21})/u);
                const user = await users.fetch(id).catch((err) => {
                    if(err.code === 10013) return false; 
                    // this.client.logger.warn(err); return false; 
 
                });
                if(user) resolved.push(user);

            } else if((/^@?([\S\s]{1,32})#([0-9]{4})/u).test(resolveable)) {

                const m = resolveable.match(/^@?([\S\s]{1,32})#([0-9]{4})/u);
                const username = m[1].toLowerCase();
                const discrim = m[2].toLowerCase();
                const user = users.cache.sort((a, b) => a.username.length - b.username.length).filter((u) => u.username.toLowerCase() === username && u.discriminator === discrim).first();
                if(user) resolved.push(user);

            } else if(!strict) {

                const name = resolveable.toLowerCase();
                const user = users.cache.sort((a, b) => a.username.length - b.username.length).filter((u) => u.username.toLowerCase().includes(name)).first();
                if(user) resolved.push(user);

            }

        }

        return resolved.length ? resolved : false;

    }

    async resolveUser(resolveable, strict) {

        if (!resolveable) return false;
        if (resolveable instanceof Array) throw new Error('Resolveable cannot be of type Array, use resolveUsers for resolving arrays of users');
        const result = await this.resolveUsers([ resolveable ], strict);
        return result ? result[0] : false;
        
    }

    /**
     * Resolve multiple member resolveables
     *
     * @param {Array<String>} [resolveables=[]] an array of member resolveables (name, nickname, tag, id)
     * @param {Boolean} [strict=false] whether or not to attempt resolving by partial matches
     * @param {Guild} guild the guild in which to look for members
     * @returns {Promise<Array<GuildMember>> || Promise<Boolean>} an array of resolved members or false if none were resolved
     * @memberof Resolver
     */
    async resolveMembers(resolveables = [], strict = false, guild = null) {

        if(typeof resolveables === 'string') resolveables = [ resolveables ];
        if(resolveables.length === 0) return false;
        if(!guild) return false;
        const { members } = guild;
        const resolved = [];

        for(const resolveable of resolveables) {

            if((/<@!?([0-9]{17,21})>/u).test(resolveable)) {

                const [, id] = resolveable.match(/<@!?([0-9]{17,21})>/u);
                const member = await members.fetch(id).catch((err) => {
                    if(err.code === 10007) return false; 
                    // this.client.logger.warn(err); return false; 
 
                });
                if(member) resolved.push(member);

            } else if((/(id:)?([0-9]{17,21})/u).test(resolveable)) {

                const [,, id] = resolveable.match(/(id:)?([0-9]{17,21})/u);
                const member = await members.fetch(id).catch((err) => {
                    if(err.code === 10007) return false; 
                    // this.client.logger.warn(err); return false; 
 
                });
                if(member) resolved.push(member);

            } else if((/^@?([\S\s]{1,32})#([0-9]{4})/u).test(resolveable)) {

                const m = resolveable.match(/^@?([\S\s]{1,32})#([0-9]{4})/u);
                const username = m[1].toLowerCase();
                const discrim = m[2].toLowerCase();
                const member = members.cache.filter((m) => m.user.username.toLowerCase() === username && m.user.discriminator === discrim).first();
                if(member) resolved.push(member);

            } else if((/^@?([\S\s]{1,32})/u).test(resolveable) && guild && !strict) {

                const nickname = resolveable.match(/^@?([\S\s]{1,32})/u)[0].toLowerCase();
                const member = members.cache.sort((a, b) => a.user.username.length - b.user.username.length).filter((m) => m && m.user && 
                        ((!m.nickname ? false : m.nickname.toLowerCase() === nickname) || 
                        (!m.nickname ? false : m.nickname.toLowerCase().includes(nickname)) || 
                        m.user.username.toLowerCase().includes(nickname) || 
                        m.user.username.toLowerCase() === nickname)).first();
                if(member) resolved.push(member);
          
            }

        }

        return resolved.length > 0 ? resolved : false;

    }

    async resolveMember(resolveable, strict, guild) {

        if (!resolveable) return false;
        if (resolveable instanceof Array) throw new Error('Resolveable cannot be of type Array, use resolveMembers for resolving arrays of members');
        const result = await this.resolveMembers([ resolveable ], strict, guild);
        return result ? result[0] : false;

    }

    /**
     * Resolve multiple channels
     *
     * @param {Array<String>} [resolveables=[]] an array of channel resolveables (name, id)
     * @param {Guild} guild the guild in which to look for channels
     * @param {Boolean} [strict=false] whether or not partial names are resolved
     * @param {Function} [filter=()] filter the resolving channels
     * @returns {Promise<Array<GuildChannel>> || Promise<Boolean>} an array of guild channels or false if none were resolved
     * @memberof Resolver
     */
    async resolveChannels(resolveables = [], strict = false, guild = null, filter = () => true) {

        if(typeof resolveables === 'string') resolveables = [ resolveables ];
        if(resolveables.length === 0) return false;
        if(!guild) return false;
        const CM = guild.channels;
        const resolved = [];

        for(const resolveable of resolveables) {

            const channel = CM.resolve(resolveable);
            if(channel && filter(channel)) {
                resolved.push(channel);
                continue;
            }

            const name = /^#?([a-z0-9\-_0]*)/iu;
            const id = /^<?#?([0-9]*)>?/iu;

            if (id.test(resolveable)) {

                const match = resolveable.match(id);
                const [, ch] = match;

                const channel = await this.client.channels.fetch(ch).catch((e) => {}); //eslint-disable-line no-empty, no-empty-function, no-unused-vars

                if (channel && filter(channel)) resolved.push(channel);

            } else if (name.test(resolveable)) {

                const match = resolveable.match(name);
                const ch = match[1].toLowerCase();
                
                const channel = CM.cache.sort((a, b) => a.name.length - b.name.length).filter(filter).filter((c) => {
                    if (!strict) return c.name.toLowerCase().includes(ch);
                    return c.name.toLowerCase() === ch;
                }).first();
 
                if(channel) resolved.push(channel);

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
     * @param {Array<String>} [resolveables=[]] an array of roles resolveables (name, id)
     * @param {Guild} guild the guild in which to look for roles
     * @param {Boolean} [strict=false] whether or not partial names are resolved
     * @returns {Promise<Array<Role>> || Promise<Boolean>} an array of roles or false if none were resolved
     * @memberof Resolver
     */
    async resolveRoles(resolveables = [], strict = false, guild = null) {

        if(typeof resolveables === 'string') resolveables = [ resolveables ];
        if(resolveables.length === 0) return false;
        if(!guild) return false;
        const { roles } = guild;
        const resolved = [];

        for(const resolveable of resolveables) {

            const id = /^(<@&)?([0-9]{16,22})>?/iu;

            if(id.test(resolveable)) {

                const match = resolveable.match(id);
                const [,, rId] = match;

                const role = await roles.fetch(rId).catch(this.client.logger.error);

                if(role) resolved.push(role);

            } else {

                const role = roles.cache.sort((a, b) => a.name.length - b.name.length).filter((r) => {
                    if(!strict) return r.name.toLowerCase().includes(resolveable.toLowerCase());
                    return r.name.toLowerCase() === resolveable.toLowerCase();
                }).first();

                if(role) resolved.push(role);

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
        } catch(err) {
            return null;
        }
        return time;
    }

    resolveDate(string) {
        let date = null;
        const matches = string.match(/([0-9]{4}(?:\/|-)[0-9]{2}(?:\/|-)[0-9]{2})/gimu); //YYYY-MM-DD is REQUIRED. 
        if(matches && matches.length > 0) {
            try {
                const string = matches[0].replace(/\//giu, '-');
                date = moment(string);
            } catch(error) {
                return null;
            }
        }
        return date;
    }

    resolveInfraction(string) {
        let infraction = null;
        for(const [ key, values ] of Object.entries(InfractionResolves)) {
            if(values.includes(string.toLowerCase())) {
                infraction = key;
                break;
            }
        }
        return infraction;
    }

    resolveInfractions(args = []) {
        const resolved = [];
        for(const arg of args) {
            const infraction = this.resolveInfraction(arg);
            if(infraction) resolved.push(infraction);
        }
        return resolved;
    }

    /**
     * Iterate through several arguments attempting to resolve them with the passed resolvers
     *
     * @param {Array<String>} [args=[]]
     * @param {Array<Function>} [resolvers=[]]
     * @param {Boolean} strict
     * @param {Guild} guild
     * @returns
     */
    async infinite(args = [], resolvers = [], strict, guild) {
        let parsed = [], //eslint-disable-line prefer-const
            parameters = [];

        if(resolvers.length === 0) return { parsed, parameters: args };

        for(let i = 0; i < args.length; i++) {
            const arg = args[i];
            let resolved = null;
            for(const resolver of resolvers) {
                if(resolved) break;
                resolved = resolver(arg, strict, guild);
                if(resolved instanceof Promise) resolved = await resolved;
            }
            if(resolved) {
                const ids = parsed.map((p) => p.id);
                if(!ids.includes(resolved.id)) parsed.push(resolved);
                continue;
            } else {
                parameters = args.splice(i);
                break;
            }
        }

        return { parsed, parameters };

    }
    
}

module.exports = Resolver;