import yt_dlp as youtube_dl
import os


def list_available_formats(youtube_url):
    ydl_opts = {"listformats": True}  # Hiển thị danh sách các định dạng có sẵn
    print(ydl_opts)
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)
    #     formats = info_dict.get('formats', [])
    #     print(formats)
    # print("Danh sách các chất lượng có thể tải xuống:")
    # for f in formats:
    #     print(f"ID: {f['format_id']} - Resolution: {f.get('resolution', 'unknown')} - Ext: {f['ext']} - Note: {f.get('format_note', 'N/A')}")


def download_video(youtube_url, save_path="ytb_videos", quality="best"):
    ydl_opts = {
        "outtmpl": os.path.join(
            save_path, "%(id)s.%(ext)s"
        ),  # Lưu video với tên tùy chọn
        "format": quality,  # Chọn chất lượng tùy ý dựa vào format_id
    }
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])


if __name__ == "__main__":
    youtube_url = input("Nhập URL video YouTube: ")

    # Hiển thị danh sách chất lượng video
    list_available_formats(youtube_url)

    quality = input("Nhập ID của chất lượng bạn muốn tải: ")
    save_path = "ytb_videos"  # Đường dẫn lưu video

    # Tải video theo chất lượng người dùng chọn
    download_video(youtube_url, save_path, quality)
    print(f"Video đã được tải về tại: {save_path}")
