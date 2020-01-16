function elById(id) {
  return document.getElementById(id);
}

window.onload = function() {
  var colorPicker = new ColorPicker(document);

  var selection = [];
  var textArea = elById('abcConfigTextArea');
  textArea.onselect = function() {
    var str = this.value.substring(this.selectionStart, this.selectionEnd);
    var r = str.match(/^([0-9a-fA-F]{6})$/);
    if (r !== null) {
      colorPicker.setColor(r[1]);
      selection = [this.selectionStart, this.selectionEnd];
      colorPicker.onpick = function(newColor) {
        str = textArea.value;
        textArea.value = str.substring(0, selection[0]) + newColor + str.substring(selection[1]);
      }
    } else {
      selection = [];
      colorPicker.onpick = null;
    }
  }

  var msgSpan = elById('msgSpan');
  var saveButton = elById('saveButton');
  saveButton.onclick = function() {
    var rabctr = textArea.value;

    try {
      const profiles = loadabcConfig(rabctr);
      if (profiles.length > 200) {
        msgSpan.innerHTML = '<span style="color:#dd1111">Failed to save because the number of profiles exceeded the maximum (200)!</span>';
        return;
      }

      localStorage['rawdata'] = rabctr;

      const dps = new DataProfilesSplitter();
      const dataSet = dps.profilesToDataSet(profiles);
      dataSet.lztext = LZString.compressToUTF16(rabctr);

      chrome.storage.sync.set(dataSet,
        function() {
          const { lastError } = chrome.runtime || browser.runtime;
          if (lastError) {
            msgSpan.innerHTML = Sanitizer.escapeHTML`<span style="color:#dd1111">${lastError.message}</span>`;
            return;
          }

          msgSpan.innerHTML = '<span style="color:#1111dd">Configuration has been updated!</span>';
          setTimeout(function() {
            msgSpan.innerHTML = '';
          }, 2500);
        });
    } catch (e) {
      msgSpan.innerHTML = '<span style="color:#dd1111">Failed to save: invalid format!</span>';
    }
  }

  const booleanSettings = ['hidesHistory', 'hidesAccountId', 'showOnlyMatchingRoles', 'autoAssumeLastRole'];
  for (let key of booleanSettings) {
    elById(`${key}CheckBox`).onchange = function() {
      chrome.storage.sync.set({ [key]: this.checked });
    }
  }

  elById('configSenderIdText').onchange = function() {
    chrome.storage.sync.set({ configSenderId: this.value });
  }

  chrome.storage.sync.get(['lztext', 'configSenderId'].concat(booleanSettings), function(data) {
    let rawData = localStorage['rawdata'];
    if (data.lztext) {
      try {
        rawData = LZString.decompressFromUTF16(data.lztext);
      } catch(err) {
        rawdata = ';; !!!WARNING!!!\n;; The most recently saved settings are invalid.\n;; !!!WARNING!!!\n';
      }
    }
    textArea.value = rawData || '';
    elById('configSenderIdText').value = data.configSenderId || '';
    for (let key of booleanSettings) {
      elById(`${key}CheckBox`).checked = data[key] || false;
    }
  });
}
