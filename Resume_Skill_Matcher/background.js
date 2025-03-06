chrome.contextMenus.create({
  title: "Analyze Job Skills",
  contexts: ["page"],
  onclick: function (info, tab) {
    chrome.tabs.sendMessage(tab.id, { action: "analyzeJob" });
  },
});
