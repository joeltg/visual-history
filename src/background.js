const tabs = {};

class Tab {
    constructor(url) {
        this.url = url;
        this.root = new Node(null, url);
        this.map = {[url]: this.root};
    }
    update(key, value) {
        if (key === "url") {
            if (this.map.hasOwnProperty(value)) {
                this.url = value;
            } else {
                const node = new Node(this.map[this.url], value);
                this.map[this.url].children.push(node);
                this.map[value] = node;
                this.url = value;
            }
        } else {
            this.map[this.url][key] = value;
        }
    }
}

class Node {
    constructor(parent, url) {
        this.parent = parent;
        this.url = url;
        this.children = [];
    }
    serialize() {
        const children = this.children.map(child => child.serialize());
        const {url, favIconUrl, title} = this;
        return {children, url, favIconUrl, title};
    }
}

// browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (tabs.hasOwnProperty(request)) {
//         sendResponse(tabs[request].root.serialize());
//     }
// });

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("got request", request)
    browser.browserAction.openPopup()
    sendResponse("wow")
})

const keys = ["url", "title", "favIconUrl"];
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabs.hasOwnProperty(tabId)) {
        keys.forEach(key => {
            if (changeInfo.hasOwnProperty(key)) {
                tabs[tabId].update(key, changeInfo[key])
            }
        });
    }
});

browser.tabs.onCreated.addListener(tab => {
    const {id, url} = tab;
    tabs[id] = new Tab(url);
});

browser.tabs.onRemoved.addListener(tabId => {
    if (tabs.hasOwnProperty(tabId)) {
        delete tabs[tabId];
    }
});

browser.commands.onCommand.addListener(command => {
    console.log("command", command)
    console.log(browser.browserAction)
    browser.browserAction.openPopup()
})