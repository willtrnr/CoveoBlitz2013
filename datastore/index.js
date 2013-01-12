var Lateral = require('lateral');
var http = require('http');
http.globalAgent.maxSockets = 500;

function getJSON(url, callback) {
  console.log("Getting " + url);
  http.request({
      hostname: 'ec2-23-20-62-1.compute-1.amazonaws.com',
      port: 8080,
      method: 'GET',
      path: url
    }, function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      if (callback) callback(JSON.parse(data));
    });
  }).end('');
}

module.exports = function(config) {
  var self = this;

  this.config = config;

  this.documents = {};

  this.page = 0;

  this.artists = {};
  this.albums = {};

  this.crawlPoolArtist = Lateral.create(function(complete, item, i) {
    console.log(item);
    getJSON('/BlitzDataWebService/artists/' + item.id, function(data) {
      console.log(data);
      complete();
    });
  }, 25);

  this.crawlPoolAlabum = Lateral.create(function(complete, item, i) {
    console.log(item);
    getJSON('/BlitzDataWebService/album/' + item.id, function(data) {
      console.log(data);
      complete();
    });
  }, 25);

  this.crawlAlbumPage = function() {
    getJSON('/BlitzDataWebService/artists?size=100&page=' + self.page, function(data) {
      console.log(data);
      self.page++;
      self.crawlPoolAlabum.add(data.content).when(function() {
        if (!data.lastPage) {
          self.crawlAlbumPage();
        } else {
          getJSON('/BlitzDataWebService/evaluationRun/stop', console.log);
        }
      });
    });
  };

  this.crawlArtistPage = function() {
    getJSON('/BlitzDataWebService/artists?size=100&page=' + self.page, function(data) {
      console.log(data);
      self.page++;
      self.crawlPoolArtist.add(data.content).when(function() {
        if (!data.lastPage) {
          self.crawlArtistPage();
        } else {
          self.page = 0;
          self.crawlAlbumPage();
        }
      });
    });
  };

  this.crawl = function() {
    console.log("Crawling");
    //Call the START command
    getJSON('/BlitzDataWebService/evaluationRun/start?runId=A', function(data) {
      self.crawlArtistPage();
    });
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
    str = str.toLowerCase();
    var t = [];
    var word = "";
    for (var c in str) {
      if ("0123456789abcdefghijklmnopqrstuvwxyzàáâãäåçèéêëìíîïðòóôõöùúûüýÿ-_".indexOf(str[c]) >= 0)
        word += str[c];
      else {
        t.push(word);
        word = "";
      }
    }
    if (word.length) t.push(word);
    return t;
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
