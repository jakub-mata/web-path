const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (msg) => {
    ipcRenderer.send("msg", msg);
  },
  receiveResponse: (callback) => {
    ipcRenderer.on("respond", (event, value) => callback(value));
  },
})




window.addEventListener('DOMContentLoaded', () => {
    /*
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
    */
})