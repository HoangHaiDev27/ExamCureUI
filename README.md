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

ExamcureBe quản lý auth, quyền admin, tài liệu, câu hỏi và đề. Production dùng
MongoDB lưu toàn bộ dữ liệu ứng dụng và vector; S3 lưu file private. FE không còn SDK/key
Supabase.

## Kết nối ExamcureBe

Sao chép `.env.example` thành `.env.local`. Browser gọi `/api/v1`; biến server
`EXAMCURE_API_URL` là origin của BE (local `http://localhost:5010`). Next.js
chuyển tiếp API để refresh cookie HttpOnly thuộc domain FE. Access token ở bộ
nhớ; localStorage chỉ lưu profile hiển thị sau khi BE xác minh.

BE đặt CORS_ORIGIN đúng origin FE và API_PUBLIC_URL là URL API public qua FE.
Google tùy chọn: cấu hình ba biến OAuth trong BE và callback đi qua FE tại
`/api/v1/Auth/google/callback`, rồi bật NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ở FE.
Rebuild FE khi đổi môi trường. Xem hướng dẫn tại repo ExamcureBe:
`docs/AI_BACKEND_SETUP.md` và `docs/REMOVE_SUPABASE.md`.

Admin chờ `/Users/me` kiểm tra role; API luôn đọc quyền hiện tại từ MongoDB. 401
thử refresh một lần, 403 đọc lại role. Profile cập nhật khi chuyển trang,
focus/online và mỗi 30 giây khi tab hiện. Chỉ landing dashboard của admin chuyển
về admin; trang public/reset vẫn mở. Setup admin dùng session đã xác thực và
setup secret có hạn của BE, mã không lưu trong browser.

Kiểm tra: npm run check:config, npm test, npm run lint, npm run build và
npm run test:admin-routes. Config check chỉ kiểm tra biến local, không kiểm tra
kết nối dịch vụ production. Proxy/hosting cần cho phép upload 20 MB.

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

> Dữ liệu demo của phòng thi hiện vẫn được sinh cục bộ. Auth ExamcureBe và giao
> diện quản trị đã được nối tới API backend; tài liệu, pipeline AI, ngân hàng
> câu hỏi và đề hoạt động khi backend được cấu hình MongoDB replica set/S3/OpenAI.

Sản phẩm mô phỏng phục vụ mục đích luyện tập — không liên kết chính thức với các
trường; tên & nhận diện chỉ dùng để mô phỏng giao diện thi.
