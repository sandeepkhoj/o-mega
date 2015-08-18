/**
 * Created by sandeepkumar on 10/07/15.
 */
var _ = require('lodash');
module.exports = function(req, res, next) {
    if (!req.isAuthenticated() || typeof req.user == "undefined" || !req.user.copilot)
        res.status(503);
    else
        next();
}