/**
 * Created by sandeepkumar on 10/07/15.
 */
module.exports = function(req, res, next) {
    if (!req.isAuthenticated())
        res.render('error.ejs',{error:{status:401},message:'authorization failed'});
    else
        next();
}