var express = require('express');
var router = express.Router();
var requiresLogin = require('../requiresLogin');
var requiresAdmin = require('../requiresAdmin');
var compiler = require('../compilex/compilex');
var pg = require('pg');
var config = require('../routes/config');

var option = {stats : true};
compiler.init(option);

/* GET users listing. */
router.get('/',requiresAdmin, function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/view/:name',requiresAdmin,function (req, res) {
  var name = req.params.name;
  res.sendfile('views/admin/' + name + '.html');
});

router.post('/fullStatus' ,requiresAdmin, function(req , res ){
  compiler.fullStat(function(data){
    res.send(data);
  });
});

router.get('/viewUsers',requiresAdmin,function(req,res) {
  var uid = req.query.uid;
  pg.connect(config.connection, function(err, client, done) {

    client.query('SELECT *,'+
            ' (SELECT COUNT(*) FROM "userChallenge" WHERE "userChallenge".uid="userTbl".uid) participation,'+
            ' (SELECT COUNT(*) FROM "userChallenge" WHERE "userChallenge".uid="userTbl".uid AND "userChallenge"."isWinner" = true) winner,'+
            ' (SELECT COUNT(*) FROM "userChallenge" WHERE "userChallenge".uid="userTbl".uid AND "userChallenge"."isSubmitted" = true) submitted'+
            ' FROM "userTbl" WHERE uid IS NOT NULL ORDER BY "userTbl".id',
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
router.get('/getUserDesc',requiresAdmin,function(req,res) {
    var uid = req.query.uid;
    pg.connect(config.connection, function(err, client, done) {

        client.query('SELECT bucket_challenge.id as bucket_challenge, * FROM "userChallenge" '+
                    ' LEFT JOIN bucket_challenge ON bucket_challenge.id = "userChallenge".bucket_challenge_id'+
                    ' LEFT JOIN challenge ON bucket_challenge."challengeId" = challenge.id'+
                    ' WHERE uid = '+uid+' ORDER BY bucket_challenge.id',
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
router.get('/getLiveData',requiresAdmin,function(req,res) {
    var uid = req.query.uid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(' SELECT * FROM bucket_challenge p1'+
                    ' INNER JOIN (SELECT "bucketId", MAX(id) AS maxid'+
                    ' FROM bucket_challenge GROUP BY "bucketId") p2'+
                    ' ON (p1.id = p2.maxid)'+
                    ' LEFT JOIN "userChallenge" ON "userChallenge".bucket_challenge_id = p1.id'+
                    ' LEFT JOIN "userTbl" ON "userTbl"."uid" = "userChallenge".uid'+
                    ' LEFT JOIN bucket ON p1."bucketId" = bucket.id'+
                    ' WHERE "userTbl".uid IS NOT NULL'+
                    ' ORDER BY p1."bucketId"',
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
router.get('/getLiveAllData',requiresAdmin,function(req,res) {
    var uid = req.query.uid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(' SELECT bucket.id AS bucket_id, bucket_challenge.id AS bucket_challenge_main_id, "userChallenge".id as user_challenge_id, * FROM bucket'+
            ' LEFT JOIN bucket_challenge ON (bucket.id = bucket_challenge."bucketId" AND bucket_challenge."challengeId" IS NOT NULL)'+
            ' LEFT JOIN challenge ON challenge.id = bucket_challenge."challengeId"'+
            ' LEFT JOIN "userChallenge" ON bucket_challenge.id = "userChallenge".bucket_challenge_id'+
                ' LEFT JOIN "userTbl" ON "userChallenge".uid = "userTbl".uid'+
                ' WHERE "userTbl".uid IS NOT NULL '+
            ' ORDER BY bucket.id, "userChallenge".id',
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
router.get('/getWinner',requiresAdmin,function(req,res) {
    var uid = req.query.uid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(' SELECT bucket.id AS bucket_id, bucket_challenge.id AS bucket_challenge_main_id, "userChallenge".id as user_challenge_id, * FROM bucket'+
            ' LEFT JOIN bucket_challenge ON (bucket.id = bucket_challenge."bucketId" AND bucket_challenge."challengeId" IS NOT NULL)'+
            ' LEFT JOIN challenge ON challenge.id = bucket_challenge."challengeId"'+
            ' LEFT JOIN "userChallenge" ON bucket_challenge.id = "userChallenge".bucket_challenge_id'+
            ' LEFT JOIN "userTbl" ON "userChallenge".uid = "userTbl".uid'+
            ' WHERE "userTbl".uid IS NOT NULL AND "userChallenge"."isWinner" = true'+
            ' ORDER BY bucket.id, "userChallenge".id',
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
router.post('/removeUser',requiresAdmin,function(req,res) {
    var id = req.body.id;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Delete from "userTbl" where "id"='+id,
            function(err, result) {
                if (err) {
                    console.log(err);
                }
                res.json({status:'done'});
                client.end();
            });
    });
});
router.post('/updateUser',requiresAdmin,function(req,res) {
    var id = req.body.id;
    var token = req.body.token;
    var assignChallenge = req.body.assignChallenge;
    var solved = req.body.solved;
    var bucketId = req.body.bucketId;
    var isWinner = req.body.isWinner;
    var batch = req.body.batch;
    isWinner = typeof isWinner === 'undefined' ? false : isWinner;
    solved = typeof solved === 'undefined' ? false : solved;
    console.log(req.body);
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Update "userTbl" Set ("token", "assignChallenge", "solved","bucketId","isWinner","batch") = ($1, $2, $3, $4, $5, $6) WHERE id=$7 RETURNING id',
            [token,assignChallenge, solved, bucketId,isWinner,batch,id],
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
router.post('/setWinner',requiresAdmin,function(req,res) {
    var id = req.body.id;
    var status = req.body.status;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Update "userChallenge" Set ("isWinner") = ($1) WHERE id = $2',
            [status,id],
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
router.get('/viewBuckets',requiresAdmin,function(req,res) {
    var uid = req.query.uid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'SELECT * FROM bucket ORDER BY id',
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
router.post('/updateChallenge',requiresAdmin,function(req,res) {
    var id = req.body.id;
    var bucketId = req.body.bucketId;
    var description = req.body.description;
    var result1 = req.body.result1;
    var result2 = req.body.result2;
    var result3 = req.body.result3;
    var result4 = req.body.result4;
    var result5 = req.body.result5;
    var result6 = req.body.result6;
    var solved = req.body.solved;
    var shortDescription = req.body.shortDescription;
    var testCase1 = req.body.testCase1;
    var testCase2 = req.body.testCase2;
    var testCase3 = req.body.testCase3;
    var testCase4 = req.body.testCase4;
    var testCase5 = req.body.testCase5;
    var testCase6 = req.body.testCase6;
    var title = req.body.title;
    var type = req.body.type;
    var starter_code_java = req.body.starter_code_java;
    var starter_code_c = req.body.starter_code_c;
    var starter_code_cpp = req.body.starter_code_cpp;
    var singleresult = req.body.singleresult;
    var option1 = req.body.option1;
    var option2 = req.body.option2;
    var option3 = req.body.option3;
    var option4 = req.body.option4;
    var correctOption = req.body.correctOption;
    var language = req.body.language;

    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Update challenge Set ("bucketId", "description", "result1","result2","result3","result4","result5", "result6", "solved", "shortDescription","testCase1","testCase2","testCase3","testCase4","testCase5","testCase6","title","type","starter_code_java","starter_code_c","starter_code_cpp","singleresult","option1","option2","option3","option4","correctOption",language)' +
            ' = ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) WHERE id=$29 RETURNING id',
            [bucketId,description, result1, result2,result3,result4,result5,result6,solved,shortDescription,testCase1,testCase2,testCase3,testCase4,testCase5,testCase6,title,type,starter_code_java,starter_code_c,starter_code_cpp,singleresult,option1,option2,option3,option4,correctOption,language,id],
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
router.post('/addChallenge',requiresAdmin,function(req,res) {
    var id = req.body.id;
    var bucketId = req.body.bucketId;
    var description = req.body.description;
    var result1 = req.body.result1;
    var result2 = req.body.result2;
    var result3 = req.body.result3;
    var result4 = req.body.result4;
    var result5 = req.body.result5;
    var result6 = req.body.result6;
    var solved = req.body.solved;
    var shortDescription = req.body.shortDescription;
    var testCase1 = req.body.testCase1;
    var testCase2 = req.body.testCase2;
    var testCase3 = req.body.testCase3;
    var testCase4 = req.body.testCase4;
    var testCase5 = req.body.testCase5;
    var testCase6 = req.body.testCase6;
    var title = req.body.title;
    var type = req.body.type;
    var starter_code_java = req.body.starter_code_java;
    var starter_code_c = req.body.starter_code_c;
    var starter_code_cpp = req.body.starter_code_cpp;
    var singleresult = req.body.singleresult;
    var option1 = req.body.option1;
    var option2 = req.body.option2;
    var option3 = req.body.option3;
    var option4 = req.body.option4;
    var correctOption = req.body.correctOption;
    var language = req.body.language;

    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'INSERT into challenge ("bucketId", "description", "result1","result2","result3","result4","result5", "result6", "solved", "shortDescription","testCase1","testCase2","testCase3","testCase4","testCase5","testCase6","title","type","starter_code_java","starter_code_c","starter_code_cpp","singleresult","option1","option2","option3","option4","correctOption","language")' +
            ' VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) RETURNING id',
            [bucketId,description, result1, result2,result3,result4,result5,result6,solved,shortDescription,testCase1,testCase2,testCase3,testCase4,testCase5,testCase6,title,type,starter_code_java,starter_code_c,starter_code_cpp,singleresult,option1,option2,option3,option4,correctOption,language],
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
router.get('/viewChallenges',requiresAdmin,function(req,res) {
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'SELECT * FROM challenge ORDER BY id',
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
router.get('/getChallange',requiresAdmin,function(req,res) {
    var id = req.query.id;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'SELECT * FROM challenge WHERE id = '+id,
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
router.post('/removeBucket',requiresAdmin,function(req,res) {
    var id = req.body.id;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Delete from "bucket" where "id"='+id,
            function(err, result) {
                if (err) {
                    console.log(err);
                }
                res.json({status:'done'});
                client.end();
            });
    });
});
router.post('/removeChallenge',requiresAdmin,function(req,res) {
    var id = req.body.id;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Delete from challenge where "id"='+id,
            function(err, result) {
                if (err) {
                    console.log(err);
                }
                res.json({status:'done'});
                client.end();
            });
    });
});
router.post('/nextCounter',requiresAdmin,function(req,res) {
    var id = req.body.id;
    var counter = req.body.counter;
    var teamSize = req.body.teamSize;
    var challengeId = req.body.challengeId;
    var endToken = counter * teamSize;
    var startToken = (counter - 1) * teamSize;
    console.log(req.body);
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Update "bucket" Set ("counter") = ($1) WHERE id = $2 RETURNING id',
            [counter,id],
            function(err, result) {
                done();
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                    client.query(
                        'Update "userTbl" Set ("assignChallenge",batch) = ($1,$2) WHERE token >= $3 AND token <= $4 AND "bucketId" = $5',
                    [challengeId,counter,startToken, endToken, id],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.json({status:'done'});
                        }
                        client.end();
                    });
                }
            });
    });
});

router.get('/getRandomChallenge',requiresLogin,function(req,res) {
    var bucketId = req.query.bucketId;
    console.log(bucketId);
    pg.connect(config.connection, function(err, client, done) {

        client.query(

            'SELECT * FROM challenge WHERE solved = false AND "bucketId" = $1 ORDER BY RANDOM() LIMIT 1',
            [bucketId],
            function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if(result.rows.length>0) {
                        res.json(result.rows);
                    }
                    else {
                        res.json({status:'all solved..'});
                    }
                }
                client.end();
            });
    });
});

router.post('/updateBucket',requiresAdmin,function(req,res) {
    var id = req.body.id;
    var isActive = req.body.isActive;
    var name = req.body.name;
    var shortname = req.body.shortname;
    var icon = req.body.icon;
    var type = req.body.type;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'Update "bucket" Set ("isActive", "name","shortname","icon","type") = ($1, $2, $3, $4, $5) WHERE id=$6 RETURNING id',
            [isActive, name, shortname,icon,type,id],
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

router.get('/viewWinners',requiresAdmin,function(req,res) {
    var uid = req.query.uid;
    pg.connect(config.connection, function(err, client, done) {

        client.query(
            'select bucket.id as bucketId, bucket."isActive", bucket.shortname, "userTbl".batch,"userTbl"."userName","userTbl"."handle", "userTbl"."assignChallenge", "userTbl".solved, "userTbl".folder, challenge.id as challengeId, challenge.title, bucket.name, bucket.counter, bucket."teamSize" from bucket left JOIN "userTbl" ON bucket.id="userTbl"."bucketId" LEFT JOIN challenge ON "userTbl"."assignChallenge" = challenge.id WHERE "isWinner" = true ORDER BY bucket.id',
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

module.exports = router;
