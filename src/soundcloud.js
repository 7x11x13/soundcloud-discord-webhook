const fetch = require('node-fetch').default;
const utils = require('./utils');

const USER_ID_REGEX = /"soundcloud:\/\/users:(?<userid>\d+)"/;
const CLIENT_ID_SCRIPT_REGEX = /https:\/\/a-v2\.sndcdn\.com\/assets\/\d+-[\dabcdef]+-\d+\.js/g;
const CLIENT_ID_REGEX = /client_id:"(?<client_id>[\da-zA-Z]+)"/;

const USER_ID_CACHE = new Map();

async function loadPage(url) {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Status ${response.status} trying to fetch ${url}`);
    return response;
}

async function getClientIDFromScript(url) {
    const response = await loadPage(url);
    const data = await response.text();
    const match = CLIENT_ID_REGEX.exec(data);
    if (match === null || match.groups === undefined) return undefined;
    return match.groups['client_id'];
}

exports.getClientID = async () => {
    if (utils.config.client_id != undefined && utils.config.client_id != '')
        return;
    const url = 'https://soundcloud.com/';
    const response = await loadPage(url);
    const data = await response.text();
    const found = data.match(CLIENT_ID_SCRIPT_REGEX);
    for (const match of found) {
        const client_id = await getClientIDFromScript(match);
        if (client_id != undefined) {
            utils.config.client_id = client_id;
            utils.saveConfig();
            return;
        }
    }
    throw new Error('Could not get a client_id');
};

async function getUserID(username) {
    if (username in USER_ID_CACHE) return USER_ID_CACHE[username];
    const url = `https://soundcloud.com/${username}`;
    const response = await loadPage(url);
    const data = await response.text();
    const match = USER_ID_REGEX.exec(data);
    if (match === null || match.groups === undefined)
        throw new Error(`Could not find User ID for username ${username}`);
    const id = match.groups['userid'];
    USER_ID_CACHE[username] = id;
    return id;
}

async function getTracksAfterDateUserID(userid, date, limit, client_id) {
    if (utils.config.client_id === undefined || utils.config.client_id === '') {
        throw new Error('No client_id found');
    }
    if (typeof date.toISOString != 'function')
        throw new Error('date must be a Date object');
    const url = `https://api-v2.soundcloud.com/users/${userid}/tracks?limit=${limit}&client_id=${client_id}`;
    const response = await loadPage(url);
    const data = await response.json();
    const tracks = data.collection;
    if (tracks == undefined) return [];
    return tracks.filter(
        (track) => new Date(track.created_at).getTime() >= date.getTime()
    );
}

exports.getTracksAfterDate = async (username, date, client_id) => {
    const id = await getUserID(username);
    return await getTracksAfterDateUserID(id, date, 25, client_id);
};
