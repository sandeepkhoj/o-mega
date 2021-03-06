var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var request = require('request');
var session = require('express-session');
var config = require('./routes/config');
var routes = require('./routes/index');
var admin = require('./routes/admin');
var private = require('./routes/private');
var socket = require('./routes/socket');
var pg = require('pg');
var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var flash = require('connect-flash');

var users = [];
var buckets = [];


function findById(id, fn) {
  //var idx = id - 1;
  for(i = 0 ; i < users.length ; i ++) {
    if(users[i].uid == id) {
      fn(null, users[i]);
    }
  }
}
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
    function(username, password, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
          console.log(username);
          console.log(password);
          request.post({url:'http://api.topcoder.com/v2/auth', form: {username:username,password:password}}, function (error, response, body) {
              console.log(error);
              console.log(body);
              if (error) { return done(null, false, { message: error }); }
              if(JSON.parse(body).error) {return done(null, false, { message: JSON.parse(body).error.details });}
              console.log(body);
              request.get({url:'http://api.topcoder.com/v2/user/profile', headers: {'Authorization': 'Bearer '+JSON.parse(body).token}}, function (error, response, body) {
                  if (error) { return done(null, false, { message: error }); }
                  if(JSON.parse(body).error) {return done(null, false, { message: JSON.parse(body).error.details });}
                  var jsonBody = JSON.parse(body);
                  console.log(jsonBody);

                  pg.connect(config.connection, function(err, client, done) {

                      client.query(
                          'SELECT * FROM admin WHERE handle = $1',
                          [jsonBody.handle],
                          function(err, result) {
                              if (err) {
                                  console.log(err);
                              } else {
                                  if(result.rows.length > 0) {
                                      jsonBody.copilot = true;
                                  }
                                  else {
                                      jsonBody.copilot = false;
                                  }
                              }
                              client.end();
                          });
                  });

                  users.push(jsonBody);
                  return done(null, jsonBody);
              });
          });
        // Find the user by username.  If there is no user with the given
        // username, or the password is not correct, set the user to `false` to
        // indicate failure and set a flash message.  Otherwise, return the
        // authenticated `user`.
        /*
        findByUsername(username, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
          if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
          return done(null, user);
        })*/
      });
    }
));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', routes);
app.use('/admin', admin);
app.use('/private', private);
app.use(redirectUnmatched);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

function redirectUnmatched(req, res) {
  res.redirect("/");
}

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.get('/api/name', function (req, res) {
  res.json({
    name: 'Sandeep'
  });
});

var pg_client = new pg.Client(config.connection);
pg_client.connect();
var query = pg_client.query('LISTEN updateuser');

var pg_client1 = new pg.Client(config.connection);
pg_client1.connect();
var query = pg_client1.query('LISTEN bucketupdate');


io.sockets.on('connection', function (socket) {
  console.log('---connection---');
  socket.emit('connected', { connected: true });

  socket.on('ready for updateuser update', function (data) {
    console.log('---ready for updateuser update---');
    pg_client.on('notification', function(title) {
      console.log('---notification---');
      console.log(title);
      socket.emit('updateuser', { message: title });
    });
  });

  socket.on('ready for bucket update', function (data) {
    console.log('---ready for bucket update---');
    pg_client1.on('notification', function(title) {
      console.log('---notification---');
      console.log(title);
        //updateBuckets();
      socket.emit('bucketupdate', { message: title });
    });
  });


});
io.sockets.setMaxListeners(0);


http.listen(config.port, function(){
  console.log('listening on *:'+config.port);
    updateBuckets();
});

var minutes = 1, the_interval = minutes * 60 * 1000;
setInterval(function() {
    for(var i = 0 ; i < buckets.length ; i++) {
        console.log(buckets[i].timestamp);
        if(buckets[i].timestamp != null) {
            var counter = addMinutes(new Date(buckets[i].timestamp), buckets[i].timer).getTime() - new Date().getTime();
            console.log('--counter--'+counter);
            if (counter <= 0) {

                assignNewChallenge(buckets[i].id,buckets[i].challengeId);
                break;
            }
        }
        else if(buckets[i].isActive){
            console.log('--buckets[i]--'+buckets[i].id);
            assignNewChallenge(buckets[i].id,buckets[i].challengeId);
            break;
        }
        else {
            updateBuckets();
        }
    }
}, the_interval);

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

function updateBuckets() {
    console.log('--in Bucket Update--');
    pg.connect(config.connection, function (err, client, done) {

        client.query(
            'SELECT date_part(\'epoch\',bucket.timestamp)*1000 as timestamp, id, "challengeId", "isActive", timer FROM bucket WHERE "isActive" = true',
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    buckets = result.rows;
                }
                client.end();
            });
    });
}
function assignNewChallenge(bucketId,lastChallengeId) {
    console.log(lastChallengeId);
    pg.connect(config.connection, function(err, client, done) {
        var sql = '';
        if(lastChallengeId != null) {
            sql = 'SELECT id FROM challenge WHERE (solved = false OR solved IS NULL) AND "bucketId" = '+bucketId+' AND id != '+lastChallengeId+' ORDER BY RANDOM() LIMIT 1';
        }
        else {
            sql = 'SELECT id FROM challenge WHERE (solved = false OR solved IS NULL) AND "bucketId" = '+bucketId+' ORDER BY RANDOM() LIMIT 1';
        }
        client.query(sql,
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if(result.rows.length>0) {
                        var challengeId = result.rows[0].id;
                        client.query(
                            'INSERT INTO bucket_challenge ("bucketId","challengeId","timestamp") VALUES($1,$2,$3)',
                            [bucketId,challengeId,new Date()],
                            function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('new challenge no ['+challengeId+'] assign on bucket ['+bucketId+']');

                                }
                                updateBuckets();
                            });
                    }
                    else {
                        console.log('all challenge solved on bucket ['+bucketId+']');
                        client.query(
                            'Update bucket Set ("isActive","challengeId") = ($1,$2) WHERE id = $3',
                            [false,null,bucketId],
                            function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('closed bucket ['+bucketId+']');

                                }
                                updateBuckets();
                            });
                    }
                }
            });
    });
}

module.exports = app;

