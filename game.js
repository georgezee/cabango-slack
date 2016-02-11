var acronym = require('./acronym');
var async = require('async');
var _ = require('lodash');

var Game = function (controller) {
  this.state = 'created';
  this.guesses = {};
  this.votes = {};
  this.gameInterval = null;
  this.controller = controller;
};


Game.prototype.startGame = function () {
  this.startRound();

  this.gameInterval = setInterval(function () {
    if (this.state === 'finished') {
      this.state = 'starting';
      this.startRound();
    }
  }.bind(this), 1000);
};

Game.prototype.stopGame = function () {
  if (this.gameInterval) {
    clearInterval(this.gameInterval);
  }
};

Game.prototype.startRound = function () {
  var controller = this.controller;
  this.votes = {};
  this.guesses = {};

  controller.storage.teams.all(function (err, teams) {
    for (var t in teams) {
      if (teams[t].incoming_webhook) {
        // TODO: Find a better way than calling send message multiple times
        async.series([
          function (callback) {
            sendMessage(controller, teams[t], 'New round starting...', callback)
          },
          function (callback) {
            sendMessage(controller, teams[t], acronym.generateAcronym(), callback)
          }
        ]);

        this.startGuessingPhase(teams[t], function () {
          this.startVotingPhase(teams[t]);
        }.bind(this));
      }
    }
  }.bind(this));
};

Game.prototype.startGuessingPhase = function (team, callback) {
  var controller = this.controller;
  this.state = 'guessing';

  setTimeout(function () {
    sendMessage(controller, team, 'Choose Best Answer: ', function () {
      console.log('Guesses', this.guesses);

      async.forEachOfSeries(this.guesses, function (guess, user, cb) {
        var message = user + ' - ' + guess;
        console.log(message);
        sendMessage(controller, team, message, cb);
      }, callback);
    }.bind(this));

  }.bind(this), 60000);

};

Game.prototype.startVotingPhase = function (team) {
  var controller = this.controller;
  this.state = 'voting';

  setTimeout(function () {
    if (!_.isEmpty(this.votes)) {
      var pairs = _.toPairs(this.votes);
      var winner = _.maxBy(pairs, function (score) {
        return score[1];
      })[0];

      sendMessage(controller, team, 'Winner: ' + winner, function () {
        console.log('Finished');
        this.state = 'finished';
      }.bind(this));
    } else {
      sendMessage(controller, team, 'No Votes :(', function () {
        console.log('Finished');
        this.state = 'finished';
      }.bind(this));
    }
  }.bind(this), 45000)
};

Game.prototype.addGuess = function (user, guess) {
  if (this.state === 'guessing') {
    this.guesses[user] = guess;
    this.votes[user] = 0;
    console.log('Guesses', this.guesses);
  }
};

Game.prototype.addVote = function (user) {
  if (this.state === 'voting' && _.has(this.votes, user)) {
    this.votes[user]++;
    console.log('Votes', this.votes);
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
