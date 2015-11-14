var DEPTH_LIMIT = 10;
var DEPTH = 0;

var Node = function(url) {
    this.parent = null;
    this.depth = 0;
    this.url = url;
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
    console.log(command);
    if (command == 'move-up') {

    }
    else if (command == 'move-down') {

    }
    else if (command == 'move-left') {

    }
    else if (command == 'move-right') {

    }
    else {
        console.log("God does not like us");
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    delete tabs[tabId];
    console.log(tabs);
});

chrome.tabs.onReplaced.addListener(function(addedtabId, removedTabId) {
    console.log("added", addedtabId);
    console.log("removed", removedTabId);
    if (tabs[removedTabId]) {
        navigateTo(addedtabId, tabs[removedTabId].url);
        delete tabs[removedTabId];
        console.log(tabs);
    }
});

chrome.webNavigation.onCommitted.addListener(function(details) {
    if (details.transitionQualifiers.indexOf('forward_back') > -1) {
        if (tabs[details.tabId]) {
            var node =  tabs[details.tabId].current;
            if (node.parent && node.parent.url == details.url) {
                // back
                console.log("we went back!");
                tabs[details.tabId].current = node.parent;
            }
            else if (node.children.length > 0) {
                // forward
                console.log("we went forward!");
                tabs[details.tabId].current = node.children[node.children.length - 1]; // This will have to change
            }
            else {
                console.log("everything is wrong");
            }
        }
        return;
    }

    var type = details.transitionType;
    switch (type) {
        case 'link':
            navigateTo(details.tabId, details.url);
            break;
        case 'typed':
            navigateTo(details.tabId, details.url);
            break;
        case 'auto_bookmark':
            navigateTo(details.tabId, details.url);
            break;
        case 'auto_subframe':
            // do nothing
            break;
        case 'manual_subframe':
            navigateTo(details.tabId, details.url, details.title);
            break;
        case 'generated':
            navigateTo(details.tabId, details.url, details.title);
            break;
        case 'auto_toplevel':
            break;
        case 'form_submit':
            // do nothing? ********************
            break;
        case 'reload':
            // do nothing
            break;
        case 'keyword':
            // do nothing? ********************
            break;
        case 'keyword_generated':
            // do nothing? ********************
            break;
    }
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    if (tabs[details.tabId]) {
        if (tabs[details.tabId].current.url == details.url) {



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
    console.log(tabs);
}