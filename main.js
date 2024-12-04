const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { exec, spawn } = require("child_process"); // Để chạy yt-dlp

const ytDlpPath = path.join(process.resourcesPath, "yt-dlp.exe"); // for production
// const ytDlpPath = path.join(__dirname, "statics", "processor", "yt-dlp.exe"); // for development
const ffmpegPath = path.join(process.resourcesPath, "ffmpeg.exe");
console.log(ytDlpPath);
process.env.PATH += `;${path.dirname(ytDlpPath)}`;
process.env.PATH += `;${path.dirname(ffmpegPath)}`;
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

    // Xóa bỏ DevTools trong bản production
    if (process.env.NODE_ENV === "production") {
        win.removeMenu();
        win.webContents.closeDevTools();
    }
    // win.webContents.openDevTools();

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

let prePlatformVideo = null;
ipcMain.handle("fetch-video-info", async (event, videoUrl) => {
    return getVideoInfo(videoUrl);
});

// Hàm lấy thông tin video
async function getVideoInfo(videoUrl) {
    console.log(videoUrl);
    return new Promise((resolve, reject) => {
        const ytDlpCommand = `${ytDlpPath} --no-playlist --ignore-errors --skip-download --print-json "${videoUrl}" `;
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
                prePlatformVideo = videoDetails.extractor;
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
                    if (videoData.extractor === "youtube") {
                        if (
                            ext !== "storyboard" &&
                            tbr !== null &&
                            !addedResolutions.has(resolution) &&
                            resolution !== "audio only"
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
                        }
                        addedResolutions.add(resolution);
                    } else {
                        if (!addedResolutions.has(resolution) || true) {
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
                    }
                });
                resolve(videoDetails);
                console.log(videoDetails);
            } catch (parseError) {
                console.error(
                    `Error parsing video info: ${parseError.message}`
                );
                reject(new Error("Failed to parse video information"));
            }
        });
    });
}

ipcMain.handle("show-save-dialog", async (event, options) => {
    const savePath = await dialog.showSaveDialog(options);
    return savePath;
});

// Xử lý tải video từ URL sử dụng yt-dlp
ipcMain.handle(
    "download-video",
    async (
        event,
        url,
        selectedFileType,
        formatId,
        startTime,
        endTime,
        savePath
    ) => {
        return downloadVideo(
            event,
            url,
            selectedFileType,
            formatId,
            startTime,
            endTime,
            savePath
        );
    }
);

// Function to download the video using yt-dlp

function downloadVideo(
    event,
    url,
    selectedFileType,
    formatId,
    startTime,
    endTime,
    savePath
) {
    return new Promise((resolve, reject) => {
        let args = [];

        if (
            startTime === undefined ||
            startTime === "00:00:00" ||
            endTime === undefined ||
            endTime === "00:00:00"
        ) {
            if (selectedFileType === "mp4") {
                args = [
                    "--concurrent-fragments=10",
                    "-f",
                    `${
                        ["TikTok", "Pinterest", "twitter"].includes(
                            prePlatformVideo
                        )
                            ? "best"
                            : formatId + `+bestaudio[acodec!=opus]`
                    }`,
                    "--merge-output-format",
                    "mp4",
                    "-o",
                    savePath,
                    "--restrict-filenames",
                    "--no-playlist",
                    `${url}`,
                ];
            } else if (selectedFileType === "mp3") {
                args = [
                    "-f",
                    "bestaudio[acodec!=opus]",
                    "--extract-audio",
                    "--audio-format",
                    "mp3",
                    "-o",
                    savePath,
                    "--restrict-filenames",
                    "--no-playlist",
                    `${url}`,
                ];
            }
        } else {
            if (selectedFileType === "mp4") {
                args = [
                    "--download-sections",
                    `*${startTime}-${endTime}`,
                    "-f",
                    `${
                        ["TikTok", "Pinterest", "twitter"].includes(
                            prePlatformVideo
                        )
                            ? "best"
                            : formatId + `+bestaudio[acodec!=opus]`
                    }`,
                    "--merge-output-format",
                    "mp4",
                    "--force-keyframes-at-cuts",
                    "-o",
                    savePath,
                    "--restrict-filenames",
                    "--no-playlist",
                    `${url}`,
                ];
            } else if (selectedFileType === "mp3") {
                args = [
                    "--download-sections",
                    `*${startTime}-${endTime}`,
                    "-f",
                    "bestaudio[acodec!=opus]",
                    "--extract-audio",
                    "--audio-format",
                    "mp3",
                    "-o",
                    savePath,
                    "--restrict-filenames",
                    "--no-playlist",
                    `${url}`,
                ];
            }
        }
        console.log(args);
        const ytDlpProcess = spawn(ytDlpPath, args);
        let stringCmd = `${ytDlpPath} `;
        args.forEach((arg) => {
            stringCmd += `${arg} `;
        });
        console.log("cmd: ", stringCmd);
        let currentProgress = 0; // Lưu trữ tiến trình hiện tại

        ytDlpProcess.stdout.on("data", (data) => {
            const output = data.toString();
            const progressMatch = output.match(/(\d+\.\d+)%/); // Tìm phần trăm tiến trình

            if (progressMatch) {
                currentProgress = parseFloat(progressMatch[1]); // Cập nhật tiến trình hiện tại
            }
        });
        setInterval(() => {
            event.sender.send("download-progress", currentProgress); // Gửi tiến trình hiện tại
        }, 200); // Chu kỳ 0.2 giây

        ytDlpProcess.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });

        ytDlpProcess.on("close", (code) => {
            if (code === 0) {
                resolve({
                    success: true,
                    message: "Video downloaded successfully",
                });
            } else {
                reject(new Error("Failed to download video"));
            }
        });

        ytDlpProcess.on("error", (error) => {
            reject(error);
        });
    });
}

// Lắng nghe sự kiện từ renderer process qua ipcMain
ipcMain.on("open-external", (event, url) => {
    shell.openExternal(url); // Mở URL trong trình duyệt mặc định
});

ipcMain.on("openSaveFolder", async (event, filePath) => {
    console.log("click on save folder");
    const path = require("path");
    const folderPath = path.dirname(filePath); // Lấy thư mục chứa file
    await shell.openPath(folderPath); // Mở thư mục
});

// Xử lý đóng ứng dụng khi tất cả cửa sổ bị đóng
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
