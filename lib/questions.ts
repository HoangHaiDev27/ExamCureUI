import type { Question, QuestionKind, Subject } from "./types";

/* Ngân hàng câu hỏi theo loại học phần. Nội dung thật, có công thức & code. */

const CODE: Question[] = [
  {
    id: "c1",
    prompt: "Đoạn chương trình Java sau in ra kết quả nào?",
    code: `int[] a = {2, 4, 6, 8};
int s = 0;
for (int i = 0; i < a.length; i++) {
    if (i % 2 == 0) s += a[i];
}
System.out.println(s);`,
    options: ["8", "10", "12", "20"],
    answer: 0,
    explain:
      "Vòng lặp cộng các phần tử ở chỉ số chẵn: a[0]=2 và a[2]=6 → s = 2 + 6 = 8.",
  },
  {
    id: "c2",
    prompt:
      "Trong lập trình hướng đối tượng, tính chất nào cho phép một lớp con kế thừa và định nghĩa lại phương thức của lớp cha?",
    options: ["Đóng gói (Encapsulation)", "Kế thừa (Inheritance)", "Đa hình (Polymorphism)", "Trừu tượng (Abstraction)"],
    answer: 2,
    explain:
      "Đa hình (overriding) cho phép lớp con định nghĩa lại hành vi của phương thức kế thừa từ lớp cha; lời gọi được quyết định lúc chạy (runtime).",
  },
  {
    id: "c3",
    prompt: "Độ phức tạp thời gian trung bình của thuật toán Tìm kiếm nhị phân trên mảng đã sắp xếp là?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 1,
    explain:
      "Mỗi bước loại bỏ một nửa miền tìm kiếm, nên số bước tỉ lệ với log₂n → O(log n).",
  },
  {
    id: "c4",
    prompt: "Kết quả của đoạn mã C sau là gì?",
    code: `int x = 5;
int *p = &x;
*p = *p + 3;
printf("%d", x);`,
    options: ["5", "8", "3", "Lỗi biên dịch"],
    answer: 1,
    explain:
      "p trỏ tới x; *p = *p + 3 thay đổi trực tiếp giá trị tại địa chỉ của x → x = 8.",
  },
  {
    id: "c5",
    prompt:
      "Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (vào sau — ra trước)?",
    options: ["Hàng đợi (Queue)", "Ngăn xếp (Stack)", "Danh sách liên kết", "Cây nhị phân"],
    answer: 1,
    explain:
      "Ngăn xếp (Stack) tuân theo LIFO: phần tử được đẩy vào sau cùng sẽ được lấy ra đầu tiên.",
  },
  {
    id: "c6",
    prompt: "Trong SQL, lệnh nào dùng để lấy các bản ghi KHÔNG trùng lặp?",
    code: `SELECT ____ khoa FROM sinh_vien;`,
    options: ["UNIQUE", "DISTINCT", "DIFFERENT", "GROUP"],
    answer: 1,
    explain:
      "Từ khóa DISTINCT loại bỏ các dòng trùng nhau trong tập kết quả của câu SELECT.",
  },
  {
    id: "c7",
    prompt: "Từ khóa nào trong Java khai báo một hằng số không thể thay đổi giá trị?",
    options: ["static", "const", "final", "immutable"],
    answer: 2,
    explain:
      "Trong Java, biến khai báo với final không thể gán lại giá trị sau khi khởi tạo. (const là từ khóa dành riêng nhưng không dùng.)",
  },
  {
    id: "c8",
    prompt: "Đoạn mã sau in ra gì?",
    code: `String s = "abcabc";
System.out.println(s.indexOf('c', 3));`,
    options: ["2", "5", "-1", "3"],
    answer: 1,
    explain:
      "indexOf('c', 3) tìm ký tự 'c' bắt đầu từ chỉ số 3. Ký tự 'c' tiếp theo nằm ở chỉ số 5.",
  },
  {
    id: "c9",
    prompt: "Mô hình OSI gồm bao nhiêu tầng?",
    options: ["4 tầng", "5 tầng", "7 tầng", "8 tầng"],
    answer: 2,
    explain:
      "Mô hình OSI có 7 tầng: Vật lý, Liên kết dữ liệu, Mạng, Giao vận, Phiên, Trình diễn, Ứng dụng.",
  },
  {
    id: "c10",
    prompt: "Trong CSDL quan hệ, khóa ngoại (foreign key) dùng để?",
    options: [
      "Bảo đảm mỗi dòng là duy nhất",
      "Thiết lập liên kết tham chiếu giữa hai bảng",
      "Tăng tốc độ truy vấn",
      "Mã hóa dữ liệu",
    ],
    answer: 1,
    explain:
      "Khóa ngoại tham chiếu tới khóa chính của bảng khác, thiết lập và ràng buộc toàn vẹn quan hệ giữa hai bảng.",
  },
  {
    id: "c11",
    prompt: "Phương thức HTTP nào thường dùng để TẠO MỚI một tài nguyên trên server?",
    options: ["GET", "POST", "DELETE", "HEAD"],
    answer: 1,
    explain:
      "POST gửi dữ liệu lên server để tạo tài nguyên mới; GET chỉ truy xuất, DELETE xóa, HEAD lấy header.",
  },
  {
    id: "c12",
    prompt: "Độ phức tạp của thuật toán sắp xếp nổi bọt (Bubble Sort) ở trường hợp xấu nhất?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 2,
    explain:
      "Bubble Sort dùng hai vòng lặp lồng nhau, trường hợp xấu nhất so sánh n×n lần → O(n²).",
  },
];

const MATH: Question[] = [
  {
    id: "m1",
    prompt: "Tính giới hạn sau:",
    formula: "lim (x→0) [ sin(3x) / x ]",
    options: ["0", "1", "3", "Không tồn tại"],
    answer: 2,
    explain: "Áp dụng lim(x→0) sin(kx)/x = k. Với k = 3 → giới hạn bằng 3.",
  },
  {
    id: "m2",
    prompt: "Đạo hàm của hàm số f(x) = x³ − 2x là:",
    formula: "f(x) = x³ − 2x",
    options: ["3x² − 2", "x² − 2", "3x − 2", "3x²"],
    answer: 0,
    explain: "(xⁿ)' = n·xⁿ⁻¹ → f'(x) = 3x² − 2.",
  },
  {
    id: "m3",
    prompt: "Tính tích phân xác định:",
    formula: "∫₀¹ (2x) dx",
    options: ["1", "2", "1/2", "0"],
    answer: 0,
    explain: "∫2x dx = x². Thế cận: 1² − 0² = 1.",
  },
  {
    id: "m4",
    prompt: "Định thức của ma trận sau bằng bao nhiêu?",
    formula: "| 2  1 |\n| 4  3 |",
    options: ["2", "6", "10", "−2"],
    answer: 0,
    explain: "det = 2·3 − 1·4 = 6 − 4 = 2.",
  },
  {
    id: "m5",
    prompt:
      "Một xúc xắc cân đối được tung một lần. Xác suất xuất hiện mặt có số chấm chẵn là?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    answer: 2,
    explain: "Các mặt chẵn: {2, 4, 6} → 3 trên 6 khả năng → 1/2.",
  },
  {
    id: "m6",
    prompt: "Nghiệm của phương trình bậc hai sau là:",
    formula: "x² − 5x + 6 = 0",
    options: ["x = 1; x = 6", "x = 2; x = 3", "x = −2; x = −3", "x = 0; x = 5"],
    answer: 1,
    explain: "x² − 5x + 6 = (x−2)(x−3) = 0 → x = 2 hoặc x = 3.",
  },
  {
    id: "m7",
    prompt: "Giá trị của biểu thức tổ hợp C(5, 2) là:",
    formula: "C(n, k) = n! / [ k!·(n−k)! ]",
    options: ["10", "20", "5", "25"],
    answer: 0,
    explain: "C(5,2) = 5! / (2!·3!) = 120 / (2·6) = 10.",
  },
  {
    id: "m8",
    prompt: "Hàm số f(x) = eˣ có đạo hàm cấp một là:",
    formula: "f(x) = eˣ",
    options: ["x·eˣ⁻¹", "eˣ", "1", "ln(x)"],
    answer: 1,
    explain: "Đạo hàm của eˣ chính là eˣ — đây là tính chất đặc trưng của hàm mũ cơ số e.",
  },
  {
    id: "m9",
    prompt: "Tổng của cấp số cộng 2 + 4 + 6 + ... + 20 bằng:",
    options: ["100", "110", "120", "90"],
    answer: 1,
    explain:
      "Có 10 số hạng, S = n·(a₁ + aₙ)/2 = 10·(2 + 20)/2 = 10·11 = 110.",
  },
  {
    id: "m10",
    prompt: "Kỳ vọng của biến ngẫu nhiên X có phân phối đều rời rạc trên {1,2,3,4} là:",
    formula: "E[X] = Σ xᵢ·P(xᵢ)",
    options: ["2", "2.5", "3", "4"],
    answer: 1,
    explain: "E[X] = (1+2+3+4)/4 = 10/4 = 2.5.",
  },
  {
    id: "m11",
    prompt: "Véc-tơ nào sau đây vuông góc với véc-tơ u = (2, −1)?",
    options: ["(1, 2)", "(2, 1)", "(−2, 1)", "(2, −1)"],
    answer: 0,
    explain: "Hai véc-tơ vuông góc khi tích vô hướng bằng 0: (2)(1) + (−1)(2) = 0. ✔",
  },
  {
    id: "m12",
    prompt: "Tập xác định của hàm số f(x) = ln(x − 1) là:",
    formula: "f(x) = ln(x − 1)",
    options: ["x > 1", "x ≥ 1", "x > 0", "x ≠ 1"],
    answer: 0,
    explain: "Hàm ln chỉ xác định khi đối số dương: x − 1 > 0 → x > 1.",
  },
];

const ECON: Question[] = [
  {
    id: "e1",
    prompt:
      "Khi giá của một hàng hóa thông thường tăng, các yếu tố khác không đổi, lượng cầu sẽ:",
    options: ["Tăng", "Giảm", "Không đổi", "Tăng rồi giảm"],
    answer: 1,
    explain:
      "Theo quy luật cầu, giá và lượng cầu nghịch biến: giá tăng → lượng cầu giảm (di chuyển dọc đường cầu).",
  },
  {
    id: "e2",
    prompt: "Chi phí cơ hội (opportunity cost) của một lựa chọn là:",
    options: [
      "Tổng chi phí bằng tiền đã bỏ ra",
      "Giá trị của phương án tốt nhất bị bỏ qua",
      "Chi phí cố định cộng chi phí biến đổi",
      "Khoản lỗ kế toán",
    ],
    answer: 1,
    explain:
      "Chi phí cơ hội là giá trị của phương án thay thế tốt nhất mà ta từ bỏ khi đưa ra một quyết định.",
  },
  {
    id: "e3",
    prompt:
      "GDP danh nghĩa khác GDP thực tế ở chỗ GDP thực tế đã loại trừ ảnh hưởng của:",
    options: ["Thất nghiệp", "Lạm phát (biến động giá)", "Tỷ giá hối đoái", "Thuế"],
    answer: 1,
    explain:
      "GDP thực tế được tính theo giá cố định của năm gốc nên loại trừ tác động của biến động giá (lạm phát).",
  },
  {
    id: "e4",
    prompt:
      "Trong phương trình kế toán cơ bản, đẳng thức nào sau đây luôn đúng?",
    formula: "Tài sản = Nợ phải trả + Vốn chủ sở hữu",
    options: [
      "Tài sản = Doanh thu − Chi phí",
      "Tài sản = Nợ phải trả + Vốn chủ sở hữu",
      "Vốn chủ sở hữu = Tài sản + Nợ phải trả",
      "Lợi nhuận = Tài sản − Nợ",
    ],
    answer: 1,
    explain:
      "Phương trình kế toán cơ bản: Tài sản = Nợ phải trả + Vốn chủ sở hữu — luôn cân bằng ở mọi thời điểm.",
  },
  {
    id: "e5",
    prompt:
      "Cầu co giãn theo giá khi hệ số co giãn |E_d| thỏa mãn điều kiện nào?",
    formula: "E_d = (%Δ lượng cầu) / (%Δ giá)",
    options: ["|E_d| < 1", "|E_d| = 0", "|E_d| > 1", "|E_d| = 1"],
    answer: 2,
    explain:
      "Cầu co giãn (elastic) khi |E_d| > 1: lượng cầu thay đổi mạnh hơn so với mức thay đổi của giá.",
  },
  {
    id: "e6",
    prompt:
      "Công cụ nào sau đây thuộc chính sách tiền tệ của Ngân hàng Trung ương?",
    options: [
      "Thuế thu nhập doanh nghiệp",
      "Chi tiêu công",
      "Lãi suất tái chiết khấu",
      "Trợ cấp thất nghiệp",
    ],
    answer: 2,
    explain:
      "Lãi suất tái chiết khấu là công cụ của chính sách tiền tệ; thuế và chi tiêu công thuộc chính sách tài khóa.",
  },
  {
    id: "e7",
    prompt: "Lạm phát do chi phí đẩy (cost-push) thường bắt nguồn từ:",
    options: [
      "Tổng cầu tăng quá nhanh",
      "Chi phí sản xuất (nguyên liệu, lương) tăng",
      "Ngân sách nhà nước thặng dư",
      "Lãi suất giảm",
    ],
    answer: 1,
    explain:
      "Lạm phát chi phí đẩy xảy ra khi chi phí đầu vào tăng làm tổng cung giảm, đẩy mặt bằng giá lên.",
  },
  {
    id: "e8",
    prompt:
      "Điểm cân bằng thị trường được xác định khi:",
    options: [
      "Lượng cung lớn hơn lượng cầu",
      "Lượng cung bằng lượng cầu",
      "Giá đạt mức tối đa",
      "Lợi nhuận doanh nghiệp lớn nhất",
    ],
    answer: 1,
    explain:
      "Cân bằng thị trường đạt được tại mức giá mà lượng cung bằng lượng cầu (giao điểm cung–cầu).",
  },
  {
    id: "e9",
    prompt: "Trong kế toán, tài khoản 'Tiền mặt' là loại tài khoản:",
    options: ["Tài sản", "Nợ phải trả", "Vốn chủ sở hữu", "Doanh thu"],
    answer: 0,
    explain: "Tiền mặt là một tài sản ngắn hạn của doanh nghiệp.",
  },
  {
    id: "e10",
    prompt:
      "Khi đường cầu dịch chuyển sang phải (cầu tăng) và cung không đổi, giá cân bằng sẽ:",
    options: ["Giảm", "Tăng", "Không đổi", "Bằng 0"],
    answer: 1,
    explain:
      "Cầu tăng trong khi cung giữ nguyên làm cả giá cân bằng và lượng cân bằng đều tăng.",
  },
  {
    id: "e11",
    prompt: "Tỷ lệ thất nghiệp được tính bằng:",
    formula: "u = (Số người thất nghiệp / Lực lượng lao động) × 100%",
    options: [
      "Số người thất nghiệp / Tổng dân số",
      "Số người thất nghiệp / Lực lượng lao động",
      "Số người có việc / Tổng dân số",
      "Lực lượng lao động / Tổng dân số",
    ],
    answer: 1,
    explain:
      "Tỷ lệ thất nghiệp = số người thất nghiệp chia cho lực lượng lao động (người trong độ tuổi, có khả năng và đang tìm việc).",
  },
  {
    id: "e12",
    prompt:
      "Marketing mix 4P KHÔNG bao gồm yếu tố nào sau đây?",
    options: ["Product (Sản phẩm)", "Price (Giá)", "People (Con người)", "Place (Phân phối)"],
    answer: 2,
    explain:
      "Mô hình 4P gồm Product, Price, Place, Promotion. 'People' thuộc mô hình mở rộng 7P, không nằm trong 4P.",
  },
];

const THEORY: Question[] = [
  {
    id: "t1",
    prompt:
      "Theo triết học Mác – Lênin, phạm trù nào dùng để chỉ toàn bộ hiện thực khách quan tồn tại độc lập với ý thức con người?",
    options: ["Ý thức", "Vật chất", "Vận động", "Nhận thức"],
    answer: 1,
    explain:
      "Lênin định nghĩa vật chất là phạm trù triết học chỉ thực tại khách quan tồn tại độc lập với ý thức và được ý thức phản ánh.",
  },
  {
    id: "t2",
    prompt:
      "Quy luật nào sau đây là một trong ba quy luật cơ bản của phép biện chứng duy vật?",
    options: [
      "Quy luật cung – cầu",
      "Quy luật lượng – chất",
      "Quy luật giá trị",
      "Quy luật bảo toàn năng lượng",
    ],
    answer: 1,
    explain:
      "Ba quy luật cơ bản gồm: lượng–chất, mâu thuẫn, và phủ định của phủ định.",
  },
  {
    id: "t3",
    prompt:
      "Chức năng quản trị nào liên quan đến việc thiết lập mục tiêu và xác định phương án hành động?",
    options: ["Tổ chức", "Lãnh đạo", "Hoạch định", "Kiểm soát"],
    answer: 2,
    explain:
      "Hoạch định (planning) là chức năng xác định mục tiêu và lựa chọn phương án để đạt mục tiêu đó.",
  },
  {
    id: "t4",
    prompt:
      "Trong mô hình TCP/IP, giao thức nào hoạt động ở tầng giao vận (Transport)?",
    options: ["HTTP", "IP", "TCP", "Ethernet"],
    answer: 2,
    explain:
      "TCP (và UDP) hoạt động ở tầng giao vận; IP ở tầng mạng; HTTP ở tầng ứng dụng.",
  },
  {
    id: "t5",
    prompt:
      "Phong cách lãnh đạo trao quyền nhiều nhất cho cấp dưới là phong cách:",
    options: ["Độc đoán", "Dân chủ", "Tự do (laissez-faire)", "Quan liêu"],
    answer: 2,
    explain:
      "Phong cách tự do (laissez-faire) để cấp dưới tự chủ cao nhất trong việc ra quyết định.",
  },
  {
    id: "t6",
    prompt:
      "Theo chủ nghĩa duy vật lịch sử, yếu tố nào giữ vai trò quyết định đối với sự tồn tại và phát triển của xã hội?",
    options: [
      "Ý thức xã hội",
      "Phương thức sản xuất vật chất",
      "Nhà nước",
      "Tôn giáo",
    ],
    answer: 1,
    explain:
      "Phương thức sản xuất vật chất là cơ sở quyết định sự tồn tại và phát triển của xã hội loài người.",
  },
  {
    id: "t7",
    prompt:
      "Trong quản trị, ma trận SWOT phân tích bốn yếu tố nào?",
    options: [
      "Điểm mạnh, Điểm yếu, Cơ hội, Thách thức",
      "Sản phẩm, Giá, Phân phối, Xúc tiến",
      "Kế hoạch, Tổ chức, Lãnh đạo, Kiểm soát",
      "Chi phí, Doanh thu, Lợi nhuận, Vốn",
    ],
    answer: 0,
    explain:
      "SWOT = Strengths, Weaknesses, Opportunities, Threats (Điểm mạnh, Điểm yếu, Cơ hội, Thách thức).",
  },
  {
    id: "t8",
    prompt: "Địa chỉ IPv4 có độ dài bao nhiêu bit?",
    options: ["16 bit", "32 bit", "64 bit", "128 bit"],
    answer: 1,
    explain: "IPv4 dài 32 bit (4 octet); IPv6 dài 128 bit.",
  },
  {
    id: "t9",
    prompt:
      "Mối quan hệ giữa lực lượng sản xuất và quan hệ sản xuất được biểu hiện qua quy luật:",
    options: [
      "Quan hệ sản xuất phải phù hợp với trình độ phát triển của lực lượng sản xuất",
      "Lực lượng sản xuất quyết định ý thức xã hội",
      "Kiến trúc thượng tầng quyết định cơ sở hạ tầng",
      "Tồn tại xã hội phụ thuộc ý thức xã hội",
    ],
    answer: 0,
    explain:
      "Quy luật cơ bản: quan hệ sản xuất phải phù hợp với trình độ phát triển của lực lượng sản xuất.",
  },
  {
    id: "t10",
    prompt:
      "Thành phần nào trong marketing chịu trách nhiệm truyền thông tới khách hàng (quảng cáo, PR, khuyến mãi)?",
    options: ["Product", "Price", "Place", "Promotion"],
    answer: 3,
    explain:
      "Promotion (Xúc tiến) gồm các hoạt động truyền thông: quảng cáo, PR, khuyến mãi, bán hàng cá nhân.",
  },
];

const ENGLISH: Question[] = [
  {
    id: "g1",
    prompt: "Choose the correct option: 'If I ____ more time, I would learn another language.'",
    options: ["have", "had", "will have", "having"],
    answer: 1,
    explain:
      "Câu điều kiện loại 2 (giả định không có thật ở hiện tại): If + S + V-ed (past), S + would + V. → 'had'.",
  },
  {
    id: "g2",
    prompt: "Select the word closest in meaning to 'significant'.",
    options: ["minor", "important", "unclear", "frequent"],
    answer: 1,
    explain: "'Significant' nghĩa là quan trọng, đáng kể → đồng nghĩa gần nhất là 'important'.",
  },
  {
    id: "g3",
    prompt: "Choose the correctly punctuated sentence.",
    options: [
      "The report, which was late was rejected.",
      "The report which was late, was rejected.",
      "The report, which was late, was rejected.",
      "The report which, was late was rejected.",
    ],
    answer: 2,
    explain:
      "Mệnh đề quan hệ không xác định 'which was late' phải được tách bởi dấu phẩy ở cả hai phía.",
  },
  {
    id: "g4",
    prompt: "Fill in the blank: 'The data ____ analysed before the conclusion was drawn.'",
    options: ["were", "is being", "has", "are"],
    answer: 0,
    explain:
      "Trong văn phong học thuật, 'data' là số nhiều và câu ở thì quá khứ bị động → 'were analysed'.",
  },
  {
    id: "g5",
    prompt: "Which sentence is the most formal/academic?",
    options: [
      "Loads of students didn't get it.",
      "A number of students failed to understand the concept.",
      "Tons of kids were confused.",
      "Students didn't really get the idea.",
    ],
    answer: 1,
    explain:
      "Văn phong học thuật tránh từ thông tục ('loads of', 'tons of', 'kids'); lựa chọn B trang trọng và chính xác nhất.",
  },
  {
    id: "g6",
    prompt: "Choose the correct preposition: 'The findings are consistent ____ previous research.'",
    options: ["of", "with", "to", "for"],
    answer: 1,
    explain: "Cụm cố định 'consistent with' = nhất quán / phù hợp với.",
  },
  {
    id: "g7",
    prompt: "Identify the antonym of 'increase'.",
    options: ["expand", "decline", "extend", "raise"],
    answer: 1,
    explain: "'Decline' (giảm sút) là từ trái nghĩa với 'increase' (tăng).",
  },
  {
    id: "g8",
    prompt: "Choose the best linking word: 'The plan was costly; ____, it was approved.'",
    options: ["therefore", "nevertheless", "moreover", "thus"],
    answer: 1,
    explain:
      "Ngữ cảnh tương phản (tốn kém nhưng vẫn được duyệt) → dùng 'nevertheless' (tuy nhiên).",
  },
  {
    id: "g9",
    prompt: "Select the grammatically correct sentence.",
    options: [
      "She suggested to postpone the meeting.",
      "She suggested postponing the meeting.",
      "She suggested postpone the meeting.",
      "She suggested to postponing the meeting.",
    ],
    answer: 1,
    explain: "Sau động từ 'suggest' dùng V-ing (gerund): 'suggested postponing'.",
  },
  {
    id: "g10",
    prompt: "What does the prefix 'inter-' most commonly mean (e.g. international, interact)?",
    options: ["under", "between / among", "again", "not"],
    answer: 1,
    explain: "Tiền tố 'inter-' mang nghĩa 'giữa / qua lại' (between, among).",
  },
];

const BANKS: Record<QuestionKind, Question[]> = {
  code: CODE,
  math: MATH,
  econ: ECON,
  theory: THEORY,
  english: ENGLISH,
};

/** Build the exam question list for a subject (uses its kind's bank). */
export function getExam(subject: Pick<Subject, "kind">): Question[] {
  return BANKS[subject.kind] ?? THEORY;
}
