var MongoClient = require('mongodb').MongoClient;
var cheerio = require('cheerio');
var fs = require('fs');
var util = require('util');
var locator = require('./services/locator');
var request = require('./services/request');


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

function treatCityPage(body) {
  var $ = cheerio.load(body);
  $('div.coords_am').each(function () {
    var elt = $(this);
    var info = parseInfo(elt.find('.bloc_gauche p').text());
    info['name'] = elt.find('.bloc_gauche strong').text();

    locator.fetchCoordinates(info['address']).then(function(coordinates) {
      if (coordinates) {
        info['coordinates'] = coordinates;
      }

      console.log(info);
    });
  });
}

function treatIndexPage(body) {
  var $ = cheerio.load(body);
  $('select#commune option').each(function () {
    var elt = $(this), zipCode = elt.attr('value'), city = elt.text();
    if (!zipCode) return;
    if (zipCode < 69003) return;// @TEMP prevent ghost cities import
    console.log(util.format('Starting import for %s (%s)', city, zipCode));
    request({
      uri: "http://www.rhone.fr/assmat/annuaire",
      method: "POST",
      form: {insee: zipCode, nbRes: 500, numPage: 1, typeTri: 3}
    }).then(treatCityPage);

    return false; // @TEMP prevent other cities imports
  });
}

request({
  uri: "http://www.rhone.fr/assmat/annuaire"
}).then(treatIndexPage);


/*fs.readFile('sample.htm', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  
  treatRequest(null, null, data);
});*/

/*MongoClient.connect('mongodb://127.0.0.1:27017/rhassmat', function(err, db) {
    if(err) throw err;


});*/