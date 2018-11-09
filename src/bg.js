(function () {
    browser.storage.local.get().then(result => {
        if (result.normalMode === undefined) {
            browser.storage.local.set({
                normalMode: true,
                privateMode: true,
                autoMute: true,
                whitelist: '',
                blacklist: ''
            });
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
    for (let line of listContents.split('\n')) {
        line = line.trim();

        if (line === '') {
            continue;
        }

        try {
            if ((new RegExp(line, 'i')).test(tab.url)) {
                return true;
            }
        } catch (e) {
            console.log(browser.i18n.getMessage('invalidRegex') + ' "' + line + '".');
        }
    }

    return false;
}