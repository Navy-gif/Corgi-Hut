/* eslint-disable no-console */
const fs = require('fs');

const DEFAULT_CONFIG = {
    "token": "BOT TOKEN HERE",
    "clientOptions": {

    },
    "prefix": "c!",
    "logging": {
        "webhook": {
            "id": "ERROR LOG WEBHOOK ID",
            "token": "ERROR LOG WEBHOOK TOKEN"
        }
    },
    "reddit": {
        "clientId": "REPLACE ME IF YOU USE THE REDDIT FEATURES",
        "clientSecret": "REPLACE ME IF YOU USE THE REDDIT FEATURES",
        "refreshToken": "REPLACE ME IF YOU USE THE REDDIT FEATURES",
        "accessToken": "REPLACE ME IF YOU USE THE REDDIT FEATURES"
    }
};

const DEFAULT_SETTINGS = {

};

if (!fs.existsSync('./config.json')) {
    console.log('Config file doesn\'t exist, creating...');
    fs.writeFileSync('./config.json', JSON.stringify(DEFAULT_CONFIG));
} else console.log('Config file exists already.');

if (!fs.existsSync('./settings.json')) {
    console.log('Settings file doesn\'t exist, creating...');
    fs.writeFileSync('./settings.json', JSON.stringify(DEFAULT_SETTINGS));
} else console.log('Settings file exists already.');

console.log('Done, make sure to enter the proper configurations');