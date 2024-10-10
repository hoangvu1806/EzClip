import yt_dlp as youtube_dl
import yt_dlp
import os
import subprocess
import json  # Thêm thư viện json

def get_video_info(youtube_url):
    """
    Lấy thông tin chi tiết về video và trả về dưới dạng JSON.
    """
    ydl_opts = {
        "format": "bestvideo+bestaudio/best",  # Sử dụng định dạng video và audio tốt nhất có sẵn
        "noplaylist": True,  # Không lấy thông tin từ playlist
        "ignoreerrors": True  # Bỏ qua các lỗi không nghiêm trọng
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        
        video_info = {
            "title": info.get("title"),
            "uploader": info.get("uploader"),
            "upload_date": info.get("upload_date"),
            "duration": info.get("duration"),  # Thời lượng (giây)
            "view_count": info.get("view_count"),
            "like_count": info.get("like_count"),
            "dislike_count": info.get("dislike_count"),
            "platform": info.get("extractor"),  # Nền tảng (e.g., YouTube)
            "description": info.get("description"),
            "webpage_url": info.get("webpage_url"),
            "categories": info.get("categories"),
            "tags": info.get("tags"),
        }

        return video_info

# Lấy danh sách các định dạng có sẵn cho video từ YouTube
def list_available_formats(youtube_url):
    """
    Lấy danh sách định dạng và trả về dưới dạng JSON.
    """
    ydl_opts = {"listformats": True}
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        formats = info.get('formats', [])
        
        # Danh sách các định dạng
        available_formats = []
        for f in formats:
            available_formats.append({
                "format_id": f.get("format_id"),
                "format_note": f.get("format_note"),
                "ext": f.get("ext"),
                "resolution": f.get("resolution"),
                "fps": f.get("fps"),
                "vcodec": f.get("vcodec"),
                "acodec": f.get("acodec"),
                "filesize": f.get("filesize"),
            })
    
    return available_formats

# Tải video và cắt bằng FFmpeg
def download_and_cut_video(youtube_url, start_time, end_time, save_path="ytb_videos", quality="best"):
    # Tạo thư mục lưu video nếu chưa có
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    
    # Cấu hình tải video
    video_file_template = os.path.join(save_path, "%(id)s.%(ext)s")
    ydl_opts = {
        "format": quality,
        "outtmpl": video_file_template  # Lưu video với tên tùy chọn
    }

    # Tải video
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url)
        video_filename = ydl.prepare_filename(info)  # Lấy đường dẫn video đã tải

    # Nếu không có thời gian bắt đầu/kết thúc, lấy giá trị mặc định
    video_duration = info["duration"]
    if not start_time:
        start_time = "00:00:00"
    if not end_time:
        # Chuyển đổi thời lượng video sang định dạng "HH:MM:SS"
        end_time = "{:02}:{:02}:{:02}".format(
            video_duration // 3600, (video_duration % 3600) // 60, video_duration % 60
        )

    # Cắt video đã tải bằng FFmpeg
    cut_output_path = os.path.join(save_path, f"cut_{os.path.basename(video_filename)}")
    command = [
        "ffmpeg",
        "-ss", start_time,         # Thời gian bắt đầu
        "-i", video_filename,      # Đường dẫn file video đã tải
        "-to", end_time,           # Thời gian kết thúc
        "-c", "copy",              # Cắt mà không mã hóa lại video
        cut_output_path            # Đường dẫn lưu video đã cắt
    ]
    subprocess.run(command)

    print(f"Video đã được cắt và lưu tại: {cut_output_path}")

if __name__ == "__main__":
    
    youtube_url = input("Nhập URL video YouTube: ")

    # Lấy thông tin video
    video_info = get_video_info(youtube_url)
    print("Thông tin chi tiết về video (JSON):")
    print(json.dumps(video_info, indent=4))  # Xuất thông tin dạng JSON

    # Hiển thị danh sách các định dạng có sẵn
    available_formats = list_available_formats(youtube_url)
    print("\nDanh sách các định dạng có thể tải (JSON):")
    print(json.dumps(available_formats, indent=4))  # Xuất định dạng dạng JSON

    # Người dùng chọn chất lượng tải
    quality = input("Nhập ID của chất lượng bạn muốn tải: ")
    
    # Thời gian bắt đầu và kết thúc cắt video
    start_time = input("Nhập thời gian bắt đầu (ví dụ: 00:01:30, bấm Enter để mặc định từ đầu): ")
    end_time = input("Nhập thời gian kết thúc (ví dụ: 00:02:30, bấm Enter để mặc định đến cuối video): ")
    
    save_path = "ytb_videos"  # Thư mục lưu video và video đã cắt

    # Tải và cắt video theo thời gian chỉ định
    download_and_cut_video(youtube_url, start_time, end_time, save_path, quality)
