const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readData: () => ipcRenderer.invoke("read-data"),
  writeData: (data) => ipcRenderer.invoke("write-data", data),
  saveReport: (buffer, filename) =>
    ipcRenderer.send("save-report", buffer, filename),
});
