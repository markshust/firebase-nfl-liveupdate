# markoshust/firebase-nfl-liveupdate

This script runs on an infinite loop and updates the Firebase `https://nfl-liveupdate.firebaseIO.com/` with the current live scores from NFL.com's official liveupdate scorestrip feed.

## Usage

- Regular Season: `node index.js FIREBASE_AUTH_TOKEN`
- Postseason: `node index.js FIREBASE_AUTH_TOKEN postseason`
