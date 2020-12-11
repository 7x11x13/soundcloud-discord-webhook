const utils = require('./utils');
const soundcloud = require('./soundcloud');
const allSettled = require('promise.allsettled');

async function sendNewTracksToWebhooks(username) {
    soundcloud
        .getTracksAfterDate(
            username,
            utils.last_updated,
            utils.config.client_id
        )
        .then((tracks) => {
            for (const song of tracks) {
                try {
                    utils.sendSongToWebhooks(song);
                } catch (err) {
                    console.error(err);
                }
            }
        })
        .catch(console.error);
}

function update() {
    utils.reloadConfig();
    if (typeof utils.last_updated.getTime != 'function') {
        utils.saveCurrentTime();
        setTimeout(update, utils.config.min_interval * 1000);
        return;
    }

    soundcloud
        .getClientID()
        .then(() => {
            allSettled(
                utils.config.usernames.map(sendNewTracksToWebhooks)
            ).then((results) => {
                results
                    .filter((r) => r.status === 'rejected')
                    .map((r) => console.error(r.reason));
                setTimeout(
                    update,
                    Math.max(
                        0,
                        utils.config.min_interval * 1000 -
                            (new Date().getTime() -
                                utils.last_updated.getTime())
                    )
                );
                utils.saveCurrentTime();
            });
        })
        .catch(console.error);
}

if (require.main === module) update();
