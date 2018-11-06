(function () {
    document.getElementById('title').textContent = browser.i18n.getMessage('options');
    document.getElementById('label1').textContent = browser.i18n.getMessage('normal');
    document.getElementById('label2').textContent = browser.i18n.getMessage('private');
    document.getElementById('label3').textContent = browser.i18n.getMessage('whitelist');
    document.addEventListener('DOMContentLoaded', restoreOptions);
    document.getElementById('optionsForm').addEventListener('change', saveOptions);

    whitelist = document.getElementById('whitelist');

    if (whitelist.addEventListener) {
        whitelist.addEventListener('input', saveOptions, false);
    }
})();

function saveOptions() {
    var whitelistContents = document.getElementById('whitelist').value;
    displayRegexWarning(whitelistContents, 'whitelist');

    browser.storage.local.set({
        normalMode: document.getElementById('normalMode').checked,
        privateMode: document.getElementById('privateMode').checked,
        whitelist: whitelistContents
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
    });
}
