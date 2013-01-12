module.exports = function(app, db, prefix) {
  app.get(prefix + '/', function(req, res) {
    res.render('index');
  });
};

