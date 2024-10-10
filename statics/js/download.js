const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Hiển thị danh sách các định dạng có sẵn
function listAvailableFormats(youtubeUrl) {
  const command = `yt-dlp -F ${youtubeUrl}`; // Lệnh để liệt kê định dạng
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout); // Hiển thị các định dạng
  });
}

// Tải video với chất lượng tùy chọn
function downloadVideo(youtubeUrl, savePath = "ytb_videos", quality = "best") {
  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath); // Tạo thư mục nếu chưa tồn tại
  }
  const outputTemplate = path.join(savePath, "%(id)s.%(ext)s");
  const command = `yt-dlp -f ${quality} -o "${outputTemplate}" ${youtubeUrl}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout); // Hiển thị quá trình tải xuống
    console.log(`Video đã được tải về tại: ${savePath}`);
  });
}

// Main function để thực hiện các chức năng
(async function main() {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question("Nhập URL video YouTube: ", (youtubeUrl) => {
    // Hiển thị danh sách các chất lượng video
    listAvailableFormats(youtubeUrl);

    readline.question("Nhập ID của chất lượng bạn muốn tải: ", (quality) => {
      const savePath = "ytb_videos"; // Đường dẫn lưu video

      // Tải video theo chất lượng người dùng chọn
      downloadVideo(youtubeUrl, savePath, quality);
      readline.close();
    });
  });
})();
