var request = require("request");
var Promise = require('promise');
var util = require('util');

module.exports = function(params) {
    return new Promise(function(resolve, reject) {
        request(params, function(error, response, body) {
            if (error) {
                reject(error)
            } else {
                resolve(body);
            }
        });
    });
}