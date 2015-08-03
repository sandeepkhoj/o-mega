/**
 * Created by sandeepkumar on 15/07/15.
 */
var pg = require('pg');

var connection = 'postgres://sandeepkumar@localhost:5432/omega';
// export function for listening to the socket
module.exports = function (socket) {
    socket.on('updateDashboard', function (data) {
        console.log('---updateDashboard---');
        pg.connect(connection, function(err, client) {
            if(err) {
                console.log(err);
            }
            client.on('notification', function(msg) {
                console.log('---notification---');
                socket.broadcast.emit('updateDashboard', {
                    msg: msg
                });
            });
            var query = client.query("LISTEN watchers");
        });
    });
};