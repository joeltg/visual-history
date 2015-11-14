var DEPTH_LIMIT = 10;
var DEPTH = 0;
var IMAGES = false;

var Node = function(url) {
    this.parent = null;
    this.depth = 0;
    this.url = url;
    this.image = null;
    this.children = [];
    this.insert = function(url) {
        var node = new Node(url);
        node.depth = this.depth + 1;
        node.parent = this;
        this.children.push(node);
        return node;
    };
};


var tabs = {};

chrome.commands.onCommand.addListener(function(command) {
	
    var fun;
    if (command == 'move-up') fun = up;
    else if (command == 'move-down') fun = down;
    else if (command == 'move-left') fun = left;
    else if (command == 'move-right') fun = right;
    else {
        console.log("God does not like us");
        return;
    }
    chrome.tabs.query({active:true,windowType:"normal", currentWindow: true},function(d){enterNavigation(d[0].id, fun);})
});


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    delete tabs[tabId];
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
    navigateTo(removedTabId, tabs[addedTabId].url);
    delete tabs[addedTabId];
    printTab(removedTabId);
});

chrome.webNavigation.onCommitted.addListener(function(details) {
    var type = details.transitionType;
    switch (type) {
        case 'link':
            break;
        case 'typed':
            break;
        case 'auto_bookmark':
            break;
        case 'auto_subframe':
            // do nothing
            return;
        case 'manual_subframe':
            break;
        case 'generated':
            break;
        case 'auto_toplevel':
            return;
        case 'form_submit':
            // do nothing? ????????????????????
            return;
        case 'reload':
            // do nothing
            return;
        case 'keyword':
            // do nothing? ????????????????????
            return;
        case 'keyword_generated':
            // do nothing? ????????????????????
            return;
    }
    if (tabs[details.tabId] && tabs[details.tabId].override) tabs[details.tabId].override = false;
    else navigateTo(details.tabId, details.url);
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    if (tabs[details.tabId]) {
        if (tabs[details.tabId].current.url == details.url) {
            takeScreenshot(tabs[details.tabId].current);
        }
    }
});

function navigateTo(tabId, url, title) {
    if (tabs[tabId]) {
        // tabId in tabs
        tabs[tabId].current = tabs[tabId].current.insert(url, title);
    }
    else {
        // tabId not in tabs
        var node = new Node(url, title);
        node.current = node;
        tabs[tabId] = node;
    }
    printTab(tabId);
}

function takeScreenshot(node) {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
        if (dataUrl) {
            node.image = dataUrl;
            console.log(dataUrl);
            //saveImage(dataUrl);
        }
    });
}

function up(tab) {
    if (tabs[tab] && tabs[tab].current.parent) {
        tabs[tab].override = true;
        var parent = tabs[tab].current.parent;
        chrome.tabs.update(tab, {url: parent.url});
        tabs[tab].current = parent;
    }
    console.log(tab);
    printTab(tab);
}

function down(tab) {
    if (tabs[tab] && tabs[tab].current.children.length > 0) {
        tabs[tab].override = true;
        var child = tabs[tab].current.children[tabs[tab].current.children.length - 1];
        chrome.tabs.update(tab, {url: child.url});
        tabs[tab].current = child;
    }
    printTab(tab);
}

function left(tab) {
    if (tabs[tab] && tabs[tab].current.parent && tabs[tab].current.parent.children.length > 1) {
        var index = tabs[tab].current.parent.children.indexOf(tabs[tab].current);
        if (index > 0) {
            tabs[tab].override = true;
            var sibling = tabs[tab].current.parent.children[index - 1];
            chrome.tabs.update(tab, {url: sibling.url});
            tabs[tab].current = sibling;
        }
    }
    printTab(tab);
}

function right(tab) {
    if (tabs[tab] && tabs[tab].current.parent && tabs[tab].current.parent.children.length > 1) {
        var index = tabs[tab].current.parent.children.indexOf(tabs[tab].current);
        if (index > -1 && index < tabs[tab].current.parent.children.length - 1) {
            tabs[tab].override = true;
            var sibling = tabs[tab].current.parent.children[index + 1];
            chrome.tabs.update(tab, {url: sibling.url});
            tabs[tab].current = sibling;
        }
    }
    printTab(tab);
}

function enterNavigation(tab, firstMove) {
    firstMove(tab);
}

function printTab(tab) {
    formatTab(tabs[tab]);
    console.log("CURRENT:", tabs[tab].current.url);
    console.log('');
}

function formatTab(tab, indent) {
    if (!indent) indent = 0;
    console.log(Array(indent).join(' ') + tab.url);
    for (var i = 0; i < tab.children.length; i++) {
        formatTab(tab.children[i], indent + 4);
    }
}


function saveImage(dataUrl) {
    var BASE64_MARKER = ';base64,';
    var base64Index = dataUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataUrl.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (i = 0; i < rawLength; ++i) {
        array[i] = raw.charCodeAt(i);
    }
    blob = new Blob([array]);

    var reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = function (event) {
        var save = document.createElement('a');
        save.href = event.target.result;
        save.target = '_blank';
        save.download = 'pic.png' || 'unknown';

        var e = document.createEvent('Event');
        e.initEvent('click', true, true);
        save.dispatchEvent(e);
        (window.URL || window.webkitURL).revokeObjectURL(save.href);
    };

    fileWriter.write(blob);
}
