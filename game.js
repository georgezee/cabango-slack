var acronym = require('./acronym');
var async = require('async');

var Game = function (controller) {
  this.state = 'created';
  this.controller = controller;
};

Game.prototype.startGame = function () {
  this.controller.storage.teams.all(function (err, teams) {
    for (var t in teams) {
      if (teams[t].incoming_webhook) {
        async.series([
          function (callback) {
            sendMessage(teams[t], 'New Game starting...', callback)
          },
          function (callback) {
            sendMessage(teams[t], acronym.generateAcronym(), callback)
          }
        ]);
        this.state = 'guessing';

        setTimeout(function () {
          async.series([
            function (callback) {
              sendMessage(teams[t], 'Choose Best Answer: ', callback);
            },
            function (callback) {
              sendMessage(teams[t], '1. First Answer', callback);
            },
            function (callback) {
              sendMessage(teams[t], '2. Second Answer', callback);
            }
          ]);
          this.state = 'voting';

          setTimeout(function () {
            sendMessage(teams[t], 'Winner: First Answer');

          }.bind(this), 45000)
        }.bind(this), 60000);
      }
    }
  }.bind(this));
};

function sendMessage (controller, team, message, callback) {
  if (team.incoming_webhook) {
    controller.spawn(team).sendWebhook({
      text: message
    }, function (err) {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        callback();
      }
    });
  }
}


module.exports = Game;
