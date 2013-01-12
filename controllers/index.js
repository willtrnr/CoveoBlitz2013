module.exports = function(app, db, prefix, passport) {
  app.get(prefix + '/', function(req, res) {
    res.render('index');
  });
};

