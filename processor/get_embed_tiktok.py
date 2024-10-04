import requests
from bs4 import BeautifulSoup

# Gửi yêu cầu HTTP đến trang web
url = 'https://www.youtube.com/watch?v=_uQrJ0TkZlc'

response = requests.get(url)
print(response.status_code)
# Kiểm tra trạng thái phản hồi
if response.status_code == 200:
    # Phân tích cú pháp HTML của trang web
    soup = BeautifulSoup(response.content, 'html.parser')

    # Lấy tiêu đề của trang web
    # title = soup.title.string
    # print('Tiêu đề:', title)

    # Lấy toàn bộ nội dung của thẻ div có class là "content"
    content_div = soup.find('textarea', class_='style-scope', )
    content = content_div
    print('Nội dung:', content)
else:
    print('Không thể kết nối đến trang web')



url = 'https://www.tiktok.com/@haiichieu/video/7420056693624687890'
selector = '#login-modal > div > div.css-y3jvjf-DivModalInnerContainer > div > textarea'