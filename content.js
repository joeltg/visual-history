var script = document.createElement('script');
script.setAttribute("type", "text/javascript");
script.setAttribute("async", true);
script.setAttribute("src", chrome.extension.getURL("keyListeners.js")); //Assuming your host supports both http and https
var head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
head.insertBefore(script, head.firstChild);

var CTRL = false;

document.documentElement.onkeydown = function(e) {
    console.log(e);
    if (e.keyIdentifier == "Up" || e.keyIdentifier == "Down" || e.keyIdentifier == "Left" || e.keyIdentifier == "Right")
        if (CTRL) chrome.runtime.sendMessage({key: e.keyIdentifier.toLowerCase()}, function() {});
    else if (e.keyIdentifier == 'U+00A2') CTRL = true;
};

document.documentElement.onkeyup = function(e) {
    console.log(e);
    if (e.keyIdentifier == "U+00A2") {
        chrome.runtime.sendMessage({key: 'ctrl'}, function() {});
        CTRL = false;
    }
};