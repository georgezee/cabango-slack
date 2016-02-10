var Botkit = require('botkit');
var game = require('./game');


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

  //setInterval(function () {
  //  game.startGame(controller);
  //}, 10000);

  controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });


});

controller.on('slash_command',function(bot, message) {
  console.log(message);
  bot.replyPublic(message, 'Command: ' + mesage.command + ' Message: ' + message.text);
});


controller.on('create_incoming_webhook', function (bot, webhook_config) {
  bot.sendWebhook({
    text: ':thumbsup: Incoming webhook successfully configured'
  });
});

