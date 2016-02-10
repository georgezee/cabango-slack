var acronym = require('./acronym');
var async = require('async');

var Game = function () {
  this.state = 'created';
  this.guesses = {};
  this.votes = {};
};

Game.prototype.startGame = function (controller) {
  controller.storage.teams.all(function (err, teams) {
    for (var t in teams) {
      if (teams[t].incoming_webhook) {
        async.series([
          function (callback) {
            sendMessage(controller, teams[t], 'New Game starting...', callback)
          },
          function (callback) {
            sendMessage(controller, teams[t], acronym.generateAcronym(), callback)
          }
        ]);

        this.guesses = {};
        this.state = 'guessing';

        setTimeout(function () {
          sendMessage(controller, teams[t], 'Choose Best Answer: ', function () {
            async.forEachOfSeries(this.guesses, function (guess, user, callback) {
              var message = user + ' - ' + guess;
              sendMessage(controller, teams[t], message, callback);
            })
          }.bind(this));

          this.state = 'voting';

          setTimeout(function () {
            sendMessage(controller, teams[t], 'Winner: First Answer');

          }.bind(this), 45000)
        }.bind(this), 60000);
      }
    }
  }.bind(this));
};

Game.prototype.addGuess = function (user, guess) {
  if (this.state === 'guessing') {
    this.guesses[user] = guess;
    this.votes[user] = 0;
  }
};

Game.prototype.addVote = function (user) {
  if (this.state === 'voting') {
    this.votes[user]++;
  }
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
