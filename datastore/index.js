var rest  = require('restler');

//Initialize the REST crawler
CrawlerModel = rest.service(function() {}, {
  baseURL: 'http://ec2-23-20-62-1.compute-1.amazonaws.com:8080/BlitzDataWebService',
}, {
  start: function() {
    return this.get("/evaluationRun/start?runId=A")
  },
  stop: function() {
    return this.get("/evaluationRun/stop");
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
    var documents;

    var size = 100;
    var page = 0;
    var lastPage = false;

    var artists;
    var albums;
    var documents;

    while (!lastPage)
    {
      crawler.get("/artists?size=" + size + "&page=" + page, {parser: parsers.json}).on('complete', function(data) {
        lastPage = data.lastPage;
        console.dir(data);
      });
    }

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
    return str.toLowerCase().split(/\W+/i);
  };

  this.indexArtist = function(artist) {
    var value = this.getArtistString(artist);
    var tokens = this.tokenize(value);

    for (var i in tokens) {
      var token = tokens[i];
        if (token) {
        if (!this.terms.artists[token]) this.terms.artists[token] = {};
        if (!this.terms.artists[token][artist.id]) this.terms.artists[token][artist.id] = 1;
        else this.terms.artists[token][artist.id]++;
      }
    }
  };
  this.indexAlbum = function(album) {
    var value = this.getAlbumString(album);
    var tokens = this.tokenize(value);

    for (var i in tokens) {
      var token = tokens[i];
        if (token) {
        if (!this.terms.albums[token]) this.terms.albums[token] = {};
        if (!this.terms.albums[token][album.id]) this.terms.albums[token][album.id] = 1;
        else this.terms.albums[token][album.id]++;
      }
    }
  };
  this.search = function(query) {
    var tokens = this.tokenize(query);
    var albums = [];
    var artists = [];

    for (var i in tokens) {
      var token = tokens[i];
      if (token) {
        if (this.terms.albums[token])
          this.addDistinct(albums, this.terms.albums[token]);
        if (this.terms.artists[token])
          this.addDistinct(artists, this.terms.artists[token]);
      }
    }

    return {
      albums: albums,
      artists: artists
    };
  };
  this.addDistinct = function(arr, add) {
    for (var a in add) {
      if (arr.indexOf(a) < 0)
        arr.push(a);
    }
  };
  this.getArtistString = function(artist) {
    return this.concatArraysIntoString([artist.name, artist.origin, artist.genres, artist.labels]) + ' ' + artist.text;
  };
  this.getAlbumString = function(album) {
    return this.concatArraysIntoString([album.name, album.track_names, album.release_date]);
  };
  this.concatArraysIntoString = function(arr) {
    var str = "";
    for (var i in arr) {
      for (var j in arr[i]) {
        str = str.concat(' ' + arr[i][j]);
      }
    }
    return str;
  };
};
