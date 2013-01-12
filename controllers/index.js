module.exports = function(app, db, prefix) {
  require('./api')(app, db, prefix);

  app.get(prefix + '/', function(req, res) {
    res.render('index');
  });
};

