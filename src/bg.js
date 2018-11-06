(function () {
    browser.storage.local.get().then(result => {
        if (result.normalMode === undefined) {
            browser.storage.local.set({normalMode: true, privateMode: true});
        }

        if (result.autoMute === undefined) {
            browser.storage.local.set({autoMute: true})
        }
    });

    toggleIcon();
    browser.tabs.onCreated.addListener(autoMute);
    browser.browserAction.onClicked.addListener(toggleAutoMute);
})();

function autoMute(tab) {
    browser.storage.local.get().then(result => {
        const normalMode = result.normalMode;
        const privateMode = result.privateMode;

        if (result.autoMute && ((tab.incognito && privateMode) || (!tab.incognito && normalMode))) {
            browser.tabs.update(tab.id, {
                muted: true
            });
        }
    });
}

function toggleAutoMute() {
    browser.storage.local.get().then(result => {
        browser.storage.local.set({autoMute: !result.autoMute})
        toggleIcon();
    });
}

function toggleIcon() {
    browser.storage.local.get().then(result => {
        chrome.browserAction.setIcon({
            path: result.autoMute ? 'Icons/icon_muted.svg' : 'Icons/icon_unmuted.svg'
        });
    });
}