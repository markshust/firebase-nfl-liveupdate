require('dotenv').config({silent: true});

if (! process.env.FIREBASE_AUTH_TOKEN) {
  console.log('You must supply FIREBASE_AUTH_TOKEN to run this script.');
  process.exit(1);
}

const args = process.argv.slice(2);
const isPostseason = args[0] == 'postseason';
const url = isPostseason
  ? 'http://www.nfl.com/liveupdate/scorestrip/postseason/scorestrip.json'
  : 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json';
const http = require('http');
const _ = require('lodash');
const Firebase = require('firebase');
const fbRef = new Firebase('https://nfl-liveupdate.firebaseIO.com/');
const delayBetweenApiCalls = 200;
var recordCount = 1;
var lastJson = {};
var justUpdated = [];

fbRef.authWithCustomToken(process.env.FIREBASE_AUTH_TOKEN, function(err, res) {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    console.log('Listening for updates...');
    liveupdate();
  }
});

function liveupdate() {
  http.get(url, function(res) {
    var jsonStr = '';

    res.on('data', function(chunk) {
      jsonStr += chunk;
    });

    res.on('end', function() {
      lastJson = reformatJson(jsonStr);

      // Save returned data to Firebase
      fbRef.set(lastJson);
      console.log(recordCount + ' fetched API result');

      recordCount++;

      setTimeout(function() {
        liveupdate();
      }, delayBetweenApiCalls);
    });
  }).on('error', function(e) {
    console.log('Error: ' + e.message);
  });
}

/**
 * Let's get this JSON into our own (better) readable format.
 */
function reformatJson(jsonStr) {
  var newJson = {};

  // Clean up sloppy JSON format
  jsonStr = jsonStr.replace(/,,/g, ',"",').replace(/,,/g, ',"",');

  // Convert to JSON object
  try {
    var json = JSON.parse(jsonStr);
  } catch(e) {
    console.log('Error: ' + jsonStr + ' cannot be parse as JSON');
  }

  // `ss` prop contains all data
  if (json && 'ss' in json) {
    json = json.ss;

    for (var i = 0; i < json.length; i++) {
      var gameId = isPostseason ? json[i][12] : json[i][10];

      if (justUpdated.indexOf(gameId) != -1) {
        newJson[gameId] = lastJson[gameId];
      } else {
        var day = json[i][0];
        var startTime = json[i][1];
        var quarter = getQuarter(json[i], gameId);
        var awayTeam = isPostseason ? json[i][5] : json[i][4];
        var homeTeam = isPostseason ? json[i][8] : json[i][6];
        var awayScore = getAwayScore(json[i], gameId);
        var homeScore = getHomeScore(json[i], gameId);
        var week = isPostseason ? json[i][15] : json[i][12];
        var year = isPostseason ? json[i][16] : json[i][13];

        newJson[gameId] = {
          day: day,
          start_time: startTime,
          quarter: quarter,
          away_team: awayTeam,
          home_team: homeTeam,
          away_score: awayScore,
          home_score: homeScore,
          week: week,
          year: year
        };
      }
    }
  }

  return newJson;
}

function getAwayScore(json, gameId) {
  var score = isPostseason ? json[6] : json[5];

  if (score == '') score = 0;

  if (! _.isEmpty(lastJson)
    && lastJson[gameId]
    && score != lastJson[gameId]['away_score']
  ) {
    justUpdatedTimeout(gameId);
  }

  return parseInt(score);
}

function getHomeScore(json, gameId) {
  var score = isPostseason ? json[9] : json[7];

  if (score == '') score = 0;

  if (! _.isEmpty(lastJson)
    && lastJson[gameId]
    && score != lastJson[gameId]['home_score']
  ) {
    justUpdatedTimeout(gameId);
  }

  return parseInt(score);
}

function getQuarter(json, gameId) {
  var quarter = json[2];

  switch (quarter) {
    case '1': case '2': case '3': case '4': break;
    case 'Halftime':                        quarter = 'H'; break;
    case 'Final': case 'final overtime':    quarter = 'F'; break;
    case 'Pregame':                         quarter = 'P'; break;
    default:                                quarter = 'O'; break;
  }

  if (! _.isEmpty(lastJson)
    && lastJson[gameId]
    && quarter != lastJson[gameId]['quarter']
  ) {
    justUpdatedTimeout(gameId);
  }

  return quarter;
}

/**
 * This will prevent the game score from being updated again for a few seconds.
 * This avoids issues with rotating load balancers not being fully synced.
 */
function justUpdatedTimeout(gameId) {
  if (justUpdated.indexOf(gameId) != -1) {
    return;
  }

  justUpdated.push(gameId);

  console.log('Game just updated!');
  console.log(lastJson[gameId]);

  setTimeout(function() {
    _.pull(justUpdated, gameId);
  }, 15000);
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
 *  1 => Time of game start
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

