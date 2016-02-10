module.exports = {
  startGame: startGame
};

function startGame(controller) {
  controller.storage.teams.all(function (err, teams) {
    var count = 0;
    for (var t in teams) {
      if (teams[t].incoming_webhook) {
        count++;
        controller.spawn(teams[t]).sendWebhook({
          text: 'New Game starting'
        }, function (err) {
          if (err) {
            console.log(err);
          }
        });
      }
    }
  });
}

