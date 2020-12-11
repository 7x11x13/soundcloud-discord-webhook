const { Webhook, MessageBuilder } = require('discord-webhook-node');
const fs = require('fs');
const path = require('path');

exports.config = require('./cfg/config.json');

exports.last_updated = new Date(
    require('./cfg/last_updated.json').last_updated
);

exports.reloadConfig = () => {
    delete require.cache[require.resolve('./cfg/config.json')];
    module.exports.config = require('./cfg/config.json');
};

exports.saveConfig = () => {
    fs.writeFileSync(
        path.join(__dirname, './cfg/config.json'),
        JSON.stringify(module.exports.config, null, 4),
        (err) => {
            if (err) throw err;
        }
    );
};

exports.saveCurrentTime = () => {
    module.exports.last_updated = new Date();
    fs.writeFileSync(
        path.join(__dirname, './cfg/last_updated.json'),
        JSON.stringify({ last_updated: module.exports.last_updated }, null, 4),
        (err) => {
            if (err) throw err;
        }
    );
};

exports.sendSongToWebhooks = (song) => {
    for (const webhook of module.exports.config.webhooks) {
        const hook = new Webhook(webhook.url);
        hook.setUsername(webhook.username);
        hook.setAvatar(webhook.avatar);
        const embed = new MessageBuilder()
            .setTitle(song.title)
            .setAuthor(
                song.user.username,
                song.user.avatar_url,
                song.user.permalink_url
            )
            .setImage(song.artwork_url)
            .setDescription(song.description)
            .setTimestamp(new Date(song.created_at))
            .setURL(song.permalink_url);
        hook.send(embed).catch(console.error);
    }
};
