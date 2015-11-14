
chrome.tabs.onCreated.addListener(function(tab) {
    
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // changeInfo has {string url (only if changed), string favIconUrl, string title}

});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {

});

chrome.tabs.onReplaced.addListener(function(addedtabId, removedTabId) {

});

