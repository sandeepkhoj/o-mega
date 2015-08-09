/**
 * Created by sandeepkumar on 09/08/15.
 */
var config = {};

config.connection = 'postgres://sandeepkumar@localhost:5432/omega';
//config.connection = 'postgres://postgres:ciitdc123@localhost:5432/omega';

config.port = 3000;
//config.port = 80;

config.interval = 100;

module.exports = config;