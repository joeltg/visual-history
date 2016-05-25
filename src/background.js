/**
 * Created by joel on 5/16/16.
 */
"use strict";

const tabs = {};

const nodeWidth = 256;
const nodeHeight = 172;
const imageSize = 64;

let SELECTING = false;

class Tab {
    constructor(url) {
        this.currentId = this.i = 0;
        // readability counts, except for really schnazzy one-liners
        this.nodes = {[url]: this.currentNode = this.rootNode = new Node(url, this)};
    }
    update(key, val) {
        if (key === 'favIconUrl')
            this.currentNode.favIconUrl = val;

        else if (key === 'title')
            this.currentNode.title = val;

        else if (key === 'url') {
            const node = this.nodes[val];
            if (node) this.updateCurrent(node);
            else this.nodes[val] = this.updateCurrent(this.currentNode.insert(val));
        }
    }
    updateCurrent(newCurrent) {
        // handle reassigning all the current id and node pointers
        // and return the new node for easy chaining later
        newCurrent.current = true;
        newCurrent.preview = false;
        this.currentNode.current = false;
        this.currentNode = newCurrent;
        this.currentId = newCurrent.id;
        return newCurrent;
    }
}

class Node {
    // we have to pass the parent tab around
    // to keep track of tab-scoped node IDs.
    constructor(url, tab) {
        this.url = url;
        this.index = false;
        this.tab = tab;
        this.preview = false;
        this.id = this.tab.i++;
        this.title = "";
        this.children = [];
        this.parent = false;
    }
    insert(url) {
        const node = new Node(url, this.tab);
        node.parent = this;
        node.index = this.children.push(node) - 1;
        return node;
    }
}

chrome.browserAction.onClicked.addListener(tab => {
    if (SELECTING) {
        // SELECTING will get reset to false when content.js
        // evaluates its callback closure. Resetting this too
        // early will fuck shit up. Just leave it.
        chrome.tabs.sendMessage(tab.id, {type: 'close'});
    }
    else {
        SELECTING = true;
        sendTree(tab.id, false);
    }
});

chrome.contextMenus.create({
    title: "Push link to tree in background",
    contexts: ["link"],
    onclick: (info, tab) => {
        if (tabs[tab.id] && tabs[tab.id].currentNode && info.linkUrl) {
            const current = tabs[tab.id].currentNode;
            chrome.tabs.sendMessage(tab.id, {type: "clicked"}, result => {
                const node = current.insert(info.linkUrl);
                tabs[tab.id].nodes[info.linkUrl] = node;
                node.title = result.text;
                node.favIconUrl = current.favIconUrl;
                node.preview = true;
            });
        }
    }
});

chrome.tabs.onCreated.addListener(tab => tabs[tab.id] = new Tab(tab.url));

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    for (const key in changeInfo)
        if (changeInfo.hasOwnProperty(key) && tabs[tabId])
            tabs[tabId].update(key, changeInfo[key]);
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    tabs[addedTabId] = tabs[removedTabId];
    chrome.tabs.get(addedTabId, tab => {
        const node = tabs[addedTabId].updateCurrent(tabs[addedTabId].currentNode.insert(tab.url));
        tabs[addedTabId].nodes[tab.url] = node;
        if (tab.favIconUrl) node.favIconUrl = tab.favIconUrl;
        if (tab.title) node.title = tab.title;
    });
    delete tabs[removedTabId];
});

chrome.tabs.onRemoved.addListener(tabId => delete tabs[tabId]);

const addNode = (node) => ({
    title: node.title,
    url: node.url,
    preview: node.preview,
    id: node.id,
    favIconUrl: node.favIconUrl || false,
    children: node.children && node.children.length ? node.children.map(child => addNode(child)) : undefined
});

function sendTree(tabId, command) {
    const tab = tabs[tabId];
    const currentId = command ? move(tab, command) : tab.currentId;
    const tree = d3_hierarchy.hierarchy(addNode(tab.rootNode));
    const root = d3_hierarchy.tree().nodeSize([nodeWidth, nodeHeight])(tree);

    let minX = 0, maxX = 0;
    root.each(node => {
        if (node.x < minX) minX = node.x;
        else if (node.x > maxX) maxX = node.x;
    });

    const height = nodeHeight * (1 + root.height);
    const width = nodeWidth + maxX - minX;
    const nodes = root.descendants().map(node => ({
        position: {
            x: tab.nodes[node.data.url].x = node.x =
                node.x - minX + nodeWidth / 2.0,
            y: tab.nodes[node.data.url].y = node.y =
                node.y + imageSize / 2.0
        },
        data: node.data,
        id: node.data.id
    }));

    let i = tab.i;
    const links = root.links().map(link => ({
        source: {
            x: link.source.x,
            y: link.source.y
        },
        target: {
            x: link.target.x,
            y: link.target.y
        },
        id: i++
    }));

    const data = {
        type: 'tree',
        links: links,
        nodes: nodes,
        nodeWidth: nodeWidth,
        width: width,
        height: height,
        imageSize: imageSize,
        current: {
            id: currentId,
            x: tab.currentNode.x,
            y: tab.currentNode.y
        }
    };

    chrome.tabs.sendMessage(tabId, data, update =>
        chrome.tabs.get(tabId, tab => {
            SELECTING = false;
            const url = update.url || tabs[tabId].currentNode.url;
            if (url !== tab.url) chrome.tabs.update(tabId, {url: url});
        })
    );
}

function move(tab, command) {
    const current = tab.currentNode;
    let currentId = current.id;

    // parent becomes current
    if (command === 'move-up') {
        if (current.parent) currentId = tab.updateCurrent(current.parent).id;
    }

    // randomly choose whether to veer left or right
    // what *is* design?
    else if (command === 'move-down') {
        if (current.children && current.children.length > 0) {
            // TODO: think about this more
            const index = Math.floor((current.children.length - 0.5 + Math.random()) / 2.0);
            currentId = tab.updateCurrent(current.children[index]).id;
        }
    }

    // right sibling becomes current
    else if (command === 'move-right') {
        if (current.index !== false && current.parent.children.length > 1 + current.index)
            currentId = tab.updateCurrent(current.parent.children[current.index + 1]).id;
    }

    // left sibling becomes current
    else if (command === 'move-left') {
        if (current.index !== false && current.index > 0 && current.parent.children.length > 1)
            currentId = tab.updateCurrent(current.parent.children[current.index - 1]).id;
    }

    return currentId;
}

function sendCommand(tabId, command) {
    const tab = tabs[tabId];
    const currentId = move(tab, command);

    chrome.tabs.sendMessage(tabId, {
        type: 'move',
        current: {
            id: currentId,
            x: tab.currentNode.x,
            y: tab.currentNode.y
        }
    });
}

chrome.commands.onCommand.addListener(command => {
    chrome.tabs.query({active: true, currentWindow: true}, activeTabs => {
        if (SELECTING) sendCommand(activeTabs[0].id, command);
        else {
            SELECTING = true;
            sendTree(activeTabs[0].id, command);
        }
    });
});