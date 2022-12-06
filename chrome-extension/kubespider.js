function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function sendRequest() {
    var dataSource = document.getElementById('url').value
    var path = document.getElementById('path').value
    var server = document.getElementById('server').value

    chrome.storage.sync.get('server', (res) => {
        if (res != server) {
            chrome.storage.sync.set({'server': server}, () => {
                console.log('server set successed!');
            });
        }
    });

    chrome.storage.sync.get('path', (res) => {
        if (res != path) {
            chrome.storage.sync.set({'path': path}, () => {
                console.log('path set successed!');
            });
        }
    })

    if (dataSource == "" || dataSource == null || server == null || server == "") {
        return
    }
    
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('POST', server, true);
    httpRequest.setRequestHeader("Content-type","application/json");
    data = "{\"dataSource\":\"" + dataSource + "\",\"path\":\"" + path + "\"}"
    httpRequest.send(data);

    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            document.getElementById('download').innerHTML = "OK"
            sleep(3000).then(() => {
                document.getElementById('url').value = "";
                document.getElementById('path').value = "";
                document.getElementById('download').innerHTML = "Download"
            })
        } else {
            document.getElementById('download').innerHTML = httpRequest.responseText
            sleep(3000).then(() => {
                document.getElementById('download').innerHTML = "Download"
            })
        }
    };
}

chrome.storage.sync.get('server', (res) => {
    if (typeof res.server === "undefined") {
        document.getElementById('server').value = "";
        return
    }
    document.getElementById('server').value = res.server;
});

chrome.storage.sync.get('path', (res) => {
    if (typeof res.path === "undefined") {
        document.getElementById('path').value = "";
        return
    }
    document.getElementById('path').value = res.path;
})

document.getElementById('download').addEventListener('click', sendRequest)