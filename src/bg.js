(function () {
    browser.storage.local.get().then(result => {
        if (result.normalMode === undefined) {
            browser.storage.local.set({normalMode: true, privateMode: true});
        }

        if (result.autoMute === undefined) {
            browser.storage.local.set({autoMute: true});
        }

        if (result.whitelist === undefined) {
            browser.storage.local.set({whitelist: ''});
        }

        if (result.blacklist === undefined) {
            browser.storage.local.set({blacklist: ''});
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

        browser.tabs.query({currentWindow: true, active: true}).then(function (tabs) {
            var whitelisted = listMatchesTab(result.whitelist, tabs[0]);
            var blacklisted = listMatchesTab(result.blacklist, tabs[0]);

            if (
                blacklisted
                || (!whitelisted && result.autoMute && ((tab.incognito && privateMode) || (!tab.incognito && normalMode)))
            ) {
                browser.tabs.update(tab.id, {muted: true});
            }
        });

    });
}

function toggleAutoMute() {
    browser.storage.local.get().then(result => {
        browser.storage.local.set({autoMute: !result.autoMute});
        toggleIcon();
    });
}

function toggleIcon() {
    browser.storage.local.get().then(result => {
        browser.browserAction.setIcon({
            path: 'icons/icon_' + (result.autoMute ? 'muted' : 'unmuted') + '.svg'
        });
        browser.browserAction.setTitle({
            title: browser.i18n.getMessage((result.autoMute ? 'disable' : 'enable') + 'AutoMute')
        });
    });
}

function listMatchesTab(listContents, tab) {
    var lines = listContents.split('\n');

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
            continue;
        }

        try {
            if ((new RegExp(lines[i], 'i')).test(tab.url)) {
                return true;
            }
        } catch (e) {
            console.log(browser.i18n.getMessage('invalidRegex') + ' "' + lines[i] + '".');
        }
    }

    return false;
}