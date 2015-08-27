/**
 * Created by sandeepkumar on 09/08/15.
 */
var config = {};

config.connection = process.env.DATABASE_URL || 'postgres://sandeepkumar@localhost:5432/omega';
config.mysqlconnection = process.env.DATABASE_URL || 'postgres://sandeepkumar@localhost:5432/omega';
//config.connection = 'postgres://postgres:ciitdc123@localhost:5432/omega';

config.port = process.env.PORT || 3010;
//config.port = 80;

config.interval = 1000;

module.exports = config;