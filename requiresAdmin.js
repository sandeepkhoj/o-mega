/**
 * Created by sandeepkumar on 10/07/15.
 */
var _ = require('lodash');
module.exports = function(req, res, next) {
    if (!req.isAuthenticated() || typeof req.user == "undefined" || !req.user.copilot)
        res.render('error.ejs',{error:{status:401},message:'authorization failed for admin.'});
    else
        next();
}