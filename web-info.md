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
*   **Phân loại thông minh:** Chọn Category (Dự án, Nhà máy HGPT, MMTB - Công nghệ, Quy trình, Hồ sơ năng lực).
*   **Auto-suggest Dự án:** Ô nhập tên dự án tự động gợi ý các dự án đã có sẵn trong cơ sở dữ liệu.
*   **Format Hashtag:** Tự động định dạng các tag trước khi lưu: 
    *   `c:{category}` cho Phân loại.
    *   `p:{project}` cho Tên dự án.
    *   `#{tag}` cho các từ khóa (tự động xử lý nếu người dùng nhập có/không có dấu phẩy hoặc dấu `#`).

### 2. Giao diện Gallery & Cụm Album Thông Minh (Smart Clustering)
*   **Grid 4 Cột Hiện Đại:** Tối ưu hóa không gian hiển thị từ 3 lên 4 cột trên màn hình lớn, giúp bao quát được nhiều tài liệu hơn.
*   **Gom nhóm Linh hoạt (Contextual Grouping):** 
    *   **Thứ tự ưu tiên gom nhóm:**
        1.  **Theo Dự án (Project):** Nếu có tag `p:`, hệ thống gom theo Category + Project (đây là Album chính thức).
        2.  **Theo Hashtag (Smart Cluster):** Nếu không có dự án nhưng có bộ hashtag giống hệt nhau, hệ thống gom theo Category + Hashtag.
        3.  **Duy nhất (Individual):** Nếu không thuộc 2 trường hợp trên, ảnh hiển thị đơn lẻ để dễ quản lý.
    *   **Lọc thông minh theo ngữ cảnh:** Khi người dùng chọn lọc một hashtag cụ thể, Album sẽ tự động "thu nhỏ" lại để chỉ hiển thị các ảnh thỏa mãn bộ lọc đó bên trong dự án. Điều này giúp cân bằng giữa tính thẩm mỹ (giao diện Album) và độ chính xác tuyệt đối (khi tìm kiếm).
    *   Mỗi cụm hiển thị 1 ảnh đại diện lớn (Hero) và tối đa 3 ảnh thumbnail nhỏ bên dưới, kèm nhãn số lượng ảnh.
*   **Interactive Thumbnails:** Các ảnh thumbnail nhỏ trong album có thể click trực tiếp để mở xem đúng ảnh đó trong chế độ Preview.
*   **Drill-down Mode (Xem chi tiết cụm):** 
    *   Nút **"Chi tiết ➔"** trên cụm album cho phép người dùng "bung" toàn bộ các ảnh trong cụm đó ra màn hình chính.
    *   **Lọc thông minh lớp kép:** Chế độ xem chi tiết tự động kế thừa và bảo lưu các hashtag đang lọc trước đó, đảm bảo kết quả hiển thị luôn chính xác theo quy tắc tìm kiếm của người dùng.
*   **Asset Card & Inline Edit:**
    *   Hỗ trợ chỉnh sửa Tên và Hashtag trực tiếp.
    *   Tự động nhận diện PDF/Tài liệu để hiển thị biểu tượng thay thế cho ảnh.
*   **Các công cụ thao tác nhanh (Refined UI):**
    *   Hover hiệu ứng tinh tế: Giảm độ mờ (blur), icon được thu nhỏ size 14 chuyên nghiệp hơn.
    *   Copy Link, Download, Open Original, Delete.

### 3. Lightbox Preview & Điều hướng (Preview Experience)
*   **Chế độ xem toàn màn hình:** Click vào bất kỳ ảnh nào để mở trình xem ảnh cao cấp (Lightbox).
*   **Điều hướng linh hoạt:** Hỗ trợ phím mũi tên (Trái/Phải) hoặc nút bấm trên màn hình để chuyển ảnh liên tục.
*   **Info Overlay:** Hiển thị thông tin Project, Category và Hashtag ngay trên trình xem ảnh.
*   **Mobile Optimized:** Hỗ trợ thao tác vuốt chạm và điều chỉnh kích thước tối ưu cho smartphone.

### 4. Tìm kiếm và Bộ lọc (Sidebar & Toolbar)
*   **Live Search:** Ô tìm kiếm theo Tên tài liệu, Tên dự án hoặc Hashtag.
*   **Sidebar Filter thông minh:**
    *   Lọc nhanh theo Phân loại (Categories) với chế độ Click-to-Filter.
    *   Tự động trích xuất danh sách các "Dự án tiêu biểu".
    *   Tự động phân tích và hiển thị **Top 15 Hashtag phổ biến nhất**.
*   **Smart Filter Logic:** Hệ thống lọc hoạt động đồng nhất giữa Sidebar, thanh tìm kiếm và nút xem chi tiết Album, đảm bảo không bị lẫn lộn giữa các dự án khác nhau.

### 5. Hệ thống Server & Đồng bộ Local Network
*   Dữ liệu được lưu vào `assets_data.json` để không bị mất khi Restart Server.
*   Đã thiết lập `allowedDevOrigins` trong `next.config.ts` cho phép truy cập từ mạng LAN (IP local).
*   Khử tính năng cache tĩnh (`force-dynamic`) để đảm bảo dữ liệu cập nhật ngay lập tức trên mọi thiết bị (Mobile, Laptop, Desktop).
