const config = {
  defaultScheme: 'Test',
  defaultHost: 'Test',
  defaultPort: 'Test',
  defaultUsername: 'Test',
  defaultPassword: 'Test'
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('VPN Extension Installed');
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['proxyConfig'], (data) => {
    if (data.proxyConfig && data.proxyConfig.enabled) {
      setProxy(data.proxyConfig);
    }
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.proxyConfig) {
    setProxy(changes.proxyConfig.newValue);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setProxy') {
    setProxy(message.config, sendResponse);
    return true;
  }
});

function setProxy(proxyConfig, callback) {
  const port = proxyConfig.port ? parseInt(proxyConfig.port) : parseInt(config.defaultPort);
  if (proxyConfig.enabled) {
    const proxyAuthHeader = `Basic ${btoa(`${proxyConfig.username}:${proxyConfig.password}`)}`;

    // Обновление правил для декларативного сетевого запроса
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'Proxy-Authorization', operation: 'set', value: proxyAuthHeader }
            ]
          },
          condition: {
            urlFilter: '*',
            resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest']
          }
        }
      ]
    });

    // Установка прокси настроек
    chrome.proxy.settings.set(
        {
          value: {
            mode: 'fixed_servers',
            rules: {
              singleProxy: {
                scheme: proxyConfig.scheme || config.defaultScheme,
                host: proxyConfig.host || config.defaultHost,
                port: port
              }
            }
          },
          scope: 'regular'
        },
        () => {
          console.log('Proxy set to', proxyConfig);
          if (callback) callback();
        }
    );

  } else {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      console.log('Proxy settings cleared');
      if (callback) callback();
    });

    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] });
  }
}
