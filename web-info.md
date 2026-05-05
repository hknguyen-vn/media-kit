# Media Kit - Project Information

Tài liệu này ghi chú các công nghệ cốt lõi và các tính năng hiện có của hệ thống Quản lý Năng lực Media (Media Kit) tính đến thời điểm hiện tại.

## 🛠 Tech Stack (Công nghệ sử dụng)

### Core
*   **Framework:** Next.js (App Router) & React
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, kết hợp `clsx` và `tailwind-merge` để tối ưu hóa utility classes.
*   **File System Persistence:** Node.js `fs` (Ghi và đọc file JSON `assets_data.json` trực tiếp trên server nội bộ).

### UI & UX Libraries
*   **Animations:** `framer-motion` (Micro-animations, page transitions, layout animations).
*   **Icons:** `lucide-react` (Bộ icon tối giản, hiện đại).
*   **Notifications:** `sonner` (Toast notifications chuyên nghiệp, hiển thị trạng thái tải lên/xóa/sửa).

### Media Processing & Storage
*   **Cloudinary API:** 
    *   Tự động tải lên và phân tích loại file (Image, Raw Document).
    *   Tự động scale & optimize ảnh thumbnail (VD: `w_600,h_400,c_fill,q_auto,f_auto`) để đảm bảo tốc độ tải trang cực nhanh dù có hàng trăm ảnh.

---

## ✨ Features (Các tính năng hiện có)

### 1. Upload Đa Năng (Batch Upload)
*   **Giao diện thu gọn (Compact):** Thanh Upload được tối ưu diện tích, có thể đóng/mở linh hoạt để nhường không gian cho phần Gallery.
*   **Hỗ trợ Upload nhiều file cùng lúc:** Kéo thả (Drag & Drop) hoặc chọn nhiều ảnh/tài liệu cùng lúc.
*   **Đa dạng định dạng:** Chấp nhận các loại ảnh (`.jpg`, `.png`, `.webp`...) và các file tài liệu (`.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`).
*   **Phân loại thông minh:** Chọn Category (Dự án, Nhà máy, Máy móc, Hồ sơ năng lực).
*   **Auto-suggest Dự án:** Ô nhập tên dự án tự động gợi ý các dự án đã có sẵn trong cơ sở dữ liệu.
*   **Format Hashtag:** Tự động định dạng các tag trước khi lưu: 
    *   `c:{category}` cho Phân loại.
    *   `p:{project}` cho Tên dự án.
    *   `#{tag}` cho các từ khóa (tự động xử lý nếu người dùng nhập có/không có dấu phẩy hoặc dấu `#`).

### 2. Giao diện Gallery & Quản lý Tài liệu (Asset Card)
*   Hiển thị dạng lưới linh hoạt (Responsive Grid).
*   Với file ảnh: Hiển thị thumbnail tối ưu với Cloudinary.
*   Với file tài liệu (Profile/PDF): Tự động nhận diện và hiển thị biểu tượng văn bản kèm đuôi file (tránh lỗi broken image).
*   **Inline Edit:** Chỉnh sửa Tên và Hashtag trực tiếp trên từng Asset Card mà không cần tải lại trang.
*   **Các công cụ thao tác nhanh:**
    *   Copy Link (sao chép đường dẫn file).
    *   Download (tải trực tiếp file về máy).
    *   Open Original (mở file gốc ở tab mới).
    *   Delete (xóa file khỏi hệ thống).

### 3. Tìm kiếm và Bộ lọc (Sidebar & Toolbar)
*   **Live Search:** Ô tìm kiếm theo Tên tài liệu, Tên dự án hoặc Hashtag.
*   **Sidebar Filter thông minh:**
    *   Lọc nhanh theo Phân loại (Categories).
    *   Tự động trích xuất và hiển thị danh sách các "Dự án tiêu biểu" từ dữ liệu đang có.
    *   Tự động phân tích và hiển thị **Top 15 Hashtag phổ biến nhất** để thao tác click-to-filter cực nhanh.
*   Thống kê tổng số tài liệu và tích hợp Link dẫn về Kênh YouTube.

### 4. Hệ thống Server & Đồng bộ Local Network
*   Dữ liệu được lưu vào `assets_data.json` để không bị mất khi Restart Server.
*   Đã thiết lập `allowedDevOrigins` trong `next.config.ts` cho phép các thiết bị khác trong cùng mạng LAN (ví dụ điện thoại, laptop khác) truy cập vào địa chỉ IP của máy chủ (VD: `http://192.168.x.x:3000`).
*   Khử tính năng ép cache tĩnh của Next.js App Router (`force-dynamic` & `cache: 'no-store'`) để dữ liệu tải lên từ thiết bị này sẽ ngay lập tức được nhìn thấy trên thiết bị khác ở lần tải trang tiếp theo.
