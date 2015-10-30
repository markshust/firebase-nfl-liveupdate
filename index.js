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
var i = 1;

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
      // Clean up a sloppy API format
      json = json.replace(/,,/g, ',"",').replace(/,,/g, ',"",');
      // Let's get this into JSON
      json = JSON.parse(json).ss;

      // Save returned data to Firebase
      fbRef.set(json);
      console.log(i + ': updated');

      i++;
      liveupdate();
    });
  });
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
