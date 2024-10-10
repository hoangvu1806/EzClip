const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");
const closeBtn = document.getElementById("closeBtn");

// Minimize window
minimizeBtn.addEventListener("click", () => {
  window.windowControls.minimize();
});
// Maximize or restore window
maximizeBtn.addEventListener("click", () => {
  window.windowControls.maximize();
});
// Close window
closeBtn.addEventListener("click", () => {
  window.windowControls.close();
});
function getYouTubeVideoId(url) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
function getYoutubeEmbedCode(url) {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    return "Invalid YouTube URL";
  }
}

// Xử lý sự kiện khi nhấn nút Embed
function showVideo() {
    const url = document.getElementById("inputUrl").value;
    const embedCode = getYoutubeEmbedCode(url);

    // Hiển thị kết quả lên trang web
    document.getElementById("videoContainer").innerHTML = embedCode;
}

// Lấy phần tử input và button
const inputUrl = document.getElementById("inputUrl");
const downloadBtn = document.getElementById("downloadBtn");

// Xử lý sự kiện nhấn Enter khi focus vào inputUrl
inputUrl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const urlValue = inputUrl.value;
    console.log(`Video ID: ${getYouTubeVideoId(urlValue)}`);
  }
});

// Xử lý sự kiện click vào button download
downloadBtn.addEventListener("click", () => {
  const urlValue = inputUrl.value;
  console.log(`URL entered: ${urlValue}`);
});
let debounceTimeout;
function printUrlValue() {
  const urlValue = inputUrl.value;
  console.log(`URL entered: ${urlValue}`);
}

// Xử lý sự kiện khi người dùng nhập vào input với debounce 300ms
inputUrl.addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(printUrlValue, 500);
  showVideo();
});
