module.exports = {
  generateAcronym: generateAcronym
};

function generateAcronym() {
  // We can extend this later to accomodate different character ranges.
  return generateAcronymRange(3,4);
}

function generateAcronymRange(minLetters, maxLetters) {
  // Default character set for English.
  var baseStr = "AAAAAAAAAABBBBBCCCCCDDDDEEFFFFGGGGHHHHHHHIIIJJKLLLLMMMMNNNNOOOOPPPPQRRSSSSSSSTTTTTTTTTTUVWWWWWXYYZL";
  var word = "";

  var numLetters = Math.round(Math.random() * (maxLetters - minLetters)) + minLetters;
  for (var i = 0; i < numLetters; i++)
  {
    var letterIndex = Math.floor(Math.random() * baseStr.length);
    word = word + baseStr[letterIndex] + ".";
  }
  console.log('Acronym generated: ' + word);
  return word;
}

