'use strict';

module.exports = function(SmsCommand) {

    SmsCommand.commands = [];
    SmsCommand.register = function registerCommand(command) {
        SmsCommand.commands.push(command);
    };
    SmsCommand.execute = function(msisdn, content, callback) {
        for (var i = 0; i < SmsCommand.commands.length; i++) {
            if (SmsCommand.commands[i].satisfy(msisdn, content)) {
                return SmsCommand.commands[i].execute(SmsCommand.app, msisdn, content, callback);
            }
        }
    };

    SmsCommand.observe('after save', function(context, next) {
        var smsCommand = new SmsCommand(context.instance);

        SmsCommand.app.emit('sms.send', {
            msisdn: smsCommand.msisdn,
            content: smsCommand.reply.content,
            originId: smsCommand.smsId,
            type: smsCommand.reply.type
        });
    });

    SmsCommand.on('attached', function(app) {
        app.on('sms.received', function(sms) {
            SmsCommand.execute(sms.msisdn, sms.content, function(err, result) {
                if (err) /* Do something */ return;

                new SmsCommand({
                    smsId: sms.id,
                    content: sms.content,
                    msisdn: sms.msisdn,
                    command: result.command,
                    result: {
                        message: result.result
                    },
                    reply: result.reply
                }).save();
            });
        });
    });
};
