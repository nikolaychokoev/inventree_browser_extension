const form = document.getElementById("control-row");
const go = document.getElementById("go");
const input = document.getElementById("input");
const message = document.getElementById("message");
const selectLocationsDropDown = document.getElementById("selectLocations");
const selectCategoryDropDown = document.getElementById("selectCategory");
const selectQuantityDropDown = document.getElementById("selectQuantity");

const part_image = document.getElementById("part-image");

var stock_items = [];
var cur_part = {};

function addTable(where, data) {
    var c, r, t;
    t = document.createElement('table');
    var row = 0;
    for (const key in data) {
        if(key == "imageUrl") continue;        
        r = t.insertRow(row);
        c = r.insertCell(0);
        c.innerHTML = key;
        c = r.insertCell(1);
        c.innerHTML = data[key];
        row++;
    }
    
    document.getElementById(where).appendChild(t);
}

function sendTabsMessage(tabId, request) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, request, (response) => {
        if (response) {
          resolve(response)
        }
        else {
          reject(response)
        }
      });
    })
}
function sendRuntimeMessage(request) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(request, (response) => {
        if (response) {
          resolve(response)
        }
        else {
          reject(response)
        }
      });
    })
}

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
    var itBaseUrl = "http://<inventree_url_here>";
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            input.value = url.hostname;
        } catch {}
    }

    let response = await sendRuntimeMessage({method: "init", tabId: tab.id});
    response = await sendTabsMessage(tab.id, {action: "getDOM"});
    response = await sendTabsMessage(tab.id, {action: "getProduct"});
    console.log(response.data);
    const img = document.createElement('img');
    img.src = response.data.imageUrl;
    part_image.append(img);
    addTable("part-table", response.data);
    var partName = response.data.mfrNo;

    var locations = {};
    var categories = {};
    response = await sendRuntimeMessage({method: "getLocations", itBaseUrl: itBaseUrl, tabId: tab.id});
    if(response.status == 'ok') {
        for (let key in response.data) {
            let option = document.createElement("option");
            let obj = response.data[key]
            option.setAttribute('value', obj["url"]);
    
            let optionText = document.createTextNode(obj["pathstring"]);
            option.appendChild(optionText);
            locations[obj["pk"]] = obj["pathstring"];
    
            selectLocationsDropDown.appendChild(option);    
        }
    }

    response = await sendRuntimeMessage({method: "getCategories", itBaseUrl: itBaseUrl, tabId: tab.id});
    if(response.status == 'ok') {
        for (let key in response.data) {
            let option = document.createElement("option");
            let obj = response.data[key]
            option.setAttribute('value', obj["url"]);
    
            let optionText = document.createTextNode(obj["pathstring"]);
            option.appendChild(optionText);
            categories[obj["pk"]] = obj["pathstring"];;

            selectCategoryDropDown.appendChild(option);    
        }
    }

    response = await sendRuntimeMessage({method: "getPart", itBaseUrl: itBaseUrl, partName: partName, tabId: tab.id});
    if(response.status == 'ok') {
        var c, r, t;
        t = document.createElement('table');
        var row = 1;
        var h = t.createTHead();
        var hr = h.insertRow(0);

        var hc = hr.insertCell(0);
        hc.innerHTML = "";

        var hc = hr.insertCell(1);
        hc.innerHTML = "IPN";
        hc = hr.insertCell(2);
        hc.innerHTML = "Name";
        hc = hr.insertCell(3);
        hc.innerHTML = "In Stock";
        hc = hr.insertCell(4);
        hc.innerHTML = "Category";
        for (let idx in response.data) {
            stock_items.push(response.data[idx]);
            r = t.insertRow(row);
            var f = '<input type="checkbox" name="checkbox_stock" value="' + response.data[idx].pk +'">';
            c = r.insertCell(0);
            c.innerHTML = f;

            c = r.insertCell(1);
            c.innerHTML = response.data[idx].IPN;

            c = r.insertCell(2);
            c.innerHTML = response.data[idx].full_name;

            c = r.insertCell(3);
            c.innerHTML = response.data[idx].in_stock;

            c = r.insertCell(4);
            c.innerHTML = categories[response.data[idx].category];
            row++;

            for (var i = 0; i < selectCategoryDropDown.options.length; i++) {
                selectCategoryDropDown.options[i].selected = false;
                if (selectCategoryDropDown.options[i].text == categories[response.data[idx].category]) {
                    selectCategoryDropDown.options[i].selected = true;
                }
            }
        }
        document.getElementById("it-parts").appendChild(t);
    }

    response = await sendRuntimeMessage({method: "getStock", itBaseUrl: itBaseUrl, partName: partName, tabId: tab.id});
    if(response.status == 'ok') {
        var c, r, t;
        t = document.createElement('table');
        var h = t.createTHead();
        var hr = h.insertRow(0);
        var hc = hr.insertCell(0);
        hc.innerHTML = "Location";
        hc = hr.insertCell(1);
        hc.innerHTML = "Qty";
        var row = 1;
        for (let idx in response.data) {
            r = t.insertRow(row);
            c = r.insertCell(0);
            c.innerHTML = locations[response.data[idx].location];
            c = r.insertCell(1);
            c.innerHTML = response.data[idx].quantity;

            row++;

            for (var i = 0; i < selectLocationsDropDown.options.length; i++) {
                selectLocationsDropDown.options[i].selected = false;
                if (selectLocationsDropDown.options[i].text == locations[response.data[idx].location]) {
                    selectLocationsDropDown.options[i].selected = true;
                }
            }
        }
        document.getElementById("it-locations").appendChild(t);
    }

    var checkboxes = document.getElementsByName('checkbox_stock');
    console.log(checkboxes);
    checkboxes.forEach((item) => {
        item.addEventListener("change", checkboxMutex);
    })
    
    selectQuantityDropDown.value = 1;
    input.focus();
})();


function checkboxMutex()
{
    var checkboxes = document.getElementsByName('checkbox_stock');
    checkboxes.forEach((item) => {
        if (item !== this) item.checked = false;
    })
}

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();

    var checked_cb = -1;
    var checkboxes = document.getElementsByName('checkbox_stock');
    checkboxes.forEach((item) => {
        if (item.checked ) {
            checked_cb = item.value; 
        }
    })

    const selitem = stock_items.filter(item => item.pk == checked_cb);
    var qty = selectQuantityDropDown.value;
    var loc = selectLocationsDropDown.value;
    var cat = selectCategoryDropDown.value;

    if(selitem.length > 0)
        console.log("Selected: " + selitem[0]);
    else
        console.log("Selected: None");
    console.log("Category: " + cat);
    console.log("Location: " + loc);
    console.log("Qty: " + qty);
    
}


function setMessage(str) {
    message.textContent = str;
    message.hidden = false;
}

function clearMessage() {
    message.hidden = true;
    message.textContent = "";
}


