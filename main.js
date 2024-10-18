const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { exec } = require("child_process"); // Để chạy yt-dlp
const util = require("util");
const execPromise = util.promisify(exec);
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const ytDlpPath = path.join(__dirname, "processor", "yt-dlp.exe");

// Tạo cửa sổ Electron chính
function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 850,
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

  // Điều khiển cửa sổ
  ipcMain.on("minimizeApp", () => win.minimize());
  ipcMain.on("maximizeApp", () =>
    win.isMaximized() ? win.restore() : win.maximize()
  );
  ipcMain.on("closeApp", () => win.close());
}

// Khi ứng dụng sẵn sàng
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle("fetch-video-info", async (event, videoUrl) => {
  return getVideoInfo(videoUrl);
});

// Hàm lấy thông tin video
async function getVideoInfo(videoUrl) {
  console.log(videoUrl);
  return new Promise((resolve, reject) => {
    const ytDlpCommand = `${ytDlpPath} --no-playlist --ignore-errors --skip-download --print-json "${videoUrl}"`;
    exec(ytDlpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing yt-dlp: ${stderr}`);
        return reject(new Error("Failed to fetch video information"));
      }
      try {
        // Parse thông tin video
        const videoData = JSON.parse(stdout);

        // Lấy thông tin cần thiết từ video
        const videoDetails = {
          duration: videoData.duration,
          extractor: videoData.extractor,
          uploader: videoData.uploader,
          viewCount: videoData.view_count,
          formats: [],
        };
        const addedResolutions = new Set();
        // Lọc các định dạng có độ phân giải khác nhau và thêm vào danh sách formats
        videoData.formats.forEach((format) => {
          const {
            ext,
            filesize,
            format_note,
            resolution,
            vcodec,
            tbr,
            fps,
            format_id,
          } = format;
          if (
            tbr !== null &&
            (!addedResolutions.has(resolution) || resolution === "audio only")
          ) {
            videoDetails.formats.push({
              format_id,
              format_note,
              ext,
              resolution,
              fps,
              vcodec,
              tbr,
              filesize,
            });
            addedResolutions.add(resolution);
          }
        });
        resolve(videoDetails);
        console.log(videoDetails);
      } catch (parseError) {
        console.error(`Error parsing video info: ${parseError.message}`);
        reject(new Error("Failed to parse video information"));
      }
    });
  });
}
// // Gọi hàm và in kết quả ra console
// getVideoInfo("https://youtu.be/TLInuAorxqE")
//   .then((videoInfo) => {
//     console.log(videoInfo.duration);
//     videoInfo.formats.forEach((f) => {
//       console.log(
//         `Format ID: ${f.format_id},\t\tResolution: ${f.resolution},\tFilesize: ${f.filesize},\tCodec: ${f.vcodec}`
//       );
//     });
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });

// Xử lý tải video từ URL sử dụng yt-dlp
ipcMain.handle("download-video", async (event, url) => {
  const savePath = await dialog.showSaveDialog({
    title: "Save Video",
    defaultPath: `video_${Date.now()}.mp4`,
    filters: [
      { name: "MP4 Video", extensions: ["mp4"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (savePath.canceled || !savePath.filePath) {
    return { success: false, message: "Save operation canceled" };
  }
  return downloadVideo(url, savePath.filePath);
});

// Hàm xử lý tải video
function downloadVideo(url, savePath) {
  return new Promise((resolve, reject) => {
    const command = `"${ytDlpPath}" -o "${savePath}" "${url}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error downloading video: ${stderr}`);
        return reject(new Error("Failed to download video"));
      }
      console.log("Video downloaded successfully");
      resolve({ success: true, message: "Video downloaded successfully" });
    });
  });
}

// Xử lý cắt video bằng ffmpeg
ipcMain.handle(
  "cut-video",
  async (event, { inputPath, startTime, endTime, format }) => {
    const savePath = await dialog.showSaveDialog({
      title: "Save Cut Video",
      defaultPath: `cut_video_${Date.now()}.${format}`,
      filters: [
        { name: format.toUpperCase() + " Video", extensions: [format] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (savePath.canceled || !savePath.filePath) {
      return { success: false, message: "Save operation canceled" };
    }

    return cutVideo(inputPath, startTime, endTime, savePath.filePath, format);
  }
);

// Hàm cắt video bằng ffmpeg
function cutVideo(inputPath, startTime, endTime, savePath, format) {
  return new Promise((resolve, reject) => {
    const outputFilePath = path.join(savePath);
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime)
      .output(outputFilePath)
      .on("end", () => {
        console.log(`Video cut successfully: ${outputFilePath}`);
        resolve({ success: true, message: "Video cut successfully" });
      })
      .on("error", (err) => {
        console.error(`Error cutting video: ${err.message}`);
        reject(new Error("Failed to cut video"));
      })
      .run();
  });
}

// Xử lý đóng ứng dụng khi tất cả cửa sổ bị đóng
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
