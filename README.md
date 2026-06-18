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

> Toàn bộ dữ liệu là **mock cục bộ** (deterministic, không phụ thuộc `Math.random`
> để tránh lệch SSR/CSR). Bài làm được lưu tạm vào `sessionStorage` rồi đọc lại ở
> màn kết quả.

Sản phẩm mô phỏng phục vụ mục đích luyện tập — không liên kết chính thức với các
trường; tên & nhận diện chỉ dùng để mô phỏng giao diện thi.
