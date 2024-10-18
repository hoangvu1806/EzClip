// Các nút điều khiển cửa sổ
const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");
const closeBtn = document.getElementById("closeBtn");

const inputUrl = document.getElementById("inputUrl");
const downloadBtn = document.getElementById("downloadBtn");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const videoQualitySelect = document.getElementById("formatFile");
const videoContainer = document.getElementById("videoContainer"); // Container để hiển thị video nhúng

document.addEventListener("DOMContentLoaded", () => {
  attachEventListeners(); // Gắn các sự kiện vào các nút và input
  // Kiểm tra nếu các phần tử được tải đầy đủ
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
  minimizeBtn.addEventListener("click", () => window.windowControls.minimize());
  maximizeBtn.addEventListener("click", () => window.windowControls.maximize());
  closeBtn.addEventListener("click", () => {
    console.log("Close");
    window.windowControls.close();
  });
  // Xử lý URL nhập vào
  inputUrl.addEventListener("input", () => processUrl(inputUrl.value));
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
  // Tải video khi nhấn nút Download
  downloadBtn.addEventListener("click", downloadVideo);
}
// Hàm xử lý URL và lấy thông tin video
async function processUrl(url) {
  // Hiển thị video nhúng
  showVideo(url);
  lockControls(); // Khóa input trong khi đang xử lý
  try {
    console.log(url);
    const videoInfo = await getVideoInfo(url);
    updateVideoQualityOptions(videoInfo.formats); // Cập nhật danh sách chất lượng video
    unlockControls(); // Mở khóa input sau khi có thông tin video
  } catch (error) {
    console.error(error);
    lockControls();
  }
}

// Kiểm tra URL hợp lệ
function isValidUrl(url) {
  const regex = /^(https?:\/\/)?(www\.)?(youtube|tiktok)\.com\/.+$/;
  return regex.test(url);
}

// Lấy thông tin video từ main process
async function getVideoInfo(url) {
  try {
    const response = await window.api.getVideoInfo(url); // Gửi request
    console.log("Response from main.js:", response); // In ra response nhận được
    if (!response.success) {
      throw new Error(response.message);
    }
    return response;
  } catch (error) {
    console.error("Error in getVideoInfo:", error);
  }
}

// Cập nhật danh sách định dạng chất lượng video
function updateVideoQualityOptions(formats) {
  videoQualitySelect.innerHTML = ""; // Xóa các tùy chọn cũ

  formats.forEach((format) => {
    const option = document.createElement("option");
    option.value = format.itag;
    option.textContent = `${format.quality} - ${format.ext} (${format.resolution})`;
    videoQualitySelect.appendChild(option);
  });
}

// Tải video dựa trên các thông số đã chọn
function downloadVideo() {
  const url = inputUrl.value;
  const format = videoQualitySelect.value;
  const startTime = startTimeInput.value || "00:00:00"; // Mặc định bắt đầu từ 00:00:00 nếu không nhập
  const endTime = endTimeInput.value || ""; // Không cắt nếu không nhập thời gian kết thúc

  if (!url || !format) {
    alert("Vui lòng nhập URL và chọn định dạng.");
    return;
  }

  // Gửi yêu cầu tải video tới main process
  window.api
    .downloadVideo(url, format, startTime, endTime)
    .then(() => {
      alert("Video đã được tải về thành công!");
    })
    .catch((error) => {
      console.error("Lỗi khi tải video:", error);
      alert("Lỗi khi tải video. Vui lòng thử lại.");
    });
}

// Hàm hiển thị video nhúng (YouTube hoặc TikTok)
function showVideo(url) {
  const platform = getPlatformFromUrl(url);

  let embedCode;
  if (platform === "YouTube") {
    embedCode = getYoutubeEmbedCode(url);
  } else if (platform === "TikTok") {
    embedCode = getTikTokEmbedCode(url);
  } else {
    embedCode = "Nền tảng không được hỗ trợ.";
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
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/;
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
