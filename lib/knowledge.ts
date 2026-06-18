/** Chuyên mục diễn đàn "Chia sẻ kiến thức" trên trang chủ. */
export interface KnowledgeCategory {
  id: string;
  title: string;
  desc: string;
  icon: "code" | "lang" | "security" | "math";
  /** Màu icon + nền tile, lấy từ bảng màu hệ thống (blue / amber / danger / green). */
  iconColor: string;
  iconBg: string;
  tags: string[];
  topics: number;
  posts: number;
  latest: {
    title: string;
    date: string;
    author: string;
    avatar: string;
  };
}

export const KNOWLEDGE: KnowledgeCategory[] = [
  {
    id: "lap-trinh",
    title: "Lập trình",
    desc: "Kiến thức về lập trình",
    icon: "code",
    iconColor: "#1d8dc9",
    iconBg: "#e8f4fb",
    tags: ["C#, C++", "Golang", "HTML/CSS", "Java", "Javascript", "Python"],
    topics: 8,
    posts: 20,
    latest: {
      title: "Toàn bộ khóa học C# Miễn phí mà bạn nên xem qua",
      date: "14/11/25",
      author: "Minthep",
      avatar: "M",
    },
  },
  {
    id: "ngon-ngu",
    title: "Ngôn ngữ",
    desc: "Tài liệu & mẹo học ngoại ngữ",
    icon: "lang",
    iconColor: "#c98a06",
    iconBg: "#fef3df",
    tags: ["Chinese", "English", "Japanese", "Korean"],
    topics: 10,
    posts: 27,
    latest: {
      title: "Từ vựng TOEIC 30 days - 1000 từ thông dụng nhất",
      date: "22/8/25",
      author: "Minthep",
      avatar: "M",
    },
  },
  {
    id: "security",
    title: "Security",
    desc: "Reverse engineering & an toàn thông tin",
    icon: "security",
    iconColor: "#e5484d",
    iconBg: "#fdeaea",
    tags: ["Game Hacking", "Network", "Unpack / Crack"],
    topics: 6,
    posts: 14,
    latest: {
      title: "Cách dùng cheat engine tìm địa chỉ",
      date: "22/5/26",
      author: "k10n10",
      avatar: "k",
    },
  },
  {
    id: "toan-hoc",
    title: "Toán học",
    desc: "Công thức & đề ôn các môn Toán",
    icon: "math",
    iconColor: "#00a650",
    iconBg: "#e4f6ec",
    tags: ["MAD101", "MAE101", "MAI391", "MAS202", "MAS291"],
    topics: 3,
    posts: 10,
    latest: {
      title: "Công thức fe mas291",
      date: "11/4/25",
      author: "Minthep",
      avatar: "M",
    },
  },
];
