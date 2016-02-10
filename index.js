var Botkit = require('botkit');


var controller = Botkit.slackbot({
  json_file_store: './db/'
}).configureSlackApp(
  {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['incoming-webhook']
  }
);

controller.setupWebserver(process.env.PORT || 5000, function (err, webserver) {

  controller.createWebhookEndpoints(webserver);

  webserver.get('/', function (req, res) {

    var html = '<h1>Super Insecure Form</h1><p>Put text below and hit send - it will be sent to every team who has added your integration.</p><form method="post" action="/unsafe_endpoint"><input type="text" name="text" /><input type="submit"/></form>';
    res.send(html);

  });

  // This is a completely insecure form which would enable
  // anyone on the internet who found your node app to
  // broadcast to all teams who have added your integration.
  // it is included for demonstration purposes only!!!
  webserver.post('/unsafe_endpoint', function (req, res) {
    var text = req.body.text;
    text = text.trim();

    controller.storage.teams.all(function (err, teams) {
      var count = 0;
      for (var t in teams) {
        if (teams[t].incoming_webhook) {
          count++;
          controller.spawn(teams[t]).sendWebhook({
            text: text
          }, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }
      }

      res.send('Message sent to ' + count + ' teams!');
    });
  });

  controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });


});

controller.on('slash_command',function(bot, message) {

  // reply to slash command
  bot.replyPublic(message, 'Everyone can see the results of this slash command');
});



controller.on('create_incoming_webhook', function (bot, webhook_config) {
  bot.sendWebhook({
    text: ':thumbsup: Incoming webhook successfully configured'
  });
});


function generateAcronym() {
   // We can extend this later to accomodate different character ranges.
  return generateAcronymRange(3,4);
}

function generateAcronymRange(minLetters, maxLetters) {

  // Default character set for English.
  baseStr = "AAAAAAAAAABBBBBCCCCCDDDDEEFFFFGGGGHHHHHHHIIIJJKLLLLMMMMNNNNOOOOPPPPQRRSSSSSSSTTTTTTTTTTUVWWWWWXYYZL";
  word = "";

  numLetters = Math.round(Math.random() * (maxLetters - minLetters)) + minLetters;
  for (i = 0; i < numLetters; i++)
  {
    letterIndex = Math.floor(Math.random() * baseStr.length);
    word = word + baseStr[letterIndex] + ".";
  }
  console.log('Acronym generated: ' + word);
  return word;
}

