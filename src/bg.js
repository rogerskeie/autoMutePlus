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

    browser.menus.create({
        id: 'autoMutePlus',
        title: browser.i18n.getMessage('extensionName')
    });

    browser.menus.create({
        id: 'addDomainToWhitelist',
        parentId: 'autoMutePlus',
        title: browser.i18n.getMessage('addDomainToWhitelist')
    });

    browser.menus.create({
        id: 'addUrlToWhitelist',
        parentId: 'autoMutePlus',
        title: browser.i18n.getMessage('addUrlToWhitelist')
    });

    browser.menus.create({
        id: 'addDomainToBlacklist',
        parentId: 'autoMutePlus',
        title: browser.i18n.getMessage('addDomainToBlacklist')
    });

    browser.menus.create({
        id: 'addUrlToBlacklist',
        parentId: 'autoMutePlus',
        title: browser.i18n.getMessage('addUrlToBlacklist')
    });

    toggleIcon();
    browser.tabs.onCreated.addListener(createdListener);
    browser.browserAction.onClicked.addListener(toggleAutoMute);
    browser.menus.onClicked.addListener((info, tab) => {
        var url = new URL(tab.url);
        [action, listType] = info.menuItemId.split('To');
        addItemToList(escapeRegExp(action === 'addDomain' ? url.hostname : url.href), listType.toLowerCase());
    });
})();

function addItemToList(item, listType) {
    listType = listType.toLowerCase();

    browser.storage.local.get().then(result => {
        var listContents = result[listType].trim();
        var keys = {};
        var needsNewline = listContents !== '' && !listContents.endsWith('\n');
        keys[listType] = listContents + (needsNewline ? '\n' : '') + item;
        browser.storage.local.set(keys);
    });
}

function createdListener(tab) {
    if (tab.url === 'about:newtab') {
        autoMute(tab);
    } else {
        browser.tabs.onUpdated.addListener(updatedListener);
    }
}

function updatedListener(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading' && tab.url !== 'about:blank') {
        autoMute(tab);
        browser.tabs.onUpdated.removeListener(updatedListener);
    }
}

function autoMute(tab) {
    browser.storage.local.get().then(result => {
        const normalMode = result.normalMode;
        const privateMode = result.privateMode;
        var whitelisted = listMatchesTab(result.whitelist, tab);
        var blacklisted = listMatchesTab(result.blacklist, tab);

        if (
            blacklisted
            || (!whitelisted && result.autoMute && ((tab.incognito && privateMode) || (!tab.incognito && normalMode)))
        ) {
            browser.tabs.update(tab.id, {muted: true});
        }
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

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}