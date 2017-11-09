'use strict';

module.exports = function(Sms) {
    /**
     * 
     * @param {string} id Unique Id of the received sms from sms server
     * @param {string} msisdn Msisnd of the sender of the sms
     * @param {string} content Content of the sms
     * @param {Function(Error, string)} callback
     */
    Sms.receive = function(id, msisdn, content, token, callback) {

        // TODO: [VALIDATE TOKEN]

        var query = {
            'received.smsId': id
        };

        Sms.count(query, function(err, count) {
            if (err) return callback(err);
            if (count > 0) return callback(null, 'Duplicate');

            new Sms({
                msisdn: msisdn,
                content: content,
                received: {
                    smsId: id
                }
            }).save(function(err) {
                if (err) return callback(err);

                callback(null, 'Received');
            });
        });
        };

    Sms.send = function(sms, callback) {
        new Sms({
            content: sms.content,
            msisdn: sms.msisdn,
            originId: sms.originId,
            sent: {
                smsType: sms.type
            }
        }).save(callback);
    };

    Sms.prototype.isSent = function isSent() {
        return this.sent && typeof this.sent === 'object';
    };

    Sms.prototype.isReceived = function isSent() {
        return this.received && typeof this.received === 'object';
    };

    Sms.observe('after save', function(context, next) {
        var sms = context.instance;

        if (sms.isReceived()) {
            Sms.app.emit('sms.received', sms);
        } else if (sms.isSent()) {
            Sms.app.emit('sms.sent', sms);
        }

        next();
    });

    Sms.on('attached', function(app) {
        app.on('sms.send', function(sms) {
            Sms.send(sms);
        });
    });
}
