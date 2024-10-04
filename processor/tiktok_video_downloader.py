import yt_dlp
import os


def list_available_formats_tiktok(tiktok_url):
    print("check")
    ydl_opts = {"listformats": True}  # Hiển thị danh sách các định dạng có sẵn
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(tiktok_url, download=False)
        formats = info_dict.get("formats", [])
        print("Danh sách các chất lượng có thể tải xuống:")
        for f in formats:
            print(
                f"ID: {f['format_id']} - Resolution: {f.get('resolution', 'unknown')} - Ext: {f['ext']} - Note: {f.get('format_note', 'N/A')}"
            )


def download_tiktok_video(video_url, save_path="tiktok_videos", quality="best"):
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    ydl_opts = {
        "outtmpl": os.path.join(save_path, "%(id)s.%(ext)s"),
        "format": quality,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            filename = ydl.prepare_filename(info)
            print(f"Video successfully downloaded: {filename}")
    except Exception as e:
        print(f"Error downloading video: {str(e)}")


if __name__ == "__main__":
    tiktok_url = input("Nhập URL video tiktok: ")
    # Hiển thị danh sách chất lượng video
    list_available_formats_tiktok(tiktok_url)
    quality = input("Nhập ID của chất lượng bạn muốn tải: ")
    save_path = "ytb_videos"  # Đường dẫn lưu video
    # Tải video theo chất lượng người dùng chọn
    download_tiktok_video(tiktok_url, save_path, quality)
    print(f"Video đã được tải về tại: {save_path}")
