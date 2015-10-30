var args = process.argv.slice(2);
if (! args.length) { console.log("You must supply an AUTH_TOKEN to run this script."); process.exit(1); }
var isPostseason = args[1] == "postseason";
var http = require('http');
var Firebase = require('firebase');
var fbRef = new Firebase('https://nfl-liveupdate.firebaseIO.com/');
const AUTH_TOKEN = args[0];
var url = isPostseason
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
