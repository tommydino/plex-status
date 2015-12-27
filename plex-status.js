/*
Install nodejs
create directory with this file in it and run the following commands:
npm install wreck@7.0.0 lodash@3.10.1

Setup with crontab:
* * * * * /usr/bin/node /home/dirrk/scripts/plex-info/plex-status.js >> /var/log/plex/plexstatus.log 2>/dev/null

Setup splunk to consume json with timestamp from utc on timestamp field

Example dashboard: http://imgur.com/E5jBA7S
*/


var wreck = require('wreck'),
    _ = require('lodash');

var options = {
    json: true,
    headers: {
        Accept: 'application/json'
    }
};

wreck.get('http://localhost:32400/status/sessions', options, function (err, response, payload) {

    var timestamp = new Date().toISOString();

    if (err || response.statusCode !== 200) {
        process.exit();
    }

    payload._children.forEach(function (child) {
        var output = {};

        output.timestamp = timestamp;
        output.title = child.title;
        output.plexId = child.ratingKey;
        output.plexType = child.type;

        if (child.type === 'episode') {
          output.show = child.grandparentTitle;
          output.season = child.parentIndex.toString();
	        output.episode = child.index.toString();
        }

      	var user = _.findWhere(child._children, { _elementType: 'User' });

        if (user) {
          output.user = user.title;
          output.userId = user.id;
        }

      	var player = _.findWhere(child._children, { _elementType: 'Player' });

        if (player) {
          output.platform = player.platform;
          output.player = player.title;
          output.status = player.state;
        }

      	var transcode = _.findWhere(child._children, { _elementType: 'TranscodeSession' });

        if (transcode) {
          output.video_transcoding = transcode.videoDecision;
          output.audio_transcoding = transcode.audioDecision;

          output.throttled = transcode.throttled;
          output.progress = Math.floor(transcode.progress);
          output.videoCodec = transcode.videoCodec;
          output.audioCodec = transcode.audioCodec;
        }

      	var media = _.findWhere(child._children, { _elementType: 'Media' });

        if (media) {
          output.container = media.container;
        	output.resolution = media.videoResolution;

        	media = _.first(media._children) || { file: 'unknown' };
        	output.file = media.file;
        }

      	console.log(JSON.stringify(output));
    });
});
