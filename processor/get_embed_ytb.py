def get_embed_code(youtube_url):
    # Lấy ID của video từ URL
    video_id = youtube_url.split('si')[1]
    
    # Nếu URL có thêm tham số, chỉ lấy phần ID
    ampersand_position = video_id.find('&')
    if ampersand_position != -1:
        video_id = video_id[:ampersand_position]
    
    # Tạo mã nhúng
    embed_code = f'<iframe width="560" height="315" src="https://www.youtube.com/embed/{video_id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    
    return embed_code

# Ví dụ URL
youtube_url = "https://youtu.be/_uQrJ0TkZlc?si=GPM3Dh4v9AGX8d1-"
embed_code = get_embed_code(youtube_url)
print(embed_code)