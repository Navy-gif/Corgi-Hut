const snoowrap = require('snoowrap');

module.exports = class Reddit {

    constructor(client, config) {

        this.client = client;
        this.api = new snoowrap({
            userAgent: 'user-script',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken
        });
        this.client.logger.log('Reddit utility ready.');

    }

    randomPost(subreddit = 'all') {

        return this.api.getSubreddit(subreddit).getRandomSubmission();

    }

};