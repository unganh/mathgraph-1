# MathGraph — Công cụ vẽ đồ thị hàm số

MathGraph là ứng dụng web tĩnh bằng HTML, CSS và JavaScript giúp vẽ và khám phá đồ thị hàm số ngay trong trình duyệt.

## Tính năng

- Vẽ đồ thị từ biểu thức theo biến `x`.
- Hàm mẫu: bậc hai, bậc nhất, sin, cos, căn thức và hàm nghịch đảo.
- Hệ trục tọa độ, lưới và nhãn chia tự động.
- Tùy chỉnh khoảng hiển thị trên hai trục.
- Phóng to / thu nhỏ khung nhìn.
- Di chuột lên đồ thị để xem tọa độ gần đúng.
- Giao diện thích ứng với máy tính và điện thoại.
- Không cần backend hoặc cài đặt.

## Chạy ứng dụng

1. Tải hoặc clone repository.
2. Mở `index.html` bằng trình duyệt hiện đại.
3. Cần kết nối Internet để tải thư viện [math.js](https://mathjs.org/) từ CDN.

Có thể chạy bằng VS Code Live Server để thuận tiện phát triển.

## Cú pháp biểu thức

| Biểu thức | Ý nghĩa |
|---|---|
| `x^2` | Bình phương |
| `2*x + 1` | Hàm bậc nhất |
| `sin(x)` | Hàm sin (radian) |
| `cos(x)` | Hàm cos (radian) |
| `sqrt(abs(x))` | Căn bậc hai của trị tuyệt đối |
| `1/x` | Hàm nghịch đảo |

Dùng `*` để nhân tường minh, ví dụ `2*x`.

## Công nghệ

- HTML5
- CSS3
- JavaScript
- Canvas API
- [math.js](https://mathjs.org/) để phân tích và tính biểu thức toán học

## Triển khai GitHub Pages

1. Đưa các tệp trong thư mục này lên repository GitHub.
2. Mở **Settings → Pages**.
3. Trong phần Build and deployment, chọn **Deploy from a branch**.
4. Chọn nhánh `main`, thư mục `/(root)`, rồi nhấn **Save**.
5. Sau khi triển khai hoàn tất, GitHub Pages sẽ cung cấp URL website.

## Giấy phép

MIT License — có thể sử dụng, chỉnh sửa và phân phối theo các điều khoản của giấy phép MIT.
