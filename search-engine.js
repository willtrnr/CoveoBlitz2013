var SearchEngine = {
  tokenize: function(str) {
    return str.split();
  }
};

var str = "This is, if I'm not mistaken, a half-good example of what a less naïve tokenizer (if such a contraption exists) should be able to index! -- For good measure, it should also parse numbers like 1000... We can index python magic methods like __init__, but we will ignore things like -----! Aren't we good?";


