'use strict'

module.exports = function(app) {
    app.datasources.mongodbDs.autoupdate(function(err, result) {
        console.log(err, result);
    })
}
