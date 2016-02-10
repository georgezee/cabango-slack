var acronym = require('./acronym');

var Game = function (controller) {
  this.state = 'created';
  this.controller = controller;
};

Game.prototype.startGame = function () {
  this.controller.storage.teams.all(function (err, teams) {
    for (var t in teams) {
      if (teams[t].incoming_webhook) {
        this._sendMessage(teams[t], 'New Game starting...');
        this._sendMessage(teams[t], acronym.generateAcronym());
        this.state = 'guessing';

        setTimeout(function () {
          this._sendMessage(teams[t], 'Choose Best Answer: ');
          this._sendMessage(teams[t], '1. First Answer');
          this._sendMessage(teams[t], '2. Second Answer');
          // Display answers

          this.state = 'voting';

          setTimeout(function () {
            this._sendMessage(teams[t], 'Winner: ');
            this._sendMessage(teams[t], '1. First Answer');
            this._sendMessage(teams[t], '2. Second Answer');
            // Display Results

          }.bind(this), 45000)
        }.bind(this), 60000);
      }
    }
  }.bind(this));
};

Game.prototype._sendMessage = function (team, message) {
    if (team.incoming_webhook) {
      this.controller.spawn(team).sendWebhook({
        text: message
      }, function (err) {
        if (err) {
          console.log(err);
        }
      });
    }
  };



module.exports = Game;
