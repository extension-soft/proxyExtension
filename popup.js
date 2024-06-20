document.addEventListener('DOMContentLoaded', function () {
  const connectButton = document.getElementById('connectButton');
  const statusDiv = document.getElementById('status');
  const currentURLDiv = document.getElementById('currentURL');
  const errorMessageDiv = document.getElementById('errorMessage');

  chrome.storage.sync.get('proxyConfig', (data) => {
    const isProxyEnabled = data.proxyConfig && data.proxyConfig.enabled;
    updateUI(isProxyEnabled);
  });

  connectButton.addEventListener('click', () => {
    chrome.storage.sync.get('proxyConfig', (data) => {
      const proxyConfig = data.proxyConfig || {
        scheme: 'Test',
        host: 'Test',
        port: 'Test',
        username: 'Test',
        password: 'Test',
        enabled: false
      };

      proxyConfig.enabled = !proxyConfig.enabled;

      chrome.runtime.sendMessage({ action: 'setProxy', config: proxyConfig }, (response) => {
        chrome.storage.sync.set({ proxyConfig: proxyConfig }, () => {
          if (proxyConfig.enabled) {
            updateUI(true);
            checkCurrentIP();
          } else {
            updateUI(false);
          }
        });
      });
    });
  });

  function updateUI(isProxyEnabled) {
    if (isProxyEnabled) {
      statusDiv.textContent = 'Proxy is enabled';
      connectButton.textContent = 'Disconnect';
    } else {
      statusDiv.textContent = 'Proxy is disabled';
      connectButton.textContent = 'Connect';
      currentURLDiv.textContent = '';
      errorMessageDiv.textContent = '';
    }
  }

  function checkCurrentIP() {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
          currentURLDiv.textContent = `Current IP: ${data.ip}`;
          errorMessageDiv.textContent = '';
        })
        .catch(error => {
          errorMessageDiv.textContent = `Error: ${error.message}`;
        });
  }
});
