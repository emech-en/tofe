var Busboy = require('busboy');
var Minio = require('minio');
const gm = require("gm");


var photoType = {
    'prefix': {
        'type': 'String'
    },
    'suffix': {
        'type': 'String'
    }
}

module.exports = function photoMixin(Model, options) {
    options = options || {};
    var modelName = Model.definition.name.toLowerCase();

    var minio = new Minio.Client({
        endPoint: '192.168.1.101',
        port: 9000,
        secure: false,
        accessKey: 'SRRZEAIA5C4MBKFLJSZJ',
        secretKey: 'QOIPf45agwUXnQTq+33GscubPh+9egoAvdW6JaxL'
    });

    for (key in options) {
        console.log(key, options[key]);

        var setMethod = 'set-' + key,
            deleteMethod = 'delete-' + key;

        Model.defineProperty(key, { 'type': photoType, 'readOnly': true });
        var bucketName = modelName + key;
        minio.bucketExists(bucketName, function(err) {
            if (!err) {
                return;
            } else if (err.code === 'NoSuchBucket') {
                return minio.makeBucket(bucketName, 'us-east-1', function(err) {
                    if (!err) return;
                    // handle error
                });
            } else {
                // handle error
            }
        });

        Model.prototype[setMethod] = function(req, cb) {
            var busboy = new Busboy({
                headers: req.headers,
                limits: {
                    parts: 1,
                    files: 1,
                    fileSize: 1024 * 1024 * 5
                }
            });

            busboy.on('file', function parseFile(fieldname, file, filename, encoding, mimetype) {
                console.log(fieldname, file, filename, encoding, mimetype);

                gm(file).identify((err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(data);
                    }
                });

                minio.putObject(bucketName, filename, file, file.size, mimetype, function(err, etag) {
                    console.log(err, etag);
                });
            });

            busboy.on('finish', function() {
                console.log('Done parsing form!');
                cb(null, "salam");
            });

            req.pipe(busboy);
        }

        Model.remoteMethod(setMethod, {
            isStatic: false,
            accepts: [{
                arg: 'req',
                type: 'req',
                http: { source: 'req' }
            }],
            returns: {
                arg: 'message',
                type: 'string'
            }
        });

    }

}
