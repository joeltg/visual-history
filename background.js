var colorThief = new ColorThief();

var Node = function(url, icon_url) {
    this.parent = null;
    this.depth = 0;
    this.max_depth = 0;
    this.url = url;
    this.icon_url = icon_url;
    this.image_url = null;
    this.title = null;
    this.children = [];
    this.insert = function(url, icon_url) {
        var node = new Node(url, icon_url);
        node.depth = this.depth + 1;
        node.parent = this;
        this.children.push(node);
        return node;
    };
};

var tabs = {};

chrome.runtime.onMessage.addListener(function(message, sender) {
    // navigate to currently selected node
    if (message.key == 'ctrl') exitNavigation(sender.tab.id);
});

chrome.commands.onCommand.addListener(function(command) {
    var fun;
    if (command == 'move-up') fun = up;
    else if (command == 'move-down') fun = down;
    else if (command == 'move-left') fun = left;
    else if (command == 'move-right') fun = right;
    chrome.tabs.query({active: true, windowType: "normal", currentWindow: true}, function(d) {
        navigate(d[0].id, fun);
    });
});


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    delete tabs[tabId];
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
    onNavigateTo(removedTabId, tabs[addedTabId].url);
    tabs[addedTabId] = tabs[removedTabId];
    delete tabs[removedTabId];
    printTab(addedTabId);
});

chrome.webNavigation.onCommitted.addListener(function(details) {
    var type = details.transitionType;
    if (details.transitionQualifiers.indexOf("forward_back") >= 0 && tabs[details.tabId]) {
        if (tabs[details.tabId].current.parent && tabs[details.tabId].current.parent.url == details.url)
        {
            tabs[details.tabId].current = tabs[details.tabId].current.parent;
            return;
        }
        else for (var i = 0; i < tabs[details.tabId].current.children.length; i++)
            if (tabs[details.tabId].current.children[i].url == details.url) {
                tabs[details.tabId].current = tabs[details.tabId].current.children[i];
                return;
            }
    }
    else if (details.transitionQualifiers.indexOf("client_redirect") >= 0) {
        tabs[details.tabId].current.url = details.url;
        return;
    }
    else switch (type) {
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
    else onNavigateTo(details.tabId, details.url);
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    if (tabs[details.tabId]) {
        if (tabs[details.tabId].current.url == details.url) {
            chrome.tabs.get(details.tabId, function(tab) {
                if (chrome.runtime.lastError) {
                    //console.error(chrome.runtime.lastError.message);
                } else {
                    var current = tabs[details.tabId].current;
                    current.icon_url = tab.favIconUrl;
                    current.title = tab.title;

                    var img = new Image;
                    img.onload = function(){
                        current.img_color = colorThief.getColor(img);
                    };
                    img.src = tab.favIconUrl;
                }
            });
            // takeScreenshot(tabs[details.tabId].current);
        }
    }
});

function onNavigateTo(tabId, url, icon_url) {
    if (tabs[tabId]) {
        // tabId in tabs
        tabs[tabId].current = tabs[tabId].current.insert(url, icon_url);
        tabs[tabId].max_depth = Math.max(tabs[tabId].max_depth, tabs[tabId].current.depth);
    }
    else {
        // tabId not in tabs
        var node = new Node(url, icon_url);
        node.current = node;
        tabs[tabId] = node;
    }
}

function takeScreenshot(node) {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
        if (dataUrl) {
            node.image_url = dataUrl;
            console.log(dataUrl);
            //saveImage(dataUrl);
        }
    });
}

function up(tab) {
    if (tabs[tab] && tabs[tab].current.parent)
        tabs[tab].current = tabs[tab].current.parent;
    printTab(tab);
    return 'up';
}

function down(tab) {
    if (tabs[tab] && tabs[tab].current.children.length > 0)
        tabs[tab].current = tabs[tab].current.children[tabs[tab].current.children.length - 1];
    printTab(tab);
    return 'down';
}

function left(tab) {
    if (tabs[tab] && tabs[tab].current.parent && tabs[tab].current.parent.children.length > 1) {
        var index = tabs[tab].current.parent.children.indexOf(tabs[tab].current);
        if (index > 0)
            tabs[tab].current = tabs[tab].current.parent.children[index - 1];
    }
    printTab(tab);
    return 'left';
}

function right(tab) {
    if (tabs[tab] && tabs[tab].current.parent && tabs[tab].current.parent.children.length > 1) {
        var index = tabs[tab].current.parent.children.indexOf(tabs[tab].current);
        if (index > -1 && index < tabs[tab].current.parent.children.length - 1)
            tabs[tab].current = tabs[tab].current.parent.children[index + 1];
    }
    printTab(tab);
    return 'right';
}

function navigate(tabId, move) {
    move = move(tabId);
    var tree = getTree(tabs[tabId], tabs[tabId].current);
    var depth_of_current = tabs[tabId].current.depth;
    var max_depth = tabs[tabId].max_depth;
    chrome.tabs.sendMessage(
        tabId,
        {move: move, tree: tree, depth_of_current: depth_of_current, max_depth: max_depth},
        function() {}
    );
}

function getTree(node, current) {
    if (!node.title) node.title = node.url.substr(0, 30) + '... ';
    var tree = {
        name: node == node.title.length > 40 ? node.title : node.title.substr(0, 30) + '... ',
        url: node == node.url.length > 40 ? node.url : node.url.substr(0, 30) + '... ',
        image_url: node.image_url,
        icon_url: node.icon_url,
        img_color: node.img_color,
        current: node == current,
        children: []
    };
    for (var i = 0; i < node.children.length; i++) tree.children.push(getTree(node.children[i], current));
    return tree;
}

function exitNavigation(tabId) {
    // navigate current tab to current url
    chrome.tabs.get(tabId, function(tab) {
        if (tab.url != tabs[tab.id].current.url) {
            tabs[tab.id].override = true;
            chrome.tabs.update(tab.id, {url: tabs[tab.id].current.url});
        }
    });
}

function printTab(tab) {
    formatTab(tabs[tab], 2, tabs[tab].current);
    console.log('');
}

function formatTab(tab, indent, current) {
    var base, fill;
    if (tab == current) {
        base = '1';
        fill = new Array(indent - 1).join(' ');
    }
    else {
        base = '';
        fill = new Array(indent).join(' ');
    }
    console.log(base + fill + tab.url);
    for (var i = 0; i < tab.children.length; i++) {
        formatTab(tab.children[i], indent + 4, current);
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
