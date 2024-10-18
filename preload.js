const { contextBridge, ipcRenderer } = require("electron");

// Cung cấp các chức năng điều khiển cửa sổ (minimize, maximize, close)
contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("minimizeApp"),
  maximize: () => ipcRenderer.send("maximizeApp"),
  close: () => ipcRenderer.send("closeApp"),
});

// Cung cấp các API cho thao tác với video (fetch video info, download video)
contextBridge.exposeInMainWorld("api", {
  getVideoInfo: (url) => ipcRenderer.invoke("fetch-video-info", url),

  // Gửi yêu cầu tải video với các tham số URL, format, thời gian bắt đầu, thời gian kết thúc, và chất lượng
  downloadVideo: (url, format, startTime, endTime) => {
    return ipcRenderer.invoke(
      "download-video",
      url,
      format,
      startTime,
      endTime
    );
  },
});
