const utils = require('./utils');
const soundcloud = require('./soundcloud');
const allSettled = require('promise.allsettled');

async function sendNewTracksToWebhooks(username) {
    const songs = await soundcloud.getTracksAfterDate(
        username,
        utils.last_updated,
        utils.config.client_id
    );
    utils.sendSongsToWebhooks(songs);
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
            allSettled(utils.config.usernames.map(sendNewTracksToWebhooks))
                .then((results) => {
                    const failed = results.filter(
                        (r) => r.status === 'rejected'
                    );
                    failed.map((r) => console.error(new Date(), r.reason));
                    if (failed.length != results.length) {
                        utils
                            .saveCurrentTime()
                            .then(() => {
                                setTimeout(
                                    update,
                                    Math.max(
                                        0,
                                        utils.config.min_interval * 1000 -
                                            (new Date().getTime() -
                                                utils.last_updated.getTime())
                                    )
                                );
                            })
                            .catch(console.error);
                    } else {
                        // if every request fails, we shouldn't update the last checked time
                        // check again after min_interval
                        setTimeout(update, utils.config.min_interval * 1000);
                    }
                })
                .catch(console.error);
        })
        .catch(console.error);
}

update();
