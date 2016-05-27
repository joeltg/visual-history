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
    constructor(tab) {
        tabs[tab.id] = this;
        this.currentId = this.i = 0;
        this.nodes = {};
        this.rootNode = this.currentNode = new Node(tab.url, this);
    }
    replaceTab(addedTabId) {
        tabs[addedTabId] = this;
        chrome.tabs.get(addedTabId, tab => {
            const node = this.updateCurrent(this.currentNode.insert(tab.url));
            if (tab.favIconUrl) node.favIconUrl = tab.favIconUrl;
            if (tab.title) node.title = tab.title;
        });
    }
    updateProps(tab, update) {
        if (update.url) {
            if (this.currentNode.url !== update.url) {
                if (this.nodes[update.url]) this.updateCurrent(this.nodes[update.url]);
                else this.updateCurrent(this.currentNode.insert(update.url));
            }
        }
        const current = this.currentNode;
        if (tab.title) current.title = tab.title;
        if (tab.favIconUrl) current.favIconUrl = tab.favIconUrl;
    }
    updateCurrent(currentNode) {
        // handle reassigning all the current id and node pointers
        // and return the new node for easy chaining later
        currentNode.current = true;
        currentNode.preview = false;
        this.currentNode.current = false;
        this.currentNode = currentNode;
        this.currentId = currentNode.id;
        return currentNode;
    }
}

class Node {
    // we have to pass the parent tab around
    // to keep track of tab-scoped node IDs.
    constructor(url, tab) {
        tab.nodes[url] = this;
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
    remove() {
        if (this.parent && this.index !== false) {
            this.parent.children.splice(this.index, 1);
            delete this;
        }
    }
}

chrome.browserAction.onClicked.addListener(tab => {
    if (SELECTING) {
        // SELECTING will get reset to false when content.js evaluates its callback closure.
        chrome.tabs.sendMessage(tab.id, {type: 'close'});
    }
    else {
        SELECTING = true;
        const tree = makeTree(tab.id, false);
        sendTree(tab.id, tree);
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
                node.title = result.text;
                node.favIconUrl = current.favIconUrl;
                node.preview = true;
            });
        }
    }
});

chrome.tabs.onCreated.addListener(tab => new Tab(tab));

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabs[tabId]) tabs[tabId].updateProps(tab, changeInfo);
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    tabs[removedTabId].replaceTab(addedTabId);
    delete tabs[removedTabId];
});

chrome.tabs.onRemoved.addListener(tabId => delete tabs[tabId]);

const addNode = (node) => ({
    title: node.title,
    url: node.url,
    preview: node.preview || !node.favIconUrl,
    id: node.id,
    favIconUrl: node.favIconUrl || node.parent.favIconUrl || false,
    children: node.children &&
        node.children.length ?
            node.children.map(child => addNode(child)) :
            undefined
});

function makeTree(tabId, command) {
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

    return {
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
}

function sendTree(tabId, data) {
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
        if (current.parent) {
            const siblings = current.parent.children, index = current.index;
            if (index !== false && siblings.length > 1  + index)
                currentId = tab.updateCurrent(siblings[index + 1]).id;
        }
    }

    // left sibling becomes current
    else if (command === 'move-left') {
        if (current.parent) {
            const siblings = current.parent.children, index = current.index;
            if (index && siblings.length > 1)
                currentId = tab.updateCurrent(siblings[index - 1]).id;
        }
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
        const id = activeTabs[0].id;
        if (SELECTING) sendCommand(id, command);
        else {
            SELECTING = true;
            const tree = makeTree(id, command);
            sendTree(id, tree);
        }
    });
});