(function () {
    document.getElementById('title').textContent = browser.i18n.getMessage('options');
    document.getElementById('label1').textContent = browser.i18n.getMessage('normal');
    document.getElementById('label2').textContent = browser.i18n.getMessage('private');
    document.getElementById('label3').textContent = browser.i18n.getMessage('whitelist');
    document.getElementById('label4').textContent = browser.i18n.getMessage('blacklist');
    document.addEventListener('DOMContentLoaded', restoreOptions);
    document.getElementById('optionsForm').addEventListener('change', saveOptions);

    var whitelist = document.getElementById('whitelist');
    var blacklist = document.getElementById('blacklist');

    if (whitelist.addEventListener) {
        whitelist.addEventListener('input', saveOptions, false);
    }

    if (blacklist.addEventListener) {
        blacklist.addEventListener('input', saveOptions, false);
    }
})();

function saveOptions() {
    var whitelistContents = document.getElementById('whitelist').value;
    var blacklistContents = document.getElementById('blacklist').value;
    displayRegexWarning(whitelistContents, 'whitelist');
    displayRegexWarning(blacklistContents, 'blacklist');

    browser.storage.local.set({
        normalMode: document.getElementById('normalMode').checked,
        privateMode: document.getElementById('privateMode').checked,
        whitelist: whitelistContents,
        blacklist: blacklistContents
    });
}

function displayRegexWarning(listContents, type) {
    var lines = listContents.split('\n');
    var warningElement = document.getElementById(type + '-warning');
    warningElement.innerHTML = '';

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
            continue;
        }

        try {
            new RegExp(lines[i], 'i');
        } catch (e) {
            warningElement.innerHTML =  'Invalid regular expression "' + lines[i] + '".';
            break;
        }
    }
}

function restoreOptions() {
    browser.storage.local.get().then(result => {
        document.getElementById('normalMode').checked = result.normalMode;
        document.getElementById('privateMode').checked = result.privateMode;
        document.getElementById('whitelist').value = result.whitelist;
        document.getElementById('blacklist').value = result.blacklist;
    });
}
