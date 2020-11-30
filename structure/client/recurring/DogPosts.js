const { Recurring } = require('../../interfaces');
const offset = 10 * 60 * 60 * 1000;

module.exports = class DogPosts extends Recurring {

    constructor(client) {

        super(client, {
            name: 'dogPosts',
            interval: 10
        });

        this.channel = null;

    }

    async execute() {

        if (!this.client.settings[this.name].channel) return;
        if (!this.channel) this.channel = await this.client.resolveChannel(this.client.settings[this.name].channel);

        this.client.logger.debug('Attempting to send dog post');
        const { sources } = this.client.settings[this.name];
        const { reddit } = this.client;
        const sub = sources[Math.floor(Math.random() * (sources.length - 1))];
        let result = null;
        //console.log(sub)
        //console.log(this.channel)

        try {
            let count = 0;
            do {
                //if (count > 0) fails.push(result);
                count++;
                result = await reddit.randomPost(sub);
                if (result.crosspost_parent_list) [result] = result.crosspost_parent_list;
                //console.log(count);
            } while (!['image', 'rich:video', 'hosted:video'].includes(result.post_hint) && count < 5);
        } catch (err) {
            this.channel.send(`Errored:\n${err}`);
            return;
        }

        //console.log(result)

        const em = {
            title: result.title,
            color: 16756735,
            url: `https://reddit.com${result.permalink}`,
            footer: {
                text: `Score: ${result.ups}`
            },
            timestamp: new Date(result.created * 1000 - offset)
        };

        if (result.post_hint === 'hosted:video') {
            em.description = `[This post is a video, may not work in the embed.](${result.media.reddit_video.fallback_url})`;
            em.video = {
                url: result.media.reddit_video.fallback_url
            };
        } else {
            em.image = {
                url: result.url
            };
        }

        if (result.selftext.length) em.description = result.selftext;
        //fails.push(result);

        //fs.writeFileSync('./failedPosts.json', JSON.stringify(fails));
        //console.log(em)
        const send = { embed: em };
        if (['youtube.com', 'gfycat.com'].includes(result.domain)) {
            send.content = result.url;
            send.embed = null;
        }

        const missing = this.channel.permissionsFor(this.client.guild.me).missing(['SEND_MESSAGES', 'EMBED_LINKS']);
        if (missing.length) return this.client.logger.debug(`Missing perms to send dog post: ${missing}`);
        this.channel.send(send);

    }

};