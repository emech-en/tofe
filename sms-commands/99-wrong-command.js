'use strict'

module.exports = {
    name: 'Wrong Command',
    satisfy: function(msisdn, content) {
        return true;
    },
    execute: function(app, msisdn, content, callback) {
        callback(null, {
            command: {
                name: 'Wrong Command'
            },
            result: 'Done',
            reply: {
                content: 'worng message.',
                type: 'reply'
            }
        });
    }
}
