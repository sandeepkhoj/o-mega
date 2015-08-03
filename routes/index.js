var express = require('express');
var router = express.Router();
var pg = require('pg');
var _ = require('lodash');
var passport = require('passport');
var requiresLogin = require('../requiresLogin');
var requiresAdmin = require('../requiresAdmin');

var connection = 'postgres://sandeepkumar@localhost:5432/omega';


/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendfile('views/index.html');
});
router.get('/partials/:name',function (req, res) {
  var name = req.params.name;
  res.sendfile('views/partials/' + name + '.html');
});

router.get('/pgdata',requiresLogin,function(req,res) {
    var resResult = '';
    var query = req.query.sql;
    pg.connect(connection, function(err, client, done) {
        if(err) {
            res.write("error..");
            return console.error('error fetching client from pool', err);
        }
        client.query(query, function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                //
                res.write("error..");
                return console.error('error running query', err);
            }
            resResult = result;
            client.end();
            res.json(resResult);
        });
    });
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/login', function(req, res){
    res.json({ user: req.user, message: req.flash('error') });
});

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
        pg.connect(connection, function(err, client, done) {

            client.query(
                'Update "userTbl" Set ("userName","lastLogin",uid) = ($1,$2,$3) WHERE handle = $4',
                [req.user.name,new Date(),req.user.uid, req.user.handle],
                function(err, result) {
                    done();
                    if (err) {
                        console.log(err);
                    } else {
                        res.json(req.user);
                    }
                    client.end();
                });
        });

    });


router.get('/failure', function (req, res) {
    res.render('failure');
});

router.get('/getUserDetail',requiresLogin,function(req,res) {
    res.json(req.user);
});

module.exports = router;
