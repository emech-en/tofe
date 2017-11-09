'use strict'

module.exports = function(app) {
    app.on('sms.sent', function(sms) {
        console.log('Send sms to sms server... ');
        console.log(sms);
    });
}
