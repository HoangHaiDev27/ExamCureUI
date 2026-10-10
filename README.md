# Thi Thử ĐH — Nền tảng thi thử mô phỏng phần mềm thi của trường

Nền tảng luyện thi giữa kỳ / cuối kỳ cho **sinh viên đại học**, mô phỏng đúng
giao diện phần mềm thi trên máy (CBT) mà từng trường sử dụng.

> Luồng chính: **Chọn trường → Chọn học phần → Vào phòng thi (mô phỏng theo
> phần mềm của trường) → Kết quả.** Mỗi trường có một theme phòng thi riêng.

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # bản production
```

Backend AI nằm trong repo `ExamcureBe`: Supabase là cơ sở dữ liệu chính và
MongoDB Atlas là Vector DB. Repo frontend này chỉ giữ Supabase anon key và gọi
API qua `NEXT_PUBLIC_API_URL`. Trang quản trị nội dung ở `/admin`.

## Kết nối Supabase và Render

Frontend chỉ đăng nhập bằng Supabase Auth (email/mật khẩu, OTP và Google).
API Node.js trên Render nhận access token Supabase và kiểm tra user/quyền;
frontend không gọi `/Auth/*` cũ và không đăng nhập giả khi mất mạng.

1. Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong
   `.env.local`; dùng cùng project với `SUPABASE_URL` của backend. Chỉ đưa
   anon/publishable key vào frontend; service-role key chỉ nằm ở backend.
2. Đặt `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api/v1`
   khi dùng Render, hoặc `http://localhost:5010/api/v1` khi chạy local.
3. Backend đặt `ENABLE_LEGACY_AUTH=false`, cấu hình service-role key và
   `CORS_ORIGIN` bằng đúng origin frontend. Áp dụng migration Supabase trong
   `ExamcureBe/supabase/migrations` để có bảng `profiles` và chính sách RLS.
4. Trong Supabase Auth, bật Google provider và cho phép URL frontend thực tế
   trong danh sách redirect URL. Luồng nhập OTP cần email template gửi
   `{{ .Token }}` thay vì chỉ gửi link xác thực.
5. Chạy `npm run check:config` để đối chiếu hai file môi trường local. Lệnh
   này không in key và không kiểm tra biến môi trường trên Render.
6. Khởi động lại frontend sau khi đổi `.env.local`; với bản deploy cần build
   lại vì các biến `NEXT_PUBLIC_*` được đưa vào bundle lúc build.

Supabase SDK quản lý refresh token. Mỗi request backend lấy phiên từ SDK;
401 được thử lại một lần bằng token mới; 403 đọc lại hồ sơ/quyền nhưng không
đăng xuất session Supabase. Quyền cũng được đọc lại khi đổi trang, quay lại tab,
kết nối lại mạng và mỗi 30 giây khi tab đang hiển thị.
Đăng xuất chờ SDK xóa phiên trước khi chuyển trang.

`/admin` và các bookmark admin cũ chuyển tới `/admin/noi-dung-ai`, nơi dùng
đúng API quản lý người dùng, môn học, tài liệu, câu hỏi và đề của backend.
Cookie role cũ không còn quyết định điều hướng. Admin vẫn mở được trang công
khai/khôi phục mật khẩu; chỉ landing `/dashboard` của admin chuyển về `/admin`.
Guard chờ kiểm tra hồ sơ trước khi mở giao diện quản trị. Để khởi tạo admin đầu
tiên, đăng nhập tài khoản Supabase rồi dùng biểu mẫu khởi tạo tại `/admin`;
backend phải áp dụng migration bootstrap và đặt mã có hạn dùng theo hướng dẫn
`ExamcureBe/docs/AI_BACKEND_SETUP.md`. Mã không lưu trong local/sessionStorage và không thay
thế access token Supabase.
Quản lý trường và bài thi đã nộp của giao diện cũ chưa có API tương ứng trong
backend này; không còn hiển thị các biểu mẫu gọi endpoint không tồn tại.

Kiểm tra frontend: `npm test`, `npm run lint`, `npm run build`.
Sau build, chạy `npm run test:admin-routes` để kiểm tra điều hướng production
với cookie role cũ và xác nhận HTML admin chờ kiểm tra quyền.

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
lucide-react**. Font: **Be Vietnam Pro** (UI), **Lora** (display), **JetBrains
Mono** (code).

## Các màn hình & route

| Route | Màn hình |
| --- | --- |
| `/` | Trang chủ (landing) — hero + mockup phòng thi thật |
| `/schools` | **Chọn trường** (gateway) — tìm kiếm, gợi ý, lọc khối ngành/khu vực, ghim trường phổ biến |
| `/schools/[schoolId]/subjects` | **Chọn học phần** trong không gian của trường (bảng môn + lọc + “Bắt đầu thi thử”) |
| `/dashboard` | Bảng điều khiển sinh viên — số liệu, biểu đồ tiến bộ, đề gợi ý, lịch sử thi |
| `/exam/[schoolId]/[subjectId]` | **Phòng thi** — mô phỏng CBT, header theo nhận diện trường |
| `/exam/[schoolId]/[subjectId]/result` | Kết quả — điểm, xếp loại, phổ điểm, xem lại từng câu kèm lời giải |

## Hệ thiết kế

- **Token màu / type / radius / shadow**: `app/globals.css` (`@theme`).
  Cam FPT `#F37021` dùng tiết chế (~CTA & điểm nhấn). Trong phòng thi, header
  dùng **màu thương hiệu của trường được chọn**, nội dung giữ trung tính.
- **Radius nhỏ nhất quán (4–8px)**, bóng đổ một cấp rất nhẹ, lưới 8px, icon nét
  mảnh (Lucide), không emoji trong UI chức năng — bám checklist chống “AI slop”.

### Ba biến thể header phòng thi (theo `theme.layout` của trường)

- `classic` — một thanh đặc màu thương hiệu (FPTU, PTIT, UNETI, HCMUS).
- `moodle` — chrome sáng + viền brand trên cùng + breadcrumb (HUST, HCMUT, HaUI, UET).
- `banded` — dải màu đậm trên cùng + hàng thông tin trắng (NEU, TDTU, TMU, FTU).

## Cấu trúc thư mục

```
app/                 # routes (App Router)
components/          # UI dùng chung
  exam/              #   ExamRoom (phòng thi) + ResultView (kết quả)
lib/
  types.ts           # kiểu dữ liệu
  schools.ts         # 12 trường + nhận diện phần mềm thi (màu, layout, monogram)
  subjects.ts        # sinh học phần theo trường (deterministic)
  questions.ts       # ngân hàng câu hỏi theo loại (code / math / econ / theory / english)
  grade.ts           # quy đổi điểm → xếp loại (A/B+/B…)
  student.ts         # thí sinh demo, MSSV, mã đề
```

> Dữ liệu demo của phòng thi hiện vẫn được sinh cục bộ. Auth Supabase và giao
> diện quản trị đã được nối tới API backend; tài liệu, pipeline AI, ngân hàng
> câu hỏi và đề hoạt động khi backend được cấu hình Supabase/MongoDB/OpenAI.

Sản phẩm mô phỏng phục vụ mục đích luyện tập — không liên kết chính thức với các
trường; tên & nhận diện chỉ dùng để mô phỏng giao diện thi.
