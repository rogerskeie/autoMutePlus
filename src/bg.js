'use strict';

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

    createMenu([
        {
            id: 'addDomainToWhitelist',
            title: browser.i18n.getMessage('addDomainToWhitelist')
        },
        {
            id: 'addUrlToWhitelist',
            title: browser.i18n.getMessage('addUrlToWhitelist')
        },
        {
            id: 'addDomainToBlacklist',
            title: browser.i18n.getMessage('addDomainToBlacklist')
        },
        {
            id: 'addUrlToBlacklist',
            title: browser.i18n.getMessage('addUrlToBlacklist')
        },
        {
            id: 'muteAllTabs',
            title: browser.i18n.getMessage('muteAllTabs'),
            icons: {
                '16': 'icons/icon_muted.svg'
            }
        },
        {
            id: 'unmuteAllTabs',
            title: browser.i18n.getMessage('unmuteAllTabs'),
            icons: {
                '16': 'icons/icon_unmuted.svg'
            }
        }
    ]);

    browser.menus.onClicked.addListener((info, tab) => {
        if (info.menuItemId.endsWith('muteAllTabs')) {
            setTabMutes(info.menuItemId === 'muteAllTabs');
        } else {
            const url = new URL(tab.url);
            let action;
            let listType;
            [action, listType] = info.menuItemId.split('To');
            addItemToList(escapeRegExp(action === 'addDomain' ? url.hostname : url.href), listType.toLowerCase());
        }
    });

    toggleIcon();
    browser.tabs.onCreated.addListener(createdListener);
    browser.browserAction.onClicked.addListener(toggleAutoMute);
})();

function createMenu(items) {
    items.forEach((item) => {
        item.parentId = 'autoMutePlus';
        browser.menus.create(item);
    });
}

function setTabMutes(muted) {
    browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
            setMuted(tab.id, muted);
        });
    });
}

function setMuted(tabId, muted) {
    browser.tabs.update(tabId, {muted: muted});
}

function addItemToList(item, listType) {
    listType = listType.toLowerCase();

    browser.storage.local.get().then(result => {
        const listContents = result[listType].trim();
        let keys = {};
        const needsNewline = listContents !== '';
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
        const whitelisted = listMatchesTab(result.whitelist, tab);
        const blacklisted = listMatchesTab(result.blacklist, tab);

        if (
            blacklisted
            || (!whitelisted && result.autoMute && ((tab.incognito && privateMode) || (!tab.incognito && normalMode)))
        ) {
            setMuted(tab.id, true);
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