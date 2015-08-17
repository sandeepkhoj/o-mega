var express = require('express');
var router = express.Router();
var pg = require('pg');
var compiler = require('../compilex/compilex');
var config = require('../routes/config');
var requiresLogin = require('../requiresLogin');
var requiresAdmin = require('../requiresAdmin');
var mysql      = require('mysql');
var mysql_connection_db1 = mysql.createConnection({
    host     : 'localhost',
    user     : 'enduser',
    password : 'ciitdc@123',
    database : 'db1'
});
var mysql_connection_db2 = mysql.createConnection({
    host     : 'localhost',
    user     : 'enduser',
    password : 'ciitdc@123',
    database : 'db1'
});

var option = {stats : true};
compiler.init(option);

router.post('/compile' ,requiresLogin, function (req , res ) {

    var code = req.body.code;
    var input = req.body.input;
    console.log(code);
    console.log(input);
    var lang = req.body.lang;
    if((lang === "C") || (lang === "C++")) {
        var envData = { OS : "windows" , cmd : "g++"};
        compiler.compileCPPWithInput(envData , code ,input , function (data) {

            res.json(data);
        });
    }
    if(lang === "Java") {
        var envData = { OS : "windows" };
        console.log(code);
        compiler.compileJavaWithInput( envData , code , input ,  function(data){
            res.json(data);
        });
    }
    if(lang === 'sql') {
        mysql_connection_db1.connect();

        mysql_connection_db1.query(sql, function(err, rows, fields) {
            if (err) {
                res.json(err);
            }

            res.json(rows);
        });

        mysql_connection_db1.end();
    }
});
router.post('/testCode' ,requiresLogin, function (req , res ) {

    var path = req.body.path;
    var input = req.body.input;
    var sql = req.body.sql;
    input = input.replace(/,/g, ' ');
    console.log(input);
    var lang = req.body.lang;
    if((lang === "C") || (lang === "C++")) {
        var envData = { OS : "windows" , cmd : "g++"};
        compiler.runCppWithInput(envData , path ,input , function (data) {
            res.json(data);
        });
    }
    if(lang === "Java") {
        var envData = { OS : "windows" };
        compiler.runJavaWithInput( envData , path , input ,  function(data){
            res.json(data);
        });
    }
    if(lang === 'sql') {
        mysql_connection_db2.connect();

        mysql_connection_db2.query(sql, function(err, rows, fields) {
            if (err) {
                res.json(err);
            }

            res.json(rows);
        });

        mysql_connection_db2.end();
    }
});
router.get('/view/:name',requiresLogin,function (req, res) {
    var name = req.params.name;
    res.sendfile('views/private/' + name + '.html');
});

router.post('/updateCode',requiresLogin,function(req,res) {
    var uid = req.body.userId;
    var code = req.body.code;
    var challengeid = req.body.challengeid;
    var code_language = req.body.code_language;
    var solution = req.body.solution;
    console.log(req.body);
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Update "userChallenge" Set (code,code_language,solution) = ($1,$2,$3) WHERE bucket_challenge_id = $4 AND "isSubmitted" = false AND uid = $5',
            [code,code_language,solution,challengeid,uid],
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.json({status:'done'});
                }
                client.end();
            });
    });
});
router.post('/openProblem',requiresLogin,function(req,res) {
    var uid = req.body.userId
    var bucketid = req.body.bucketid;
    var challengeid = req.body.challengeid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'INSERT INTO "userChallenge" (folder, code, uid, bucket_challenge_id,"isSubmitted","isWinner") VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            [null,null,uid,challengeid,false,false],
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.json({status:'done'});
                }
                client.end();
            });
    });
});

router.post('/submitCode',requiresLogin,function(req,res) {
    var uid = req.body.userId;
    var bucket_challenge_id = req.body.bucket_challenge_id;
    var challengeid = req.body.challengeid;
    pg.connect(config.connection, function(err, client, done) {
        if(err) {
            res.write("error..");
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT count(*) as count FROM "userChallenge" WHERE bucket_challenge_id = $1 AND "isSubmitted" = true',
            [bucket_challenge_id],
            function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                //
                res.write("error..");
                return console.error('error running query', err);
            }
                var count = 1;
                if(result.rows.length>0) {
                    count = parseInt(result.rows[0].count) + 1;
                }
            client.query(
            'UPDATE "userChallenge" SET "isSubmitted" = $1, "submissionNo" = $2 WHERE uid = $3 AND bucket_challenge_id = $4',
            [true, count, uid, bucket_challenge_id],
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    client.query(
                        'UPDATE "challenge" SET solved = $1 WHERE id = $2',
                        [true, challengeid],
                        function(err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.json({status:'loser'});
                            }
                            client.end();
                        });
                }
            });

        });
    });
});
router.post('/submitSolution',requiresLogin,function(req,res) {
    var uid = req.body.userId;
    var challengeid = req.body.challengeid;
    var solution = req.body.solution;
    var option = req.body.option;
    pg.connect(config.connection, function(err, client, done) {
        if(err) {
            res.write("error..");
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT count(*) as count FROM "userChallenge" WHERE bucket_challenge_id = $1 AND "isSubmitted" = true',
            [challengeid],
            function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
                    //
                    res.write("error..");
                    return console.error('error running query', err);
                }
                var count = 1;
                if(result.rows.length>0) {
                    count = parseInt(result.rows[0].count) + 1;
                }
                client.query(
                    'UPDATE "userChallenge" SET "isSubmitted" = $1, "submissionNo" = $2, "solution" = $3, option = $4 WHERE uid = $5 AND bucket_challenge_id = $6',
                    [true, count, solution,option, uid, challengeid],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.json({status:'loser'});
                        }
                        client.end();
                    });

            });
    });
});

router.post('/updatePath',requiresLogin,function(req,res) {
    var uid = req.body.userId;
    var code = req.body.code;
    var path = req.body.path;
    var challengeid = req.body.challengeid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'WITH upsert AS (UPDATE "userChallenge" SET "folder" = $1, code = $2 WHERE uid=$3 AND bucket_challenge_id = $4 RETURNING *)'+
            'INSERT INTO "userChallenge" (folder, code, uid, bucket_challenge_id,"isSubmitted") SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT * FROM upsert)',
            [path,code,uid,challengeid,false],
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.json({status:'done'});
                }
                client.end();
            });
    });
});

router.get('/viewLoad',requiresLogin,function(req,res) {
    var uid = req.query.userId;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'SELECT bucket.id AS bucketId, bucket.type AS buckettype, bucket."isActive", bucket.type as buckettype, date_part(\'epoch\',bucket.timestamp)*1000 as timestamp, bucket.shortname, challenge.id AS challengeId, * FROM bucket'+
            ' LEFT JOIN challenge ON bucket."challengeId" = challenge.id'+
            ' LEFT JOIN "userChallenge" ON (bucket.bucket_challenge_id = "userChallenge".bucket_challenge_id AND "userChallenge".uid = '+uid+') ORDER BY bucket.id',
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.json(result.rows);
                }
                client.end();
            });
    });
});

router.get('/viewChallenge',requiresLogin,function(req,res) {
    var uid = req.query.uid;
    var bucket_id = req.query.bucketId;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'SELECT bucket.id AS bucketId, bucket.type AS buckettype, bucket.bucket_challenge_id as bucket_challenge,"userChallenge".bucket_challenge_id as bucket_challenge_user, bucket."isActive", challenge.id AS challengeId,"userChallenge".id AS userChallengeId, * FROM bucket LEFT JOIN challenge ON (bucket."challengeId" = challenge.id) LEFT JOIN "userChallenge" ON ("userChallenge".bucket_challenge_id = bucket.bucket_challenge_id AND "userChallenge".uid = '+uid+') WHERE bucket.id = '+bucket_id,
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.json(result.rows);
                }
                client.end();
            });
    });
});

router.post('/register',requiresLogin,function(req,res) {
    var uid = req.body.uid;
    var name = req.body.name;
    var handle = req.body.handle;
    var bucketId = req.body.bucketId;

    pg.connect(config.connection, function(err, client, done) {
        if(err) {
            res.write("error..");
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT * FROM \"userTbl\" WHERE token = (SELECT MAX(token) FROM \"userTbl\" WHERE \"bucketId\" = '+bucketId+')', function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                //
                res.write("error..");
                return console.error('error running query', err);
            }
            var resResult = 0;
            if(result.rows.length>0) {
                resResult = result.rows[0].token;
            }

            console.log(resResult);
            client.query(
                'INSERT into \"userTbl\" ("uid","userName", "handle", "lastLogin","token","bucketId","assignChallenge") VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [uid,name, handle, new Date(),resResult+1,bucketId,0],
                function(err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('row inserted with id: ' + result.rows[0].id);
                    }
                    client.end();
                    res.json(result.rows[0]);
                });
        });
    });
});
module.exports = router;
