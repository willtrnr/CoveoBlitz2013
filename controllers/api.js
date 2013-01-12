module.exports = function(app, db, prefix) {
  app.get(prefix + '/api', function(req, res) {
    res.json(db.search(req.param('q')));
  });

  app.get(prefix + '/api/:id', function(req, res) {
    res.json(db.documents[req.params.id]);
  });
};
