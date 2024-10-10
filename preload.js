const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("minimizeApp"),
  maximize: () => ipcRenderer.send("maximizeApp"),
  close: () => ipcRenderer.send("closeApp"),
});

