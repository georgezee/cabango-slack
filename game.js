var acronym = require('./acronym');
var async = require('async');
var _ = require('lodash');

var roundLengthGuessing = 5;
var roundLengthVoting = 5;
var roundLengthResults = 60; // @todo: implement this pause between showing the results and starting the next round
var gameCounter = 0;

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
  this.letters = acronym.generateAcronym();
  console.log('New game set: ' + gameCounter)
};

Game.prototype.addDummyGuesses = function() {
  if (gameCounter == 1) {
    // Acronym = B.R.T.
    this.addGuess('Fred C', 'Better remind them');
    this.addGuess('Joe', 'Balloons remained tethered');
    this.addGuess('Julie', 'Big Rats Tired');
    console.log('Adding dummy guesses.');
  } else if (gameCounter == 2) {
    // Acronym = S.D.H.
    this.addGuess('Joe', 'seven deadly hippos');
    this.addGuess('Fred C', 'Swim Down Happily');    
    this.addGuess('Julie', 'Singing does help ');
    console.log('Adding dummy guesses.');
  }
}

Game.prototype.addDummyVotes = function() {
  if (gameCounter == 1) {
    this.addVote('', '1');
    this.addVote('', '2');
    this.addVote('', '1');
    console.log('Adding dummy votes.');
  } else if (gameCounter == 2) {
    this.addVote('', '1');
    this.addVote('', '3');
    this.addVote('', '3');
    console.log('Adding dummy votes.');
  }
}

Game.prototype.startRound = function () {
  var controller = this.controller;
  this.votes = {};
  this.guesses = {};
  gameCounter++;

  controller.storage.teams.all(function (err, teams) {
    for (var t in teams) {
      if (teams[t].incoming_webhook) {
        // TODO: Find a better way than calling send message multiple times
        async.series([
          function (callback) {
            msg = '_________________________ \n';
            msg += '*New round started*'; //:pencil2:
            sendMessage(controller, teams[t], msg , callback)
          },
          function (callback) {            
            // @todo: only show extra help to players that are new to the game (score is smaller than X)
            letters = acronym.generateAcronym(); // @todo: I would instead like to refer to 'this.letters', but I get an undefined error if I try that.

            //Dummy data overrides
            if (gameCounter == 1) {
              letters = "B.R.T.";
            } else if (gameCounter == 2) {
              letters = "S.D.H.";
            }
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
  this.addDummyGuesses();

  setTimeout(function () {
    // Show Voting screen.
    console.log('Showing voting');
    if (this.guessCount() == 0) {
      sendMessage(controller, team, 'No guesses entered. :cry: ', function(){});
      this.state = 'finished';
    } else {
      // sendMessage(controller, team, ':eyes: *Choose the Best Answer: *', function () {
      //   console.log('Guesses', this.guesses);
      //   async.forEachOfSeries(this.guesses, function (guess, user, cb) {
      //     var message = guess.id + ' - ' + guess.text;
      //     console.log(message);
      //     sendMessage(controller, team, message, cb);
      //   }, callback);
      // }.bind(this));

      msg = '_________________________ \n';
      msg += '*Vote for the Best Answer * \n'; //:eyes:
      // @todo: we want to show the letters again here.
      //msg += '`' + this.letters + '`\n';
      for (var key in this.guesses) {
        // @todo: what is the below line here for?
        // skip loop if the property is from prototype
        if (!this.guesses.hasOwnProperty(key)) continue;

        var guess = this.guesses[key];      
        msg += '>' + guess.id + ' - ' + guess.text + ' \n';          
      }
      msg += 'Use: */vote number*'
      msg += '\n';
      sendMessage(controller, team, msg, function () { callback();}.bind(this));
    }

  }.bind(this), (roundLengthGuessing * 1000));

};

// @todo: this should be a method on the Guess object
Game.prototype.getVoteCount = function(guess) {
  return this.votes[guess.user];
}

Game.prototype.startVotingPhase = function(team) {
  var controller = this.controller;
  this.state = 'voting';
  this.addDummyVotes();

  setTimeout(function () {
    // Show Results screen.
    console.log('Showing results');
    if (!_.isEmpty(this.votes)) {
      // var pairs = _.toPairs(this.votes);
      // var winner = _.maxBy(pairs, function (score) {
      //   return score[1];
      // })[0];

      // sendMessage(controller, team, 'Winner: ' + winner, function () {
      //   console.log('Finished');
      //   this.state = 'finished';
      // }.bind(this));


      // Add up all the votes.
      // @todo: this should rather happen automatically as votes are added.

      winner = null;
      maxVoteCount = 0;
      fastestAwarded = false;

      for (var key in this.guesses) {
        // @todo: what is the below line here for?
        // skip loop if the property is from prototype
        if (!this.guesses.hasOwnProperty(key)) continue;
 
        var guess = this.guesses[key];
        guess.voteCount = this.getVoteCount(guess);
        // Determine the winning score.        
        if (guess.voteCount > maxVoteCount) {
          winner = guess;
          maxVoteCount = guess.voteCount;
        }

        guess.fastest = false;
        // Determine the fastest answer that received at least one vote.
        // We are assuming that we are iterating through the guesses in the order that they are added.
        // @todo: confirm the order will always be as intended.
        if (!fastestAwarded && (guess.voteCount > 0)) {
          guess.fastest = true;
          fastestAwarded = true;
        }
      }

     msg = '_________________________ \n';
     msg += '*Round Results* \n';
     // @todo: we want to show the letters again here.
     //msg += '`' + this.letters + '`\n';

     if (winner !== null) {
        msg += ':trophy: `' + winner.user + ' Wins!` :trophy:';
        msg += '\n';
     }

     for (var key in this.guesses) {
      // @todo: what is the below line here for?
      // skip loop if the property is from prototype
      if (!this.guesses.hasOwnProperty(key)) continue;

      var guess = this.guesses[key];      
      // @todo: there should be a more elegant way of handling plurals
      if (guess.voteCount == 1) { 
        msg += '>*' + guess.voteCount + ' vote*';
      } else {
        msg += '>*' + guess.voteCount + ' votes*';
      }
      msg += ' - ' + guess.text;
      msg += ' _by ' + guess.user + "_";
      if (guess.fastest) {
        msg += ' :hot_pepper:'
      }
      msg += '\n';
    }
    msg += '\n';
    
    sendMessage(controller, team, msg, function () {
        console.log('Finished');
        this.state = 'finished';
      }.bind(this));


      // async.forEachOfSeries(this.guesses, function (guess, user, cb) {
      //   var message = guess.text;
      //   // @todo: there should be a more elegant way of handling plurals
      //   if (guess.voteCount == 1) { 
      //     message += ' - ' + guess.voteCount + ' vote';
      //   } else {
      //     message += ' - ' + guess.voteCount + ' votes';
      //   }

      //   console.log(message);
      //   sendMessage(controller, team, message, cb);
      // }, function() {
      //   console.log('Finished');
      //   this.state = 'finished';
      // }.bind(this)); // @todo: I don't really understand what I'm doing with these callbacks and bind statements, but hey, it works!
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
                          user: user, // @todo: it may be better to store the user id inside the vote, instead of in this.guesses[user]
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
      console.log('Votes', this.votes); // @todo: record who voted, so we can avoid duplicate votes.
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
