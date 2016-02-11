var acronym = require('./acronym');
var async = require('async');
var _ = require('lodash');

var roundLengthGuessing = 20;
var roundLengthVoting = 20;
var roundLengthResults = 60;

var Game = function (controller) {
  this.setNewGame();
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
  console.log('Game stopped.')
};

Game.prototype.setNewGame = function () {
  if (this.gameInterval) {
    clearInterval(this.gameInterval); 
  }
  this.state = 'created';
  this.guesses = {};
  this.votes = {};
  this.gameInterval = null;
  console.log('New game set.')
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
            letters = acronym.generateAcronym();
            // @todo: only show extra help to players that are new to the game (score is smaller than X)
            message = '`' + letters + '`\n';
            message += '>Guess what the letters above stand for. Use */guess* and Fill in the blanks: \n';
            message += '>/guess ' + letters.replace(/\./g,'_____') + '\n';
            message += '>There are no correct answers, so be creative!';
            sendMessage(controller, teams[t], message , callback);
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
    // Show Voting screen.
    console.log('Showing voting');
    if (this.guessCount() == 0) {
      sendMessage(controller, team, 'No guesses entered. :cry: ', function(){});
      this.state = 'finished';
    } else {
      sendMessage(controller, team, 'Choose Best Answer: ', function () {
        console.log('Guesses', this.guesses);
        async.forEachOfSeries(this.guesses, function (guess, user, cb) {
          var message = guess.id + ' - ' + guess.text;
          console.log(message);
          sendMessage(controller, team, message, cb);
        }, callback);
      
      }.bind(this));
    }

  }.bind(this), (roundLengthGuessing * 1000));

};

Game.prototype.startVotingPhase = function (team) {
  var controller = this.controller;
  this.state = 'voting';

  setTimeout(function () {
    // Show Results screen.
    console.log('Showing results');
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
      sendMessage(controller, team, 'No Votes :cry:', function () {
        console.log('Finished');
        this.state = 'finished';
      }.bind(this));
    }
  }.bind(this), (roundLengthVoting * 1000))
};

Game.prototype.guessCount = function() {
  return Object.keys(this.guesses).length;
}

Game.prototype.addGuess = function (user, guess) {
  if (this.state === 'guessing') {
    this.guesses[user] = {
                          id: this.guessCount() + 1, 
                          text: guess,
                          votes: {},
                        };
    this.votes[user] = 0;
    console.log('Guesses', this.guesses);
  }
};

Game.prototype.addVote = function (user, vote) {
  if (this.state === 'voting') {
    // && _.has(this.votes, user)
    // Get the user by the guess ID given
    user_guess = null;

    for (var key in this.guesses) {
      // @todo: what is the below line here for?
      // skip loop if the property is from prototype
      if (!this.guesses.hasOwnProperty(key)) continue;

      var guess = this.guesses[key];
      if (guess.id == vote) {
        user_guess = key;
      }
    }

    if (user_guess !== null) {
      this.votes[user_guess]++;
      console.log('Votes', this.votes);
      console.log("Vote accepted.");
      return "accepted";
    } else {
      console.log("Vote rejected.");
      return "rejected";
    }
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
