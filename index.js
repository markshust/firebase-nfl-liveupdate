const args = process.argv.slice(2);
if (! args.length) { console.log("You must supply an AUTH_TOKEN to run this script."); process.exit(1); }
const isPostseason = args[1] == "postseason";
const http = require('http');
const Firebase = require('firebase');
const fbRef = new Firebase('https://nfl-liveupdate.firebaseIO.com/');
const AUTH_TOKEN = args[0];
const url = isPostseason
  ? 'http://www.nfl.com/liveupdate/scorestrip/postseason/scorestrip.json'
  : 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json';
const scoreIn1 = isPostseason ? 7 : 5;
const scoreIn2 = isPostseason ? 9 : 7;
var i = 1;
var lastJson = {};

fbRef.authWithCustomToken(AUTH_TOKEN, function(err, res) {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    fbRef.set({});
    liveupdate();
  }
});

function liveupdate() {
  http.get(url, function(res) {
    var json = '';

    res.on('data', function(chunk) {
      json += chunk;
    });

    res.on('end', function() {
      cleanseJson(json);
      
      // Save returned data to Firebase
      fbRef.set(lastJson);
      console.log(i + ': updated');

      i++;
      liveupdate();
    });
  });
}

function cleanseJson(json) {
  // Clean up a sloppy API format
  json = json.replace(/,,/g, ',"",').replace(/,,/g, ',"",');

  // Let's get this into JSON
  json = JSON.parse(json).ss;
  
  if (! lastJson.length) lastJson = json;

  // Make sure new score is equal to or greater than stored score;
  // we need this as the feed is load balanced, and NFL's servers
  // don't all read from same source.
  for (var i = 0; i < json.length; i++) {
    if (lastJson[i][scoreIn1] >= json[i][scoreIn1]) {
      json[i][scoreIn1] = lastJson[i][scoreIn1];
    }

    if (lastJson[i][scoreIn2] >= json[i][scoreIn2]) {
      json[i][scoreIn2] = lastJson[i][scoreIn2];
    }
  }

  lastJson = json;
}

/**
 * JSON indexes
 * 
 * Regular Season
 *  0 => Day of week
 *  1 => Time of game start
 *  2 => Quarter (1, 2, 3, 4, Halftime, Final, Pregame OR final overtime)
 *  3 => Current time
 *  4 => Visiting Team Abbreviation
 *  5 => Visiting Team Score
 *  6 => Home Team Abbreviation
 *  7 => Home Team Score
 *  8 => UNKNOWN
 *  9 => UNKNOWN
 * 10 => Game Identifier
 * 11 => UNKNOWN
 * 12 => Week Identifier
 * 13 => Year
 *
 * Postseason
 *  0 => Day of week
 *  1 => Time
 *  2 => Quarter (1, 2, 3, 4, Halftime, Final, Pregame OR final overtime)
 *  3 => UNKNOWN
 *  4 => Visiting Team Full Name
 *  5 => Visiting Team Abbreviation
 *  6 => Visiting Team Score
 *  7 => Home Team Full Name
 *  8 => Home Team Abbreviation
 *  9 => Home Team Score
 * 10 => UNKNOWN
 * 11 => UNKNOWN
 * 12 => Game Identifier
 * 13 => UNKNOWN
 * 14 => TV Network
 * 15 => Week Identifier
 * 16 => Year
 */
