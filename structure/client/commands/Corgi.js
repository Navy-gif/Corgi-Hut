const { Command } = require('../../interfaces');
const fs = require('fs');

const offset = 10 * 60 * 60 * 1000;

module.exports = class CorgiCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'dog',
            aliases: ['corgi', 'shibe', 'corg', 'shib', 'shiba']
        });

        this.corgiSubs = ['corgi', 'babycorgis', 'corgigifs', 'babycorgis'];
        this.shibeSubs = ['shiba'];

    }

    async run(message) {

        const { reddit } = this.client;
        let result = null,
            sub = null,
            temp = null;

        switch (message._caller) {
            case 'corgi':
            case 'corg':
                sub = this.corgiSubs[Math.floor(Math.random() * (this.corgiSubs.length - 1))];
                break;
            case 'shibe':
            case 'shib':
            case 'shiba':
                // eslint-disable-next-line prefer-destructuring
                sub = this.shibeSubs[0]; //this.corgiSubs[Math.floor(Math.random() * (this.corgiSubs.length - 1))];
                break;
            default:
                temp = [...this.shibeSubs, ...this.corgiSubs];
                sub = temp[Math.floor(Math.random() * (temp.length - 1))];
        }
        //const fails = [];
        
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
            message.respond(`Errored:\n${err}`);
            return;
        }

        //console.log(result);
        //console.log(Object.keys(result));
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

        const send = { embed: em };
        if (result.domain === 'gfycat.com') send.content = result.domain;
        message.respond(send);

    }

};