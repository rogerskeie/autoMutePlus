'use strict';

(function () {
    browser.storage.local.get().then(result => {
        if (result.normalMode === undefined) {
            browser.storage.local.set({
                normalMode: true,
                privateMode: true,
                darkTheme: false,
                autoMute: true,
                whitelist: '',
                blacklist: ''
            });
        }

        toggleIcon();
    });

    createMenu([
        {
            id: 'autoMutePlus',
            titleKey: 'extensionName'
        },
        {
            id: 'addDomainToWhitelist',
            titleKey: 'addDomainToWhitelist'
        },
        {
            id: 'addUrlToWhitelist',
            titleKey: 'addUrlToWhitelist'
        },
        {
            id: 'addDomainToBlacklist',
            titleKey: 'addDomainToBlacklist'
        },
        {
            id: 'addUrlToBlacklist',
            titleKey: 'addUrlToBlacklist'
        },
        {
            id: 'muteAllTabs',
            titleKey: 'muteAllTabs',
            icons: {
                '16': 'icons/icon_muted.svg'
            }
        },
        {
            id: 'unmuteAllTabs',
            titleKey: 'unmuteAllTabs',
            icons: {
                '16': 'icons/icon_unmuted.svg'
            }
        }
    ]);

    browser.menus.onClicked.addListener(menuListener);
    browser.tabs.onCreated.addListener(createdListener);
    browser.browserAction.onClicked.addListener(toggleAutoMute);
})();

function createMenu(items) {
    items.forEach(item => {
        if (item.id !== 'autoMutePlus') {
            item.parentId = 'autoMutePlus';
        }

        item.title = browser.i18n.getMessage(item.titleKey);
        delete item.titleKey;
        browser.menus.create(item);
    });
}

function menuListener(info, tab) {
    if (info.menuItemId.endsWith('muteAllTabs')) {
        setTabMutes(info.menuItemId === 'muteAllTabs');
    } else {
        const url = new URL(tab.url);
        let action;
        let listType;
        [action, listType] = info.menuItemId.split('To');
        addItemToList(escapeRegExp(action === 'addDomain' ? url.hostname : url.href), listType.toLowerCase());
    }
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

function setTabMutes(muted) {
    browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
            setMuted(tab.id, muted);
        });
    });
}

function setMuted(tabId, muted) {
    browser.tabs.update(tabId, {muted: muted});
}

function addItemToList(item, listType) {
    listType = listType.toLowerCase();

    browser.storage.local.get(listType).then(result => {
        const listContents = result[listType].trim();
        let keys = {};
        const needsNewline = listContents !== '';
        keys[listType] = listContents + (needsNewline ? '\n' : '') + item;
        browser.storage.local.set(keys);
    });
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
    browser.storage.local.get('autoMute').then(result => {
        browser.storage.local.set({autoMute: !result.autoMute});
        toggleIcon();
    });
}

function toggleIcon() {
    browser.storage.local.get(['autoMute', 'darkTheme']).then(result => {
        browser.browserAction.setIcon({
            path: 'icons/icon_' + (result.autoMute ? 'muted' : 'unmuted') + (result.darkTheme ? '_dark' : '') + '.svg'
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