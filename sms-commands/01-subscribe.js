'use strict'

module.exports = {
    name: 'Subscribe Command',
    satisfy: function(msisdn, content) {
        return content === 'H'
    },
    execute: function(app, msisdn, content, callback) {
        callback(null, {
            command: {
                name: 'Subscribe Command',
                params: {
                    msisdn: msisdn
                }
            },
            result: 'Done',
            reply: {
                content: 'You are registered',
                type: 'subscribe'
            }
        });
    }
}
