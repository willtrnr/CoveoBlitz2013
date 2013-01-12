var restler  = require('restler');

//Initialize the REST crawler
CrawlerModel = rest.service(function() {}, {
  baseURL: 'http://ec2-23-20-62-1.compute-1.amazonaws.com:8080',
}, {
  start: function() {
    return this.get("/evaluationRun/start?runId=A")
  },
  stop: function() {
    return this.get("/BlitzDataWebService/evaluationRun/stop");
  }
});

var crawler = new CrawlerModel();


module.exports = function(config) {
  var self = this;

  this.config = config;

  this.crawl = function() {
    //Call the START command
    crawler.start();

    //On crawl ca staffaire la !!!
    

    //Call the STOP command
    crawler.stop();
  };

  /*
  terms = {
    artists = {
      joe = {
        { doc1: 1 },
        { doc2: 3 }
      },

      hahn = {
        { doc1: 1 },
        { doc3: 1 }
      }
    },

    albums = {
      big = {
        { doc2: 1 },
        { doc4: 5 }
      }
    }
  }
  */
  this.terms = {
    artists: {},
    albums: {}
  };

  this.tokenize = function(str) {
    return str.split(/\W+/i);
  };

  this.indexArtist = function(artist) {
    var value = this.getArtistString(artist);
    var tokens = this.tokenize(value);

    for (var i in tokens) {
      var token = tokens[i];
      if (!this.terms.artists[token]) this.terms.artists[token] = {};
      if (!this.terms.artists[token][artist.id]) this.terms.artists[token][artist.id] = 1;
      else this.terms.artists[token][artist.id]++;
    }
  };
  this.getArtistString = function(artist) {
    return this.concatArraysIntoString([artist.name, artist.origin, artist.genres, artist.labels,
      artist.group_names, artist.instruments_played]) + ' ' + artist.text;
  };
  this.concatArraysIntoString = function(arr) {
    var str = "";
    for (var i in arr) {
      for (var j in arr[i]) {
        str = str.concat(arr[i][j]);
      }
    }
    return str;
  };
};
