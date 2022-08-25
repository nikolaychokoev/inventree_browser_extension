(function() {
    'use strict';

//   if(typeof(String.prototype.trim) === "undefined")
//   {
//       String.prototype.trim = function() 
//       {
//           return String(this).replace(/^\s+|\s+$/g, '');
//       };
//   }
    var product = {};

    let snipfn = function() {
    console.log("dbg1")

    product = {
        'mouserNo': document.querySelector("#spnMouserPartNumFormattedForProdInfo").textContent.trim(),
        'imageUrl': document.querySelector("#defaultImg").src.trim(),
        //'partUrl': row.cells[1].querySelector('#row_MPN a').href,
        'mfrNo': document.querySelector("#spnManufacturerPartNumber").textContent.trim(),
        'mfr': document.querySelector("#lnkManufacturerName").textContent.trim(),
        'desc': document.querySelector("#spnDescription").textContent.trim(),
        //'orderQty': row.cells[3].textContent,
        //'priceEur': row.cells[4].textContent.slice(0, -2),
        //'status': row.cells[6].querySelector('tr').firstElementChild.textContent.trim().replace('\n', ' '),
        //'invoiceNo': row.cells[6].querySelector('tr a').textContent,
    };
    console.log(product);
  }


  snipfn();

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "getDOM") {
        console.log("getDOM");
        sendResponse({data: document});
    }
    else if (request.action == "getProduct") {
        console.log("product");
        sendResponse({data: product});
    }
    else {
        sendResponse({}); // Send nothing..
    }
});


})();



