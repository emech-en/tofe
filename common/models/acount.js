'use strict';

module.exports = function(Acount) {

    /**
     * Request a sms code for login
     * @param {string} msisdn 
     * @param {string} clientId 
     * @param {Function(Error, string)} callback
     */
    Acount.requestLoginCode = function requestLoginCode(msisdn, clientId, callback) {
        Acount.getByMsisdn(msisdn, function(err, acount) {
            if (err) return callback(err);
            if (!acount || !acount.isRegistered()) return callback(null, 'Sent via sms');

            if (!acount.hasValidLoginToken(clientId)) {
                acount.generateLoginToken(clientId);
            }

            acount.save(function(err, acount) {
                if (err) return callback(err);

                Acount.app.emit('sms.send', {
                    content: acount.getLoginCode(clientId),
                    msisdn: acount.msisdn,
                    type: 'code'
                });

                return callback(err, 'Sent via sms');
            });
        });
    };

    /**
     * Request a sms code for registration
     * @param {string} msisdn 
     * @param {string} clientId 
     * @param {Function(Error, string)} callback
     */
    Acount.requestRegisterCode = function requestRegisterCode(msisdn, clientId, callback) {
        Acount.getByMsisdn(msisdn, function(err, acount) {
            if (err) return callback(err);

            if (acount && acount.isRegistered()) {
                return callback(null, 'Registered');
            }

            if (!acount) {
                acount = Acount.create(msisdn);
            }

            if (!acount.hasValidRegistrationToken(clientId)) {
                acount.generateRegistertaionToken(clientId);
            }

            acount.save(function(err) {
                if (err) return callback(err);

                Acount.app.emit('sms.send', {
                    msisdn: acount.msisdn,
                    content: acount.registeration.token.code,
                    type: 'code'
                });

                return callback(null, 'Sent via sms');
            });
        });
    };

    /**
     * Register a user with the sms code
     * @param {string} msisdn 
     * @param {string} code 
     * @param {string} clientId 
     * @param {Function(Error, string, token)} callback
     */
    Acount.registerWithSms = function registerWithSms(msisdn, code, clientId, callback) {
        Acount.getByMsisdn(msisdn, function(err, acount) {
            if (err) return callback(err);

            if (!acount || acount.isRegistered() || !acount.isValidRegistrationCode(code, clientId))
                return callback(null, 'InvalidCode');

            acount.registeration.date = new Date();
            acount.save(function(err, acount) {
                if (err) return callback(err);

                acount.createAccessToken(500, function(err, token) {
                    if (err) return callback(err);

                    return callback(null, 'Success', token);
                });
            });
        });
    };

    /**
     * Send an sms login form 
     * @param {string} msisdn msisdn of the user
     * @param {string} clientId unique identifier from client
     * @param {Function(Error, string)} callback
     */
    Acount.loginWithSms = function loginWithSms(msisdn, code, clientId, callback) {
        Acount.getByMsisdn(msisdn, function(err, acount) {
            if (err) return callback(err);

            if (!acount || !acount.isRegistered() || !acount.isValidLoginCode(code, clientId))
                return callback(null, 'InvalidCode');

            acount.createAccessToken(500, function(err, token) {
                if (err) return callback(err);

                return callback(null, 'Success', token);
            });
        });
    };

    /**
     * Find the acount with msisdn. 
     * @param {string} msisdn msisdn of the user
     * @param {Function(Error, acount)} callback
     */
    Acount.getByMsisdn = function getByMsisdn(msisdn, callback) {
        return Acount.findOne({ where: { msisdn: msisdn } }, callback);
    };


    /**
     * Creates an empty acount with given msisdn. 
     * @param {string} msisdn msisdn of the user
     */
    Acount.create = function create(msisdn) {
        return new Acount({
            msisdn: msisdn,
            registeration: {
                expiredTokens: []
            },
            loginCodes: {}
        });
    }

    ////////////////////////////////////////////

    Acount.prototype.getLoginCode = function getLoginCode(clientId) {
        if (!this.hasValidLoginToken(clientId))
            return null;

        return this.loginCodes[clientId].token.code;
    };

    Acount.prototype.isValidLoginCode = function isValidLoginCode(code, clientId) {
        console.log(code, clientId, this.getLoginCode(clientId));
        return this.hasValidLoginToken(clientId) && this.getLoginCode(clientId) === code;
    };

    Acount.prototype.hasValidLoginToken = function hasValidLoginToken(clientId) {
        var now = new Date(),
            loginCode = this.loginCodes[clientId];

        return loginCode && loginCode.token && loginCode.token.expiresAt > now;
    };

    Acount.prototype.hasAnyLoginToken = function hasAnyLoginToken(clientId) {
        var now = new Date(),
            loginCode = this.loginCodes[clientId];

        return loginCode && loginCode.token;
    };

    Acount.prototype.generateLoginToken = function generateLoginToken(clientId) {
        if (this.hasAnyLoginToken(clientId)) {
            this.loginCodes[clientId].expiredTokens.push(this.loginCodes[clientId].token);
        } else {
            this.loginCodes[clientId] = {
                token: {},
                expiredTokens: []
            }
        }

        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);
        this.loginCodes[clientId].token = {
            code: 'new random code',
            expiresAt: expirationDate
        }
    };

    Acount.prototype.isValidRegistrationCode = function isValidRegistrationCode(code, clientId) {
        var token = this.registeration.token;

        return token && token.code === code && token.clientId === clientId;
    };

    Acount.prototype.hasAnyRegistrationToken = function hasAnyRegistrationToken() {
        return this.registeration.token;
    };

    Acount.prototype.isRegistered = function isRegistered() {
        return this.registeration.date;
    };

    Acount.prototype.hasValidRegistrationToken = function hasValidRegistrationToken(clientId) {
        var now = new Date();

        var hasValid = this.registeration && this.registeration.token && this.registeration.token.clientId && this.registeration.token.clientId === clientId && this.registeration.token.expiresAt && this.registeration.token.expiresAt > now;
        console.log('hasValid', hasValid);
        return hasValid;
    };

    Acount.prototype.generateRegistertaionToken = function generateRegistertaionToken(clientId) {
        if (this.hasAnyRegistrationToken()) {
            this.registeration.expiredTokens.push(this.registeration.token);
        }

        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);
        this.registeration.token = {
            code: 'new random code',
            expiresAt: expirationDate,
            clientId: clientId
        }
    };
};
