const { contextBridge, ipcRenderer } = require("electron");

// Cung cấp các chức năng điều khiển cửa sổ (minimize, maximize, close)
contextBridge.exposeInMainWorld("windowControls", {
    minimize: () => ipcRenderer.send("minimizeApp"),
    maximize: () => ipcRenderer.send("maximizeApp"),
    close: () => ipcRenderer.send("closeApp"),
});

contextBridge.exposeInMainWorld("openFolder", {
    openSaveFolder: (path) => ipcRenderer.send("openSaveFolder", path),
});

// Cung cấp các API cho thao tác với video (fetch video info, download video)
contextBridge.exposeInMainWorld("api", {
    getVideoInfo: (url) => ipcRenderer.invoke("fetch-video-info", url),
    showSaveDialog: (options) =>
        ipcRenderer.invoke("show-save-dialog", options),
    downloadVideo: (
        url,
        selectedFileType,
        formatId,
        startTime,
        endTime,
        savePath
    ) => {
        return ipcRenderer.invoke(
            "download-video",
            url,
            selectedFileType,
            formatId,
            startTime,
            endTime,
            savePath
        );
    },
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld("electron", {
    openExternal: (url) => ipcRenderer.send("open-external", url),
});
