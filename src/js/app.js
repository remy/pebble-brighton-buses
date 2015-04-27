/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var moment = require('moment');

var buses = {};

var card = new UI.Card({
  title: 'Next Bus',
  body: 'Loading bus times...',
  icon: 'images/bus_icon.png',
});

var menu = new UI.Menu({
  sections: [{
    items: []
  }]
});

// show the holding card to start with until we have geo data
card.show();
load();

function load() {
  var id = navigator.geolocation.getCurrentPosition(success, error, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  });  
}

function success(position) {
//   navigator.geolocation.clearWatch(id);
  card.body('Location acquired. Finding nearest bus stops...');
  var res = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
  localStorage.geolocation = JSON.stringify(res);
  getNext(res);
}

function error(err) {
  card.body('Location lookup timed out...but I\'ll keep trying...');
  load();
}


function getNext(position) {
  var services = '50,26,46';
  var url = 'http://next-bus.leftlogic.com/nearest?lat=' + position.lat + '&lng=' + position.lng + '&service=' + services;
  ajax({
    url: url,
    type: 'json',
  }, function (data) {
    card.body('Processing times...');
    var section = {
      title: data.times.length + ' buses found',
      items: [],
    };
    // expose the global
    buses = data.times.sort(function (a, b) {
      return a.time < b.time ? -1 : 1;
    });
    
    buses.forEach(function (time) {
      var m = moment(time.time);
      if (Date.parse(time.time) < Date.now()) {
        console.log('dropped', time);
        return;
      }
//       var actualTime = m.format('HH:mm');
      var fromNow = m.fromNow(true);
      time.moment = m;
      time.fromNow = fromNow.replace(/utes$/, '');
      section.items.push({
        title: time.stop.route + ' in ' + fromNow,
        subtitle: time.stop.name + ' to ' + time.destination
      });
    });
    menu.section(0, section);
    card.hide();
    menu.show();
  });
}

menu.on('select', function(e) {
  var card = new UI.Card({
    scrollable: true,
  });
  var bus = buses[e.itemIndex];
    
  card.title(bus.stop.route);
  card.subtitle('Due in ' + bus.moment.fromNow(true).replace(/utes$/, ''));
  card.body('At ' + bus.moment.format('HH:mm') + '\nFrom ' + bus.stop.name + ' to ' + bus.destination);
  card.show();
});
