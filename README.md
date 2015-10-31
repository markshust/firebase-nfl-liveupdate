# markoshust/firebase-nfl-liveupdate

This script runs an infinite loop that updates the Firebase <a href="https://nfl-liveupdate.firebaseio.com/" target="_blank">https://nfl-liveupdate.firebaseio.com/</a> with the current live scores from NFL.com's official liveupdate scorestrip feed.

## Demo

Visit <a href="https://nfl-liveupdate.firebaseio.com/.json">https://nfl-liveupdate.firebaseio.com/.json</a> for sample JSON format.

## Usage

Replace `token` with your Firebase Auth Token.

- Regular Season: `FIREBASE_AUTH_TOKEN=token node index.js`
- Postseason: `FIREBASE_AUTH_TOKEN=token node index.js postseason`
