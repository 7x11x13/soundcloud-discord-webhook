# soundcloud-discord-webhook

Node.js app to send recently uploaded tracks from SoundCloud artists to Discord webhooks.

## Setup

Install the dependencies

```bash
npm install
```
Edit the config file in `./src/cfg/config.json`

#### Config Settings
- `min_interval` - The minimum time (in seconds) between scanning all SoundCloud pages. It can take longer depending on how many artist pages it has to scan.
- `webhooks` - The Discord webhooks it sends the information to.
- `usernames` - The SoundCloud artists to scan for uploads.

## Run the script

```bash
npm start
```