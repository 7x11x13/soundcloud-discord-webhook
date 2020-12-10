const soundcloud = require('soundcloud-scraper');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const fs = require('fs');
const path = require('path');
let config = require('./cfg/config.json');
let last_updated = new Date(require('./cfg/last_updated.json').last_updated);
const client = new soundcloud.Client();

function reloadConfig() {
    delete require.cache[require.resolve('./cfg/config.json')];
    config = require('./cfg/config.json');
}

function saveCurrentTime() {
    last_updated = new Date();
    fs.writeFileSync(
        path.join(__dirname, './cfg/last_updated.json'),
        JSON.stringify({ last_updated: last_updated }, null, 4),
        (err) => {
            if (err) console.error(err);
        }
    );
}

function sendSongToWebhook(song) {
    for (const webhook of config.webhooks) {
        const hook = new Webhook(webhook.url);
        hook.setUsername(webhook.username);
        hook.setAvatar(webhook.avatar);
        const embed = new MessageBuilder()
            .setTitle(song.title)
            .setAuthor(song.author.name, song.author.avatarURL, song.author.url)
            .setImage(song.thumbnail)
            .setDescription(song.description)
            .setTimestamp(song.publishedAt)
            .setURL(song.url);
        hook.send(embed);
    }
}

function update() {
    reloadConfig();
    if (typeof last_updated.getTime != 'function') {
        saveCurrentTime();
        setTimeout(update, config.min_interval * 1000);
        return;
    }
    for (const username of config.usernames) {
        client
            .getUser(username)
            .then(async (userinfo) => {
                for (const track of userinfo.tracks) {
                    if (track.publishedAt.getTime() >= last_updated.getTime()) {
                        client
                            .getSongInfo(track.url)
                            .then(async (songinfo) => {
                                sendSongToWebhook(songinfo);
                            })
                            .catch(console.error);
                    }
                }
            })
            .catch(console.error);
    }
    setTimeout(
        update,
        Math.max(
            0,
            config.min_interval * 1000 -
                (new Date().getTime() - last_updated.getTime())
        )
    );
    saveCurrentTime();
}

update();
