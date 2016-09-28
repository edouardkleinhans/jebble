var UI = require('ui');
var Settings = require('settings');
var ajax = require('ajax');
var Vibe = require('ui/vibe');
var menuSettings;
var sectionsMenu = [];
var itemsMenu = [];
var jebbleApiUrl = "plugins/jebble/core/api/jebble_api.php";
var jeeApiUrl = "core/api/jeeApi.php";

var cardError = new UI.Card({
  title: "Erreur",
  body: "Une erreur est survenue"
});

var cardResult = new UI.Card({});

var cardWait = new UI.Card({
  title: "",
  body: "Chargement..."
});

// Create Menu Card
var menu = new UI.Menu({
  sections: []
});

var sousMenu = new UI.Menu({
  sections: []
});

function httpCall(url, params, method, sync, returnDatas) {
  var jeedomUrl = Settings.option("jeedomBaseUrl").replace(/\/?$/, '/');
  var result = 'Fait';
  var _async = sync ? false : true;
  var _method = method ? method : 'GET';
  console.log("url: " + jeedomUrl + url + "?apikey=" + Settings.option("jeedomApiKey") + (params ? params : ""));
  ajax(
      {
        url: jeedomUrl + url + "?apikey=" + Settings.option("jeedomApiKey") + (params ? params : ""),
        type: 'json',
        method: _method,
        async: _async
      },
      function(data, status, request) {
        //console.log('return: ' + data);
        if(returnDatas) {
          result = data;
        }
      },
      function(error, status, request) {
        console.log('The ajax request failed: ' + error);
        result = error;
      }
    );
  return result;
}

function loadMenuSettings() {
  console.log('load menu settings');
  var response = httpCall(jebbleApiUrl, "", "GET", true, true);
  // Persist
  Settings.data('menu', JSON.stringify(response));
  Settings.option("reset", false);
}

function constructMenu() {
  menuSettings = Settings.data('menu');
if(menuSettings) {
  console.log(menuSettings);
  var elements = JSON.parse(menuSettings);
  for (var e in elements){
    var currentGroup = elements[e].group ? elements[e].group : "Aucun";
    if(!itemsMenu[currentGroup]){
      itemsMenu[currentGroup] = [];
    }
    itemsMenu[currentGroup].push({title: elements[e].name, command: elements[e].id});
  }

  for (var k in itemsMenu){
    console.log("k: " + k);
    sectionsMenu.push({title: k});
  }
  menu.section(0, {title: null, items: sectionsMenu});

  menu.show();
  cardWait.hide();
} else {
  cardError.show();
  cardWait.hide();
}
}

cardWait.show();

Settings.config(
  { url:'https://edouardkleinhans.github.io/jebble_watchapp/configuration_jebble.html?' + encodeURIComponent(JSON.stringify(Settings.option()))},
  function(e) {
    console.log('opened config');
  },
  function(e) {
    if(e.options != "CANCELLED" && e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
      console.log(e.response);
      console.log('Recieved settings!');
      Settings.option(JSON.parse(decodeURIComponent(e.response)));
      loadMenuSettings();
      constructMenu();
      Vibe.vibrate('short');
    } else {
      console.log("cancelled");
    }
  }
);

if(!Settings.data('menu') || Settings.option("reset")){
  loadMenuSettings();
}/* else {
  console.log('construct menu');
}*/

constructMenu();

menu.on('select', function (event) {
  console.log("event: " + event.item.title);
  sousMenu.section(0, {title: event.item.title, items: itemsMenu[event.item.title]});
  sousMenu.show();
});

sousMenu.on('select', function (event) {
  var result = httpCall(jeeApiUrl, "&type=scenario&id=" + event.item.command + "&action=start", "GET", true, true);
  Vibe.vibrate('short');
  //console.log("result command[" + event.item.command + "] : " + result);
  cardResult.body(result);
  cardResult.show();
  setTimeout(function() {cardResult.hide();}, 500);
});