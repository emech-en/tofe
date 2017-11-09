module.exports = function(loopbackApplication, options) {
    loopbackApplication.use(function(req, res, next) {
        console.log(options);
        next();
    });
}
