function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function sendRequest() {
    let dataSource = document.getElementById('url').value;
    let inputPath = document.getElementById('path').value;

    if (dataSource === "" || dataSource == null) {
        return;
    }

    let {path, server, token} = await chrome.storage.sync.get(['path', 'server', 'token']);

    if (path !== inputPath) {
        chrome.storage.sync.set({'path': inputPath}, () => {
            console.log('path set successed!');
        });
    }

    if (!server) {
        document.getElementById('download').innerHTML = "Please set server";
        sleep(3000).then(() => {
            document.getElementById('download').innerHTML = "Download";
        });
        return;
    }

    let data = {"dataSource": dataSource, "path": inputPath};
    try {
        let response = await fetch(`${server}/api/v1/download`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (response.status === 200) {
            document.getElementById('download').innerHTML = "OK";
            sleep(3000).then(() => {
                document.getElementById('url').value = "";
                document.getElementById('download').innerHTML = "Download";
            });
        } else {
            document.getElementById('download').innerHTML = await response.text();
            sleep(3000).then(() => {
                document.getElementById('download').innerHTML = "Download";
            });
        }
    } catch (error) {
        document.getElementById('download').innerHTML = error;
        sleep(3000).then(() => {
            document.getElementById('download').innerHTML = "Download";
        });
    }
}

async function saveConfig() {
    let serverInput = document.getElementById('server');
    let serverValue = serverInput.value;
    let saveBtn = document.getElementById('save');

    let authEnable = document.getElementById('auth').checked;
    let token = document.getElementById('token').value;

    let captureCookies = document.getElementById('capture_cookies').checked;

    saveBtn.classList.add('btn-loading');
    try {
        let response = await fetch(`${serverValue}/healthz`, {
            method: 'GET',
            mode: 'cors',
        });

        if (response.ok) {
            saveBtn.classList.remove('btn-loading');
            saveBtn.classList.add('btn-success');
            saveBtn.innerHTML = 'OK';
            await chrome.storage.sync.set({
                server: serverValue,
                auth: authEnable,
                token: token,
                captureCookies: captureCookies,
            });
            await sleep(3000);
            saveBtn.classList.remove('btn-success');
            saveBtn.innerHTML = 'Save';
        } else {
            saveBtn.classList.remove('btn-loading');
            saveBtn.classList.add('btn-danger');
            saveBtn.innerHTML = await response.text();
            await sleep(3000);
            saveBtn.classList.remove('btn-danger');
            saveBtn.innerHTML = 'Save';
        }
    } catch (error) {
        saveBtn.classList.remove('btn-loading');
        saveBtn.classList.add('btn-danger');
        saveBtn.innerHTML = error;
        await sleep(3000);
        saveBtn.classList.remove('btn-danger');
        saveBtn.innerHTML = 'Save';
    }
}

function openGitHub() {
    chrome.tabs.create({url: "https://github.com/opennaslab/kubespider"});
}

async function refreshDownload() {
    let refreshBtn = document.getElementById('refresh');
    let {server, token} = await chrome.storage.sync.get(['server', 'token']);
    if (!server) return;

    refreshBtn.classList.add('btn-loading');
    refreshBtn.innerHTML = 'Refreshing...';
    try {
        let response = await fetch(`${server}/api/v1/refresh`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        if (response.ok) {
            refreshBtn.classList.remove('btn-loading');
            refreshBtn.classList.add('btn-success');
            refreshBtn.innerHTML = 'OK';
            await sleep(3000);
            refreshBtn.classList.remove('btn-success');
            refreshBtn.innerHTML = 'Refresh';
        } else {
            refreshBtn.classList.remove('btn-loading');
            refreshBtn.classList.add('btn-danger');
            refreshBtn.innerHTML = await response.text();
            await sleep(3000);
            refreshBtn.classList.remove('btn-danger');
            refreshBtn.innerHTML = 'Refresh';
        }
    } catch (error) {
        refreshBtn.classList.remove('btn-loading');
        refreshBtn.classList.add('btn-danger');
        refreshBtn.innerHTML = error;
        await sleep(3000);
        refreshBtn.classList.remove('btn-danger');
        refreshBtn.innerHTML = 'Refresh';
    }
}

async function displayAuthInfoInput(event) {
    let authInput = document.getElementById('auth')
    let inputGroup = document.getElementById('authInputGroup')
    inputGroup.hidden = !authInput.checked;
}

/**
 * read chrome store config
 */
chrome.storage.sync.get(['server', 'path', 'auth', 'token', 'captureCookies']).then((res) => {
    // check enable auth & change style
    if (res.auth) {
        document.getElementById('auth').checked = res.auth;
        let inputGroup = document.getElementById('authInputGroup')
        inputGroup.hidden = !res.auth;
    }
    // read config
    if (res.token) {
        document.getElementById('token').value = res.token;
    }
    if (res.server) {
        document.getElementById('server').value = res.server;
    }
    if (res.path) {
        document.getElementById('path').value = res.path;
    }
    if (res.captureCookies) {
        document.getElementById('capture_cookies').checked = res.captureCookies;
    }
})

document.getElementById('download').addEventListener('click', sendRequest);
document.getElementById('save').addEventListener('click', saveConfig);
document.getElementById('openGitHub').addEventListener('click', openGitHub);
document.getElementById('refresh').addEventListener('click', refreshDownload);
document.getElementById('auth').addEventListener('change', displayAuthInfoInput);
