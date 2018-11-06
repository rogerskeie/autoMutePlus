(function () {
    document.getElementById('title').textContent = browser.i18n.getMessage('options');
    document.getElementById('label1').textContent = browser.i18n.getMessage('normal');
    document.getElementById('label2').textContent = browser.i18n.getMessage('private');
    document.addEventListener('DOMContentLoaded', restoreOptions);
    document.getElementById('optionsForm').addEventListener('change', saveOptions);
})();

function saveOptions() {
    browser.storage.local.set({
        normalMode: document.getElementById('normalMode').checked,
        privateMode: document.getElementById('privateMode').checked,
        autoMute: document.getElementById('autoMute').checked
    });
}

function restoreOptions() {
    browser.storage.local.get().then(result => {
        document.getElementById('normalMode').checked = result.normalMode;
        document.getElementById('privateMode').checked = result.privateMode;
        document.getElementById('autoMute').checked = result.autoMute;
    });
}
