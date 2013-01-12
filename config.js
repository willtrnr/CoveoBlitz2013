module.exports = {
  title    : 'Covemifasol',
  prefix   : '',
  secret   : process.env.SECRET || 'T3MPL4T3',
  salt     : process.env.SALT || 'T3MPL4T3',
  host     : process.env.DOMAIN || 'localhost',
  listen   : '0.0.0.0',
  port     : process.env.PORT || (process.env.NODE_ENV == 'prodution') ? 80 : 3000,
  runId    : 'Run3'
};
