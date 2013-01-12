var Lateral = require('lateral');
var Join = require('join');
var http = require('http');
http.globalAgent.maxSockets = 500;

function getJSON(url, callback) {
  console.log("Getting " + url);
  var r = http.request({
      hostname: 'ec2-23-20-62-1.compute-1.amazonaws.com',
      port: 8080,
      method: 'GET',
      path: '/BlitzDataWebService' + url
    }, function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      r.connection.destroy();
      try {
        if (callback) callback(JSON.parse(data));
      } catch (ex) {
        console.log(ex);
        getJSON(url, callback);
      }
    });
  });
  r.on('error', function(err) {
    r.connection.destroy();
    console.log(err);
    getJSON(url, callback);
  });
  r.end();
}

module.exports = function(config) {
  var self = this;

  this.config = config;

  this.pageArtist = 0;
  this.pageAlbum = 0;

  this.documents = {};
  this.artists = {};
  this.albums = {};

  this.crawlPoolArtist = Lateral.create(function(complete, item, i) {
    getJSON('/artists/' + item.id, function(data) {
      self.documents[item.id] = data;
      self.artists[item.id] = self.documents[item.id];
      self.indexArtist(data);
      /*
      Object.keys(data).forEach(function(k) {
        if (self.facets.indexOf(k) == -1) self.facets.push(k);
      });
      */
      complete();
    });
  }, 250);

  this.crawlPoolAlbum = Lateral.create(function(complete, item, i) {
    getJSON('/albums/' + item.id, function(data) {
      self.documents[item.id] = data;
      self.albums[item.id] = self.documents[item.id];
      self.indexAlbum(data);
      /*
      Object.keys(data).forEach(function(k) {
        if (self.facets.indexOf(k) == -1) self.facets.push(k);
      });
      */
      complete();
    });
  }, 250);

  this.doneCrawl = Join.create();
  this.doneArtists = this.doneCrawl.add();
  this.doneAlbums = this.doneCrawl.add();

  this.crawlArtistPage = function() {
    getJSON('/artists?size=100&page=' + self.pageArtist, function(data) {
      if (data.lastPage !== undefined) self.pageArtist++;
      if (data.lastPage === false) {
        self.crawlPoolArtist.add(data.content);
        self.crawlArtistPage();
      } else {
        self.crawlPoolArtist.add(data.content).when(self.doneArtists);
      }
    });
  };

  this.crawlAlbumPage = function() {
    getJSON('/albums?size=100&page=' + self.pageAlbum, function(data) {
      if (data.lastPage !== undefined) self.pageAlbum++;
      if (data.lastPage === false) {
        self.crawlPoolAlbum.add(data.content);
        self.crawlAlbumPage();
      } else {
        self.crawlPoolAlbum.add(data.content).when(self.doneAlbums);
      }
    });
  };

  this.doneCrawl.when(function() {
    getJSON('/evaluationRun/stop', function(data) {
      console.log("Stop crawling! ", data.documentsCrawled, "/", data.documentsAvailable);
    });
  });

  this.crawl = function() {
    //Call the START command
    console.log("Start crawling!");
    getJSON('/evaluationRun/start?runId=' + self.config.runId, function(data) {
      self.crawlArtistPage();
      self.crawlAlbumPage();
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
    var value = self.getArtistString(artist);
    var tokens = self.tokenize(value);

    for (var i in tokens) {
      var token = tokens[i];
        if (token) {
        if (!self.terms.artists[token]) self.terms.artists[token] = {};
        if (!self.terms.artists[token][artist.id]) self.terms.artists[token][artist.id] = 1;
        else self.terms.artists[token][artist.id]++;
      }
    }
  };
  this.indexAlbum = function(album) {
    var value = self.getAlbumString(album);
    var tokens = self.tokenize(value);

    for (var i in tokens) {
      var token = tokens[i];
        if (token) {
        if (!self.terms.albums[token]) self.terms.albums[token] = {};
        if (!self.terms.albums[token][album.id]) self.terms.albums[token][album.id] = 1;
        else self.terms.albums[token][album.id]++;
      }
    }
   /*var value = self.getAlbumString(album);
    var tokens = self.tokenize(value);

    for (var i in tokens) {
      var token = tokens[i];
        if (token) {
        if (!self.terms.albums[token]) self.terms.albums[token] = {};
        if (!self.terms.albums[token][album.id]) self.terms.albums[token][album.id] = 1;
        else self.terms.albums[token][album.id]++;
      }
    }*/
  };
  this.search = function(query) {
    var isAnd = query.indexOf('OR') < 0;
    query.replace('OR', '');
    var tokens = self.tokenize(query);
    var albums = [];
    var artists = [];

    for (var i in tokens) {
      var token = tokens[i];
      if (token) {
        if (self.terms.albums[token])
          self.addDistinct(albums, self.terms.albums[token]);
        if (self.terms.artists[token])
          self.addDistinct(artists, self.terms.artists[token]);
      }
    }

    if (isAnd) {
      var tmpAlbums = [];
      for (var al in albums) {
        if (self.docContainsAllTerms(albums[al], self.terms.albums, tokens))
          tmpAlbums.push(albums[al]);
      }
      var tmpArtists = [];
      for (var ar in artists) {
        if (self.docContainsAllTerms(artists[ar], self.terms.artists, tokens))
          tmpArtists.push(artists[ar]);
      }
      albums = tmpAlbums;
      artists = tmpArtists;
    }

    var results = {
      facets: {
        type: {
          albums: albums.length,
          artists: artists.length
        }
      },
      results: []
    };
    for (var album in albums) {
      var alb = self.documents[albums[album]];
      results.results.push({id: albums[album], type: "album",
        text: alb.text || "Aucune description.",
        name: alb.name ? alb.name[0] : "Nom indisponible.",
        artists: self.getUIArtists(alb.artists).substring(0,197) + '...'});
    }
    for (var artist in artists) {
      var art = self.documents[artists[artist]];
      results.results.push({id: artists[artist], type: "artiste",
        text: art.text || "Biographie indisponible.",
        name: art.name ? art.name[0] : "Nom indisponible."});
    }

    return results;
  };
  this.getUIArtists = function(artists) {
    var str = "";
    if (artists.length > 0)
      str += artists[0];
    for (var i in artists) {
      if (i > 0)
        str += ', ' + artists[i];
    }
    return str;
  };
  this.docContainsAllTerms = function(id, terms, tokens) {
    for (var i in tokens) {
      var token = tokens[i];
      if (!terms[token][id])
        return false;
    }
    return true;
  };
  this.addDistinctArr = function (arr, add) {
    if (arr.indexOf(add) < 0) arr.push(add);
  };
  this.addDistinct = function(arr, add) {
    for (var a in add) {
      if (arr.indexOf(a) < 0)
        arr.push(a);
    }
  };
  this.getArtistString = function(artist) {
    return self.concatArraysIntoString(self.getFacetsValues(artist).concat([artist.name])) + ' ' + artist.text;
  };
  this.getAlbumString = function(album) {
    return self.concatArraysIntoString(self.getFacetsValues(album).concat([album.name])) + ' ' + album.text;
  };
  this.getFacetsValues = function(obj) {
    var facets = self.getFacets(obj);
    var values = [];
    for (var f in facets) {
      values.push(obj[facets[f]]);
    }
    return values;
  };
  this.getFacets = function(obj) {
    var facets = [];
    var keys = Object.keys(obj);
    for (var i in keys) {
      var prop = keys[i];
      if (prop !== "name" && prop !== "text" && prop !== "id")
        facets.push(prop);
    }
    return facets;
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
