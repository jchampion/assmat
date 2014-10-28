var request = require("request");
var RateLimiter = require('limiter').RateLimiter;
var util = require('util');
var Promise = require('promise');

var osmRateLimiter = new RateLimiter(1, 1000);

module.exports.fetchCoordinates = function(address, callback) {
  console.log(util.format('Fetching coordinates for address "%s"', address));

  return new Promise(function(resolve, reject) {
    osmRateLimiter.removeTokens(1, function() {
      request({
        uri: "http://nominatim.openstreetmap.org/search",
        method: "GET",
        json: true,
        qs: {format: "jsonv2", q: address, countrycodes: "fr"}
      }, function(error, response, body) {
        if (error) {
          reject(error);
        } else if (body.length != 1) {
          reject('Coordinates not found');
        } else {
          resolve({lat: body[0]['lat'], lon: body[0]['lon']});
        }
      });
    });
  });
};