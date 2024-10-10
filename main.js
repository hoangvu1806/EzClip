const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 770,
    minHeight: 600,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, // Tắt nodeIntegration để bảo mật
      contextIsolation: true, // Bật contextIsolation để bảo mật
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile("index.html");
  win.webContents.openDevTools();

  // Xử lý các sự kiện từ renderer process
  ipcMain.on("minimizeApp", () => {
    win.minimize();
  });

  ipcMain.on("maximizeApp", () => {
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
  });

  ipcMain.on("closeApp", () => {
    win.close();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
