import type { Difficulty, QuestionKind } from "./types";

export interface FptSubjectSeed {
  code: string;
  name: string;
  faculty: string;
  kind: QuestionKind;
  dur: number;
  q: number;
  diff: Difficulty;
  curriculumTerm: number;
}

/**
 * Danh mục mã môn FPTU theo 9 kỳ, được đối chiếu từ danh sách người dùng cung cấp.
 * Giữ nguyên hậu tố c/m vì đây là một phần của mã học phần trên nguồn tham chiếu.
 */
export const FPT_SUBJECT_CODES_BY_TERM = [
  {
    term: 1,
    codes: [
      "ASI101", "CEA201", "CSI104", "CSI105", "CSI106",
      "DRS102", "DTG111", "EAW211", "ECN101",
      "ECO102", "ECO111", "EPK201", "EPK202",
      "ENG302c", "ENH301", "ENM112c", "ENM301",
      "ENM302", "ENP102", "FMM101", "HMO102",
      "JPD116", "JPD126", "KRL112", "LAE101", "MAC102",
      "MAE101", "MED201", "MGT103", "MKT101",
      "PFP191", "PRF192", "SDI101m", "SSC102", "SSL101c",
    ],
  },
  {
    term: 2,
    codes: [
      "ACC101", "AET101", "AET102", "AIG201c",
      "AIG202c", "CMC201", "CPP201", "CSD203",
      "DRP101", "DTG201", "EAL201", "EAW221", "ECB101",
      "ECN211", "ECO121", "ELC201", "ENH401",
      "ENM211c", "ENM401", "EVN202", "HOM200",
      "HOM202", "HOM301", "IAO201", "IAO202",
      "JPD216", "JPD226", "KRL122", "LAB221c", "LITG202",
      "MAD101", "MMK101", "MMP201", "NWC203c",
      "NWC204", "OPB102", "OSC202", "PRN212",
      "PRO191", "PRO192", "OOP201", "SCC201",
      "SSC101", "SSG104", "TAB201",
    ],
  },
  {
    term: 3,
    codes: [
      "ACC305", "ADV201m", "AFA201", "ANS201",
      "BDM201", "BKG201", "BUF201", "CAA201",
      "CAD201", "CHI411", "CSD201", "DBI202",
      "DMA301m", "DTG302", "DTG303", "ECN221",
      "ECO201", "ENM221c", "ERW411", "FIN201",
      "FIN202", "FIN301", "GDF102", "HOD102",
      "HRM201c", "HRM202c", "HSK200", "IBC201",
      "IBI101", "ITE305c", "JJJ301", "JPD113", "JPD326",
      "KRL212", "KRL222", "LAB211", "LIT301", "MAI391",
      "MKT201", "MKT304", "MKT318m", "MMP101",
      "NWC303", "PFD201", "RMC201", "SDP201",
      "SEM101", "SSG302c", "TTG201", "VCM202",
      "VNC104", "WED201c",
    ],
  },
  {
    term: 4,
    codes: [
      "ACC302", "AIT303m", "ANB401", "ANS301",
      "BCI201c", "CCC201", "CHI421", "CHN111",
      "CSP201m", "DAP391m", "DRD204", "DXD391c",
      "DXE291c", "ECC301c", "EDT202c", "ELP311c",
      "ERW421", "FIN310", "FBM201", "FIN303", "GDF201",
      "IFB301", "IMC301c", "IOT102", "IPR102", "ITA203c",
      "JPD301", "JPD123", "JPD336", "JPD346", "KRG301",
      "KRL312", "KRL322", "MAS202", "MAS291",
      "MKT202", "MKT328m", "MPL201", "MSM201c",
      "OSP201", "PIA201c", "PRC391c", "PRC392c",
      "PRE202", "PRJ301", "PRJ302", "PST202", "SCM201",
      "SCM202", "SSM201", "SSP201", "SWE201c",
      "TPG203", "TTD202", "TTM201", "VDP201", "WMC201",
    ],
  },
  {
    term: 5,
    codes: [
      "CHN113", "CHN122", "CHN123", "CRY303c",
      "CSP301", "DBS401", "DMS301m", "DPL301m",
      "DPL302m", "DTA301", "DTG102", "DWP301c",
      "ECO301", "ENR301", "ELP321c", "EIT301",
      "FER201m", "FER202", "FIM302c", "FIN402",
      "FRS301", "HOA102", "IAA202", "IAM302", "IEP301",
      "IIP301", "ISM302", "ISP392", "ITA301", "ITE302c",
      "JBI301", "JBT301", "JIG301", "JJB391",
      "JPE301", "JSC301", "KOR311", "MCO201",
      "MKT205c", "MKT208c", "PRN211", "PRN292c",
      "PRP201c", "RES213", "RES301", "RMB302",
      "SAL301", "SAP341", "SCM301m", "SEG301m",
      "SSB201", "SWP391", "SWR302", "SWT301",
      "TMG301m", "TTM202", "TTM203", "WBS200",
    ],
  },
  {
    term: 6,
    codes: ["ENW492c", "NLP301c", "OJT202"],
  },
  {
    term: 7,
    codes: [
      "ADS301m", "AIL302m", "AIT301", "BDI302c",
      "BRA301", "CHN132", "DAT301m", "ELT401",
      "EVN201", "EXE101", "HOD401", "JAP301",
      "IAW301", "IIV301", "IMP301", "ISC301", "ISG302",
      "ITS301c", "JPD316", "JIT301", "KMS301", "KOR321",
      "LAW102", "LAW201", "LOG311", "MKT209m",
      "MKT309m", "PRM392", "PRN221", "PRU211m",
      "PRU212", "RMC301", "RMC301m", "SAP311",
      "SAP331", "SDN301m", "SSN301", "SWC201",
      "SWD391", "SWD392", "SYB302c", "WBS220",
      "WDU202c",
    ],
  },
  {
    term: 8,
    codes: [
      "AID301", "BKG302", "BPS301", "CPV301",
      "DBM301", "DBW301", "DSS301", "EXE201",
      "IFT201c", "IJS401", "JIT301", "JIT401", "JIT491",
      "KOR411", "LOG321", "MKT301", "MLN101",
      "MLN111", "MLN122", "MMA301", "PMG201c",
      "PMG202c", "PRN231", "PRU221", "PRU221m",
      "REL301m", "RMB301", "SAP321", "SPM401",
      "WDP301", "WDU203c",
    ],
  },
  {
    term: 9,
    codes: [
      "HCM201", "HCM202", "ISP490", "MLN131", "SEO102",
      "SEO201c", "SEP490", "VNR201", "VNR202",
    ],
  },
] as const;

const KNOWN_NAMES: Record<string, string> = {
  ACC101: "Nguyên lý kế toán",
  AID301: "Trí tuệ nhân tạo",
  AIL302M: "Học máy",
  CSD201: "Cấu trúc dữ liệu & Giải thuật",
  DBI202: "Cơ sở dữ liệu",
  ECO111: "Kinh tế học đại cương",
  FER201M: "Lập trình Front-End với React",
  FIN202: "Thị trường & Định chế tài chính",
  HCM201: "Tư tưởng Hồ Chí Minh",
  MAD101: "Toán rời rạc",
  MAE101: "Toán kỹ thuật",
  MAS291: "Xác suất thống kê",
  MGT103: "Nhập môn Quản trị học",
  MKT201: "Nguyên lý Marketing",
  MLN111: "Triết học Mác – Lênin",
  NLP301C: "Xử lý ngôn ngữ tự nhiên",
  NWC203C: "Mạng máy tính",
  OJT202: "Thực tập doanh nghiệp",
  PRF192: "Kỹ thuật lập trình",
  PRN211: "Lập trình ứng dụng với .NET",
  PRO192: "Lập trình hướng đối tượng",
  SEP490: "Đồ án tốt nghiệp",
  SSG104: "Kỹ năng giao tiếp và làm việc nhóm",
  SSL101C: "Kỹ năng học tập đại học",
  SWE201C: "Nhập môn Kỹ nghệ phần mềm",
};

const PREFIXES = {
  technology: [
    "ADS", "AID", "AIG", "AIL", "AIT", "CSD", "CSI", "DBI", "DBM", "DBS", "DBW",
    "DSS", "EIT", "EXE", "FER", "IAO", "IAA", "IAM", "IAW", "IBC", "IBI", "IEP", "IFT",
    "IIP", "IIV", "IJS", "IMP", "IOT", "IPR", "ISC", "ISG", "ISM", "ISP", "ITA", "ITE",
    "ITS", "JIT", "KMS", "NLP", "NWC", "OOP", "OSC", "PFP", "PMG", "PRC", "PRF", "PRJ",
    "PRM", "PRN", "PRO", "PRP", "PRU", "SDN", "SDP", "SEO", "SEP", "SPM", "SWC", "SWD",
    "SWE", "SWP", "SWR", "SWT", "WDP", "WDU", "WED",
  ],
  business: [
    "ACC", "BDI", "BDM", "BUF", "ECO", "ECN", "ENT", "FBM", "FIM", "FIN", "FRS", "HRM",
    "LAW", "LOG", "MCO", "MGT", "MKT", "MPL", "MSM", "PST", "REL", "RES", "RMB", "RMC",
    "SAL", "SAP", "SCM", "SSM", "SSP", "TAB", "TMG",
  ],
  language: [
    "AET", "CHI", "CHN", "EAL", "EAW", "ELC", "ELP", "ENH", "ENM", "ENP", "ENR", "ENW",
    "ERW", "EVN", "HSK", "JAP", "JBI", "JBT", "JIG", "JJB", "JPD", "JPE", "JSC", "KOR",
    "KRG", "KRL", "LAB", "LAE", "LIT", "VNC",
  ],
  design: [
    "ADV", "ANB", "ANS", "BKG", "BPS", "CAA", "CAD", "CEA", "CMC", "CPV", "CSP", "DAP",
    "DMA", "DMS", "DPL", "DRD", "DRP", "DRS", "DTA", "DTG", "DWP", "DXD", "DXE", "EDT",
    "GDF", "HOD", "HOA", "MED", "MMA", "MMP", "PFD", "PIA", "SDI", "SEG", "SYB", "TTD",
    "TTG", "TTM", "VCM", "VDP", "WBS", "WMC",
  ],
  math: ["AFA", "CRY", "MAC", "MAD", "MAE", "MAI", "MAS", "MMK"],
} as const;

function prefixOf(code: string) {
  return code.toUpperCase().match(/^[A-Z]+/)?.[0] ?? code.toUpperCase();
}

function includesPrefix(group: readonly string[], prefix: string) {
  return group.includes(prefix);
}

function metadataFor(code: string, term: number) {
  const prefix = prefixOf(code);
  const advanced = term >= 7 || /(?:3|4|49)/.test(code);

  if (includesPrefix(PREFIXES.technology, prefix)) {
    return {
      faculty: "Công nghệ thông tin",
      kind: "code" as const,
      dur: advanced ? 90 : 75,
      q: 40,
      diff: advanced ? "Nâng cao" as const : "Trung bình" as const,
    };
  }
  if (includesPrefix(PREFIXES.business, prefix)) {
    return {
      faculty: "Kinh doanh",
      kind: "econ" as const,
      dur: 60,
      q: 40,
      diff: advanced ? "Nâng cao" as const : "Trung bình" as const,
    };
  }
  if (includesPrefix(PREFIXES.language, prefix)) {
    return {
      faculty: "Ngoại ngữ",
      kind: "english" as const,
      dur: 60,
      q: 40,
      diff: term <= 2 ? "Cơ bản" as const : "Trung bình" as const,
    };
  }
  if (includesPrefix(PREFIXES.design, prefix)) {
    return {
      faculty: "Thiết kế & truyền thông",
      kind: "theory" as const,
      dur: 75,
      q: 35,
      diff: advanced ? "Nâng cao" as const : "Trung bình" as const,
    };
  }
  if (includesPrefix(PREFIXES.math, prefix)) {
    return {
      faculty: "Toán & khoa học cơ bản",
      kind: "math" as const,
      dur: 90,
      q: 35,
      diff: term <= 2 ? "Trung bình" as const : "Nâng cao" as const,
    };
  }
  return {
    faculty: "Kiến thức nền tảng",
    kind: "theory" as const,
    dur: 60,
    q: 40,
    diff: term <= 2 ? "Cơ bản" as const : "Trung bình" as const,
  };
}

export const FPTU_SUBJECTS: FptSubjectSeed[] = FPT_SUBJECT_CODES_BY_TERM.flatMap(
  ({ term, codes }) =>
    codes.map((code) => {
      const metadata = metadataFor(code, term);
      return {
        code,
        name: KNOWN_NAMES[code.toUpperCase()] ?? `Học phần ${code}`,
        curriculumTerm: term,
        ...metadata,
      };
    })
);
