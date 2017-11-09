'use strict'

var fs = require('fs');

module.exports = function loadSmsCommands(app) {
    var SmsCommand = app.models.SmsCommand;
    var files = fs.readdirSync(__dirname + '/../../sms-commands');
    
    files.forEach(function(fileName) {
        var command = require('./../../sms-commands/' + fileName);
        SmsCommand.register(command);
    });
}