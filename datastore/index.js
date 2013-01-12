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
};
