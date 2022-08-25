'use strict';


chrome.action.onClicked.addListener(function(tab) {
    console.log("init0");
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
});

async function itFetch(method, url) {
    // console.log(url);
    let response = await fetch(url, {  
        method: method,  
        headers: {  
            "AUTHORIZATION": "Token <token here>"  
        },  
    //        body: 'foo=bar&lorem=ipsum'  
    });

//    console.log(response);
    if (response.ok) { // if HTTP-status is 200-299
        let json = await response.json();
//        console.log('Request succeeded with JSON response', json);
        return {status: 'ok', data: json};
    } else {
        alert("HTTP-Error: " + response.status);
        return {status: 'error', data: response};
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
                
        if (request.method === "init") {
            chrome.scripting.executeScript({
                target: {tabId: request.tabId},
                files: ['content.js']
            });
            sendResponse({})
        }
        else if (request.method === "getLocations") {
            var url = request.itBaseUrl + "/api/stock/location/.*";
            itFetch('get', url).then((response) => sendResponse(response));
        }
        else if (request.method === "getCategories") {
            var url = request.itBaseUrl + "/api/part/category/";
            itFetch('get', url).then((response) => sendResponse(response));
        }
        else if (request.method === "getPart") {
            var url = request.itBaseUrl + "/api/part/.*?name_regex=" + request.partName;
            console.log(url);
            itFetch('get', url).then((response) => sendResponse(response));
        }
        else if (request.method === "getStock") {
            var url = request.itBaseUrl + "/api/stock/.*?name_regex=" + request.partName;
            itFetch('get', url).then((response) => sendResponse(response));
        }
        return true;
    }
);

chrome.runtime.onInstalled.addListener(function() {
  chrome.action.disable();

  chrome.declarativeContent.onPageChanged.removeRules(function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {urlPrefix: 'https://www.mouser.bg'}
          })
        ],
        actions: [new chrome.declarativeContent.ShowAction()]
      }
    ]);
  });
});
