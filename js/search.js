'use strict'

var isReading = false;

var spaceCount = 0;

document.getElementById('searchInput').value = '';


document.addEventListener('keydown', function(event) {
    var webView = document.getElementById('webView');
    const keyName = event.key;
      if(keyName.trim() == "") {
        spaceCount++;
      }
      if (spaceCount >= 3) {
        if(!isReading) {
          isReading = true;
          speech();
          console.log('loading data...');
          setSpeaking(true);
        } else {
          isReading = false;
          say.stop();
          setSpeaking(false);
        }
        spaceCount = 0;
      }

});

function setSpeaking(cond) {
  if(cond) {
    document.getElementById('speakingDiv').style.display = "inline-flex";
  } else {
    document.getElementById('speakingDiv').style.display = "none";
  }
}

const say = require('./node_modules/say/index.js');

const vision = require('./node_modules/node-cloud-vision-api');
const key = require('./g-key.json');
vision.init({auth: key.key})

var myWebview = document.getElementById('webView');

const natural = require('./node_modules/natural/index.js'),
  tokenizer = new natural.WordTokenizer();

const WordNet = require("./node_modules/node-wordnet/lib/wordnet.js")
var wordnet = new WordNet();

myWebview.addEventListener("did-frame-finish-load", function (e) {
  document.getElementById('speakingDiv').style.display = "none";
  document.getElementById('loadingDiv').style.display = "none";
});

myWebview.addEventListener("did-fail-load", function (e) {
  document.getElementById('speakingDiv').style.display = "none";
  webView.src = "https://www.google.com.pr/?q=" + document.getElementById('searchInput').value.replace(/.*?:\/\//g, "");
});

myWebview.addEventListener("did-start-loading", function (e) {
  say.stop();
  document.getElementById('speakingDiv').style.display = "none";
  isReading = false;
  document.getElementById('loadingDiv').style.display = "inline";
});


function speech() {
  if(isReading) {
  document.getElementById('speakingDiv').style.display = "none";
  document.getElementById('loadingDiv').style.display = "none";
  if(document.getElementById('searchInput').value !== "") {
    document.getElementById('searchInput').value = myWebview.getURL();
    var searchInput = document.getElementById('searchInput').value;
    httpGetAsync(searchInput, function(content) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(content, "text/html");
      var imagesArr = doc.getElementsByTagName('img');
      var images = new Set();
      var imagesTokens = [];
      var noAltImages = [];

      for(var i = 0; i < imagesArr.length; i++) {
        if(imagesArr[i].alt !== "" && !images.has(imagesArr[i].alt)) {
          var text = imagesArr[i].alt.replace(/\s\s+/g, ' ');
          //var tokens = tokenizer.tokenize(text);

          if(text.split(" ").length === 1 && i === 0) {
            imagesTokens.push("This is a " + text);
          } else {
            imagesTokens.push(text);
          }

        } else if(imagesArr[i].alt === "" && imagesArr[i].src) {
          var text = imagesArr[i].alt.replace(/\s\s+/g, ' ');
            noAltImages.push(imagesArr[i].src);
        }
      }



      /*
      var counter = 0;
      var size = imagesTokens.length - 1;
      (function next() {
        if (counter++ > size) return;

            say.speak(imagesTokens[counter - 1], 'Alex', 0.85, function(err) {
              if (err) {
                return console.error(err);
              } else {
                next();
              }
            });
      })();
      */



      var reqArr = [];
      for(var p = 0; p < noAltImages.length; p++) {
        reqArr.push(imageRecognition(noAltImages[p]));
      }

      vision.annotate(reqArr).then((res) => {
        var resp = JSON.parse(JSON.stringify(res.responses));
        if(resp !== undefined) {
          for(var j = 0; j < resp.length; j++) {
              var text = resp[j].labelAnnotations[0].description;
              imagesTokens.push("This is a " + text);
          }
          var counter = 0;
          var size = imagesTokens.length - 1;
          (function next() {
            if (counter++ > size) return;
              if(!isReading) { return }
                say.speak(imagesTokens[counter - 1], 'Alex', 0.82, function(err) {
                  if (err) {
                    return console.error(err);
                  } else {
                    next();
                  }
                });
          })();
        }
      }, (e) => {
        console.log('Error: ', e)
      });


    });
  }
}
}

function search() {

  var webView = document.getElementById('webView');
  var webViewDiv = document.getElementById('webViewDiv');
  var loadingDiv = document.getElementById('loadingDiv');
  var searchInput = document.getElementById('searchInput').value;
  if(document.getElementById('searchInput').value !== '') {
    if (searchInput.indexOf("http://") !== 0) {
      if(searchInput.indexOf("https://") !== 0) {
        var input = searchInput;
        searchInput = "http://" + input;
      }
    }
    webView.src = searchInput;
    document.getElementById('searchInput').value = searchInput;
  }

}

function imageRecognition(imageSrc) {
  var req = new vision.Request({
  image: new vision.Image({
    url: ''
  }),
  features: [
    new vision.Feature('LABEL_DETECTION', 3),
  ]
  });

  req._image._url = imageSrc;

  return req;
}

function toDataUrl(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.send();
}

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
    }
  xmlHttp.open("GET", theUrl, true);
  xmlHttp.send(null);
}

function goBack() {
  var webView = document.getElementById('webView');
  if(webView.canGoBack()) {
    webView.goBack();
  }
}

function goForward() {
  if(webView.canGoForward()) {
    webView.goForward();
  }
}

function refresh() {
  if(document.getElementById('searchInput').value !== '') {
    webView.reload();
  }
}
