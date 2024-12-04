// Các nút điều khiển cửa sổ
const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");
const closeBtn = document.getElementById("closeBtn");

const inputUrl = document.getElementById("inputUrl");
const downloadBtn = document.getElementById("downloadBtn");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const videoQualitySelect = document.getElementById("formatFile");
const progressBar = document.getElementById("downloadProgress");
const videoContainer = document.getElementById("videoContainer");
let videoInfoInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    const titleBar = document.getElementById("titleBar");

    const updateTitleBar = () => {
        if (navigator.onLine) {
            titleBar.classList.remove("offline"); // Xóa lớp offline
        } else {
            titleBar.textContent =
                "Network Unavailable. Please Check Your Connection.";
            titleBar.classList.add("offline"); // Thêm lớp offline để đổi màu
        }
    };

    // Lắng nghe sự kiện thay đổi trạng thái mạng
    window.addEventListener("online", updateTitleBar);
    window.addEventListener("offline", updateTitleBar);
    // Kiểm tra trạng thái mạng ban đầu
    updateTitleBar();
    attachEventListeners(); // Gắn các sự kiện vào các nút và input
    const elements = [
        downloadBtn,
        startTimeInput,
        endTimeInput,
        videoQualitySelect,
    ];
    elements.forEach((el) => {
        if (!el) {
            console.error("Element not found:", el);
        }
    });
    lockControls(); // Khóa các input khi khởi động
});
// Gắn các sự kiện cho các nút và input
function attachEventListeners() {
    // Điều khiển cửa sổ
    minimizeBtn.addEventListener("click", () =>
        window.windowControls.minimize()
    );
    maximizeBtn.addEventListener("click", () =>
        window.windowControls.maximize()
    );
    closeBtn.addEventListener("click", () => {
        console.log("Close");
        window.windowControls.close();
    });
    // Xử lý URL nhập vào
    inputUrl.addEventListener(
        "input",
        (() => {
            let t;
            return () =>
                clearTimeout(t) ||
                (t = setTimeout(() => processUrl(inputUrl.value), 500));
        })()
    );
    // Xử lý nhập thời gian
    startTimeInput.addEventListener("input", () =>
        formatTimeInput(startTimeInput)
    );
    endTimeInput.addEventListener("input", () => formatTimeInput(endTimeInput));
    // Chỉ cho phép nhập số ở ô thời gian
    [startTimeInput, endTimeInput].forEach((input) => {
        input.addEventListener("keypress", (event) => {
            if (!/[0-9]/.test(event.key)) event.preventDefault();
        });
    });
    downloadBtn.addEventListener("click", downloadVideo);
}
// Hàm xử lý URL và lấy thông tin video
async function processUrl(url) {
    if (isValidUrl(url)) {
        clearOptions();
        lockControls();
        try {
            showVideo(url);
            const videoInfo = await getVideoInfo(url);
            videoInfoInstance = videoInfo.extractor;
            if (videoInfo.extractor !== "youtube") {
                videoContainer.innerHTML = videoInfo.extractor;
            }
            console.log("Video infor: ", videoInfo);
            updateVideoQualityOptions(videoInfo.formats);
            unlockControls();
        } catch (error) {
            console.error(error);
            lockControls();
        }
    }
}

function isValidUrl(url) {
    const regex = new RegExp(
        /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.[a-zA-Z]{2,})(\/\S*)?$/i
    );
    return regex.test(url);
}

// Lấy thông tin video từ main process
async function getVideoInfo(url) {
    try {
        const response = await window.api.getVideoInfo(url);
        console.log("Video formats: ", response.formats);
        return response;
    } catch (error) {
        console.error("Error in getVideoInfo:", error);
    }
}

// Cập nhật danh sách định dạng chất lượng video
function updateVideoQualityOptions(formats) {
    console.log(formats);
    videoQualitySelect.innerHTML = "";
    formats.forEach((format) => {
        const option = document.createElement("option");
        option.value = format.itag;
        option.textContent = `${format.resolution} - ${format.ext}`;
        option.setAttribute("data-format", JSON.stringify(format));
        videoQualitySelect.appendChild(option);
    });
    videoQualitySelect.selectedIndex = videoQualitySelect.options.length - 1;
}

window.api.receive("download-progress", (progress) => {
    progressBar.value = progress;
});

// Tải video dựa trên các thông số đã chọn
async function downloadVideo() {
    progressBar.value = 0;
    const url = inputUrl.value;
    const startTime = startTimeInput.value || "00:00:00"; // Mặc định bắt đầu từ 00:00:00 nếu không nhập
    const endTime = endTimeInput.value || ""; // Không cắt nếu không nhập thời gian kết thúc
    const selectedOption =
        videoQualitySelect.options[videoQualitySelect.selectedIndex];
    const format = JSON.parse(selectedOption.getAttribute("data-format"));
    const formatId = format.format_id;
    const selectedFileType = document.querySelector(
        'input[name="type-file"]:checked'
    ).value;
    console.log(
        `Filetype "${selectedFileType}" - ${formatId} - ${startTime} -> ${endTime}`
    );

    const filters = [
        { name: "All Files", extensions: ["*"] },
        ...(selectedFileType === "mp4"
            ? [{ name: "MP4 Video", extensions: ["mp4"] }]
            : [{ name: "MP3 Audio", extensions: ["mp3"] }]),
    ];
    // Gửi yêu cầu mở hộp thoại lưu
    const savePath = await window.api.showSaveDialog({
        title: `Save ${selectedFileType === "mp4" ? "Video" : "Audio"}`,
        defaultPath: `${videoInfoInstance}_${format.resolution}_${Date.now()}.${
            selectedFileType === "mp4" ? "mp4" : "mp3"
        }`,
        filters: filters,
    });
    if (savePath.canceled || !savePath.filePath) {
        return { success: false, message: "Save operation canceled" };
    }
    console.log(savePath.filePath);
    if (!url || !formatId) {
        alert("Please enter the URL and select the format.");
        return;
    }

    try {
        await window.api.downloadVideo(
            url,
            selectedFileType,
            formatId,
            startTime,
            endTime,
            savePath.filePath
        );
        showSnackbar(
            `${
                selectedFileType === "mp4" ? "Video" : "Audio"
            } has been downloaded successfully!`,
            savePath.filePath
        );
    } catch (error) {
        console.error("Lỗi khi tải video:", error);
        alert("Error when downloading. Please try again.");
    } finally {
        inputUrl.disabled = false;
        progressBar.value = 0;
        unlockControls();
    }
}

// Hàm hiển thị video nhúng (YouTube hoặc TikTok)
function showVideo(url) {
    const platform = getPlatformFromUrl(url);

    let embedCode;
    if (platform === "YouTube") {
        embedCode = getYoutubeEmbedCode(url);
    } else if (platform === "TikTok") {
        embedCode = getTikTokEmbedCode(url);
    }
    videoContainer.innerHTML = embedCode; // Hiển thị video nhúng trong container
}

// Lấy nền tảng video từ URL
function getPlatformFromUrl(url) {
    const platforms = {
        "youtube.com": "YouTube",
        "youtu.be": "YouTube",
        "tiktok.com": "TikTok",
    };
    for (const domain in platforms) {
        if (url.includes(domain)) return platforms[domain];
    }
    return "Unknown";
}

// Lấy ID video từ URL YouTube
function getYouTubeVideoId(url) {
    const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Tạo mã nhúng YouTube
function getYoutubeEmbedCode(url) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        return `<iframe width="576" height="324" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        return "Invalid YouTube URL";
    }
}

// Lấy TikTok video ID từ URL
function getTikTokVideoId(url) {
    const regex = /\/video\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Tạo mã nhúng TikTok
function getTikTokEmbedCode(url) {
    const videoId = getTikTokVideoId(url);
    if (videoId) {
        return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width: 605px; min-width: 325px">
      <section></section>
    </blockquote>`;
    } else {
        return "Invalid TikTok URL";
    }
}

// Khóa input và nút
function lockControls() {
    [downloadBtn, startTimeInput, endTimeInput, videoQualitySelect].forEach(
        (el) => {
            el.disabled = true;
        }
    );
}

// Mở khóa input và nút
function unlockControls() {
    [downloadBtn, startTimeInput, endTimeInput, videoQualitySelect].forEach(
        (el) => {
            el.disabled = false;
        }
    );
}

// Hàm định dạng thời gian input
function formatTimeInput(input) {
    let time = input.value.replace(/\D/g, ""); // Loại bỏ ký tự không phải số
    if (time.length <= 6) {
        time = time.padStart(6, "0"); // Thêm số 0 vào đầu nếu không đủ 6 ký tự
    }
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    const seconds = time.substring(4, 6);
    input.value = `${hours}:${minutes}:${seconds}`;
}

function clearOptions() {
    while (videoQualitySelect.options.length > 0) {
        videoQualitySelect.remove(0);
    }
    // Reset ô nhập thời gian
    startTimeInput.value = ""; // Đặt lại giá trị rỗng cho startTime
    endTimeInput.value = "";
}

const switchTheme = document.getElementById("switch");
switchTheme.addEventListener("change", function () {
    document.body.classList.toggle("change-theme");
    console.log("Test");
});

document.getElementById("contactButton").addEventListener("click", function () {
    // Gửi yêu cầu mở URL đến main process thông qua preload.js
    window.electron.openExternal("https://hoangvu.id.vn/ezclip");
});

function showSnackbar(message, filePath) {
    const snackbar = document.getElementById("snackbar");
    const snackbarMessage = document.getElementById("snackbarMessage");
    const openFolderBtn = document.getElementById("snackbarOpenFolderBtn");
    const closeBtn = document.getElementById("snackbarCloseBtn");
    // Cập nhật nội dung thông báo
    snackbarMessage.textContent = `${message} (Saved to: ${filePath})`;
    // Sự kiện mở thư mục
    openFolderBtn.onclick = () => {
        console.log("click");
        if (window.openFolder && window.openFolder.openSaveFolder) {
            window.openFolder.openSaveFolder(filePath);
        } else {
            console.error("window.openFolder.openSaveFolder is not defined");
        }
    };
    // Sự kiện đóng snackbar
    closeBtn.onclick = () => {
        snackbar.classList.remove("show");
    };

    // Hiển thị snackbar
    snackbar.classList.add("show");

    // Tự động ẩn sau 25 giây (trừ khi người dùng đóng thủ công)
    setTimeout(() => {
        snackbar.classList.remove("show");
    }, 25000);
}
