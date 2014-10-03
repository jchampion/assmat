var MongoClient = require('mongodb').MongoClient;
var cheerio = require('cheerio');
var request = require("request");
var limiter = require("limiter");
var fs = require('fs');
var RateLimiter = require('limiter').RateLimiter;

var osmRateLimiter = new RateLimiter(1, 1000);

function parseInfo(text)
{
    var data = {};
    var elements = text.split(/[\r\n]+/gm).map(function(value) {
        return value.trim().replace(/\s{2,}/g, ', ');
    }).filter(function(value, index, array) {
        return value;
    });

    if (elements[elements.length-1].search('@') != -1) {
      data['email'] = elements.pop().replace('SPAMFILTER', '');
    }

    if (elements[elements.length-1].charAt(0) === '0') {
      data['phone'] = elements.pop();
    }

    data['address'] = elements.join(', ');

    return data;
}

function treatRequest(error, response, body)
{
  if (error) throw error;

  $ = cheerio.load(body);
  $('div.coords_am').each(function() {
    var elt = $(this);
    var info = parseInfo(elt.find('.bloc_gauche p').text());
    info['name'] = elt.find('.bloc_gauche strong').text();

    osmRateLimiter.removeTokens(1, function(err, remainingRequests) {
      request({
        uri: "http://nominatim.openstreetmap.org/search",
        method: "GET",
        json: true,
        qs: {format: "jsonv2", q: info['address'], countrycodes: "fr"}
      }, function(error, response, body) {
        console.log(body);
        console.log('');
        console.log('');
      });
    });
  });
}

/*request({
  uri: "http://www.rhone.fr/assmat/annuaire",
  method: "POST",
  form: {insee: 69121, nbRes: 100, numPage: 1, typeTri: 3}
}, treatRequest);*/

fs.readFile('sample.htm', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  
  treatRequest(null, null, data);
});

/*MongoClient.connect('mongodb://127.0.0.1:27017/rhassmat', function(err, db) {
    if(err) throw err;


});*/