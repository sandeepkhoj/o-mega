/**
 * Created by sandeepkumar on 10/07/15.
 */
module.exports = function(req, res, next) {
    if (!req.isAuthenticated())
        res.status(503).send('Login required');
    else
        next();
}