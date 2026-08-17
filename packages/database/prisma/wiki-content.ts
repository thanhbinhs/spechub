type WikiSeedArticleBase = {
  slug: string;
  title: string;
  articleType: "guide" | "introduction" | "review" | "comparison" | "tutorial";
  tags: string[];
  summary: string;
  coverImageUrl?: string;
  publishedAt: string;
  initialViews: number;
};

type StructuredWikiSeedArticle = WikiSeedArticleBase & {
  intro: string;
  outcomes: string[];
  steps: Array<{
    title: string;
    detail: string;
  }>;
  mistakes: string[];
  checklist: string[];
  takeaway: string;
};

type RichWikiSeedArticle = WikiSeedArticleBase & {
  bodyMarkdown: string;
};

export type WikiSeedArticle = StructuredWikiSeedArticle | RichWikiSeedArticle;

function renderArticle(article: WikiSeedArticle) {
  if ("bodyMarkdown" in article) {
    return article.bodyMarkdown;
  }

  const outcomes = article.outcomes.map((item) => `- ${item}`).join("\n");
  const steps = article.steps
    .map((step, index) => `### ${index + 1}. ${step.title}\n\n${step.detail}`)
    .join("\n\n");
  const mistakes = article.mistakes.map((item) => `- ${item}`).join("\n");
  const checklist = article.checklist.map((item) => `- [ ] ${item}`).join("\n");

  return `${article.intro}

> **Cách dùng bài này:** đọc phần “Hiểu nhanh”, làm lần lượt từng bước rồi dùng danh sách kiểm tra ở cuối bài. Không so sánh các kết quả benchmark khác phiên bản hoặc khác điều kiện đo.

## Hiểu nhanh

${outcomes}

## Quy trình thực hiện

${steps}

## Lỗi thường gặp

${mistakes}

## Danh sách kiểm tra

${checklist}

## Kết luận

${article.takeaway}
`;
}

const articles: WikiSeedArticle[] = [
  {
    slug: "cach-doc-thong-so-dien-thoai",
    title: "Cách đọc thông số điện thoại mà không bị rối",
    articleType: "guide",
    tags: ["dien-thoai", "nguoi-moi", "mua-sam", "thong-so"],
    summary:
      "Quy trình đọc cấu hình điện thoại theo nhu cầu thực tế, từ hiệu năng, màn hình, camera đến pin và phần mềm.",
    intro:
      "Một bảng thông số dài không đồng nghĩa với một thiết bị tốt. Cách đọc hiệu quả là bắt đầu từ nhu cầu, sau đó chỉ xem những nhóm thông số có ảnh hưởng trực tiếp tới nhu cầu đó.",
    outcomes: [
      "Biết nhóm thông số nào quan trọng với công việc, chơi game, chụp ảnh hoặc dùng cơ bản.",
      "Phân biệt thông số phần cứng với kết quả đo thực tế.",
      "Loại bỏ nhanh những mẫu không đáp ứng yêu cầu tối thiểu.",
    ],
    steps: [
      {
        title: "Viết ba nhu cầu quan trọng nhất",
        detail:
          "Ví dụ: chụp trẻ nhỏ, dùng ngoài trời và pin cả ngày. Hãy xếp thứ tự ưu tiên; một thiết bị hiếm khi đứng đầu ở mọi tiêu chí.",
      },
      {
        title: "Đọc hiệu năng cùng khả năng duy trì",
        detail:
          "Xem CPU đơn nhân, đa nhân, GPU và mức giảm hiệu năng khi tải lâu. Điểm cao trong một lượt chạy không đảm bảo máy chơi game ổn định.",
      },
      {
        title: "Đối chiếu màn hình, camera và pin bằng phép đo",
        detail:
          "Ưu tiên độ sáng thực, độ chính xác màu, thời lượng sử dụng và chất lượng ảnh trong tình huống cụ thể thay vì chỉ nhìn megapixel hoặc mAh.",
      },
      {
        title: "Kiểm tra phần mềm và tính tiện dụng",
        detail:
          "Xem thời gian cập nhật, kích thước, khối lượng, chuẩn kháng nước, cổng kết nối và khả năng sửa chữa trước khi kết luận.",
      },
    ],
    mistakes: [
      "Chọn máy chỉ vì dung lượng RAM hoặc số megapixel lớn.",
      "So điểm benchmark khác phiên bản hoặc khác chế độ hiệu năng.",
      "Bỏ qua kích thước, khối lượng và thời gian hỗ trợ phần mềm.",
    ],
    checklist: [
      "Đã xác định ba nhu cầu chính.",
      "Đã xem cả điểm đo nhanh và hiệu năng duy trì.",
      "Đã kiểm tra độ sáng màn hình và thời lượng pin thực tế.",
      "Đã xem chính sách cập nhật.",
      "Đã so ít nhất hai thiết bị cùng phân khúc.",
    ],
    takeaway:
      "Hãy coi thông số là bộ lọc ban đầu, còn benchmark, phép đo và trải nghiệm sử dụng mới là cơ sở để ra quyết định.",
    publishedAt: "2026-06-30T02:00:00.000Z",
    initialViews: 1480,
  },
  {
    slug: "cach-doc-thong-so-laptop",
    title: "Cách đọc cấu hình laptop theo đúng nhu cầu",
    articleType: "guide",
    tags: ["laptop", "nguoi-moi", "mua-sam", "thong-so"],
    summary:
      "Hướng dẫn chọn CPU, GPU, RAM, SSD, màn hình và cổng kết nối laptop theo từng kiểu công việc.",
    intro:
      "Tên CPU hoặc GPU chỉ cho biết một phần năng lực của laptop. Giới hạn điện, hệ thống tản nhiệt, màn hình, bàn phím và khả năng nâng cấp có thể tạo ra khác biệt lớn giữa hai máy dùng cùng linh kiện.",
    outcomes: [
      "Ghép đúng cấu hình với học tập, văn phòng, đồ họa hoặc chơi game.",
      "Nhận ra tác động của công suất và tản nhiệt.",
      "Không trả thêm tiền cho cấu hình không mang lại lợi ích thực tế.",
    ],
    steps: [
      {
        title: "Xác định khối lượng công việc",
        detail:
          "Ghi rõ phần mềm, độ phân giải dự án, số tab thường mở và yêu cầu di chuyển. Đây là đầu vào để chọn CPU, GPU, RAM và pin.",
      },
      {
        title: "Đọc CPU và GPU trong đúng giới hạn điện",
        detail:
          "Cùng một tên chip có thể chạy ở mức công suất khác nhau. Hãy xem benchmark của đúng mẫu laptop và kiểm tra hiệu năng duy trì.",
      },
      {
        title: "Kiểm tra RAM, SSD và khả năng nâng cấp",
        detail:
          "Xem dung lượng, số kênh nhớ, RAM hàn hay tháo được, số khe SSD và chuẩn PCIe. Nâng cấp được giúp kéo dài vòng đời máy.",
      },
      {
        title: "Đánh giá phần còn lại như một hệ thống",
        detail:
          "Màn hình, pin, khối lượng, bàn phím, touchpad, webcam, tiếng quạt và cổng kết nối đều ảnh hưởng trực tiếp đến năng suất.",
      },
    ],
    mistakes: [
      "So CPU laptop chỉ bằng số nhân hoặc xung nhịp.",
      "Mua GPU mạnh trong thân máy quá mỏng nhưng không xem công suất.",
      "Bỏ qua RAM hàn, số khe SSD và bộ sạc phải mang theo.",
    ],
    checklist: [
      "Đã liệt kê phần mềm và khối lượng công việc.",
      "Đã xem benchmark của đúng mẫu laptop.",
      "Đã kiểm tra RAM và SSD có nâng cấp được không.",
      "Đã xem thời lượng pin, tiếng quạt và nhiệt độ.",
      "Đã kiểm tra đủ cổng cho thiết bị ngoại vi.",
    ],
    takeaway:
      "Laptop tốt là một hệ thống cân bằng. Cấu hình cao nhưng màn hình kém, nóng hoặc thiếu cổng vẫn có thể là lựa chọn không phù hợp.",
    publishedAt: "2026-07-01T02:00:00.000Z",
    initialViews: 1320,
  },
  {
    slug: "hieu-diem-tong-va-do-phu-du-lieu",
    title: "Hiểu điểm tổng và độ phủ dữ liệu trên SpecHub",
    articleType: "introduction",
    tags: ["spechub", "diem-so", "benchmark", "nguoi-moi"],
    summary:
      "Giải thích sự khác nhau giữa dữ liệu gốc, điểm module, điểm tổng và độ phủ công thức khi so sánh thiết bị.",
    intro:
      "SpecHub dùng ba tầng dữ liệu: phép đo gốc, điểm từng module và điểm tổng. Độ phủ cho biết công thức có đủ đầu vào hay không, không phải là điểm chất lượng của thiết bị.",
    outcomes: [
      "Phân biệt điểm benchmark gốc với điểm chuẩn hóa 0–100.",
      "Hiểu vì sao hai loại thiết bị có trọng số khác nhau.",
      "Biết khi nào nên tin vào điểm tổng và khi nào phải đọc sâu hơn.",
    ],
    steps: [
      {
        title: "Bắt đầu từ dữ liệu gốc",
        detail:
          "Dữ liệu gốc có thể là Geekbench, 3DMark, độ sáng nit, thời lượng pin hoặc thời gian sạc. Chỉ so trực tiếp khi cùng phép đo và phiên bản.",
      },
      {
        title: "Đọc điểm module",
        detail:
          "Mỗi module gom các phép đo liên quan và chuẩn hóa về cùng thang 0–100. Ví dụ hiệu năng có CPU, GPU, AI và khả năng duy trì.",
      },
      {
        title: "Đọc trọng số theo loại thiết bị",
        detail:
          "Điện thoại ưu tiên camera và tính di động; laptop ưu tiên CPU, GPU, bộ nhớ và tản nhiệt. Vì vậy cùng một module có thể mang trọng số khác nhau.",
      },
      {
        title: "Kiểm tra độ phủ công thức",
        detail:
          "Độ phủ 100% nghĩa là công thức có đủ đầu vào cần thiết. Hãy mở chi tiết để biết đầu vào nào là phép đo trực tiếp và đầu vào nào là dữ liệu tham chiếu.",
      },
    ],
    mistakes: [
      "Hiểu độ phủ 100% là thiết bị đạt chất lượng tuyệt đối.",
      "Cộng trực tiếp GHz, mAh và nit mà không chuẩn hóa.",
      "Dùng điểm tổng để kết luận khi nhu cầu cá nhân chỉ tập trung vào một module.",
    ],
    checklist: [
      "Đã xem điểm tổng.",
      "Đã xem trọng số module theo loại thiết bị.",
      "Đã kiểm tra độ phủ công thức.",
      "Đã phân biệt phép đo trực tiếp và dữ liệu tham chiếu.",
      "Đã đọc module liên quan nhất tới nhu cầu.",
    ],
    takeaway:
      "Điểm tổng giúp sàng lọc nhanh; quyết định tốt vẫn cần dựa trên module quan trọng nhất với bạn và dữ liệu gốc phía dưới.",
    publishedAt: "2026-07-02T02:00:00.000Z",
    initialViews: 970,
  },
  {
    slug: "quy-trinh-so-sanh-hai-thiet-bi",
    title: "Quy trình so sánh hai thiết bị công bằng",
    articleType: "tutorial",
    tags: ["so-sanh", "mua-sam", "spechub", "nguoi-moi"],
    summary:
      "Một quy trình ngắn giúp so sánh hai thiết bị cùng nhu cầu, cùng phép đo và không bị điểm tổng đánh lạc hướng.",
    intro:
      "So sánh công bằng không bắt đầu bằng câu hỏi “máy nào mạnh hơn” mà bằng “máy nào phù hợp hơn với cùng một nhu cầu và ngân sách”.",
    outcomes: [
      "Tạo bộ tiêu chí cá nhân trước khi nhìn kết quả.",
      "Chỉ kết luận hơn kém khi dữ liệu cùng chuẩn.",
      "Biết chấp nhận đánh đổi giữa hiệu năng, pin, camera và giá.",
    ],
    steps: [
      {
        title: "Khóa nhu cầu và ngân sách",
        detail:
          "Viết ba tiêu chí bắt buộc, hai tiêu chí mong muốn và mức ngân sách tối đa. Không thay đổi danh sách sau khi thấy một thiết bị hấp dẫn.",
      },
      {
        title: "Đặt hai phiên bản tương đương",
        detail:
          "So dung lượng RAM, lưu trữ, kết nối và tình trạng bán tương đương. Giá của hai cấu hình khác nhau có thể làm sai kết luận.",
      },
      {
        title: "Đọc khác biệt nổi bật trước",
        detail:
          "Xem điểm tổng, hiệu năng, pin, giá và khối lượng. Sau đó mở bảng chi tiết tại các module có chênh lệch lớn.",
      },
      {
        title: "Ghi rõ đánh đổi",
        detail:
          "Kết luận theo mẫu: thiết bị A tốt hơn cho nhu cầu X vì Y, nhưng phải đổi lại Z. Cách viết này tránh kết luận tuyệt đối.",
      },
    ],
    mistakes: [
      "So hai phiên bản có dung lượng hoặc giá quá khác nhau.",
      "Kết luận từ một chỉ số không cùng benchmark.",
      "Đếm số tiêu chí thắng mà không xét mức quan trọng.",
    ],
    checklist: [
      "Hai thiết bị phục vụ cùng nhu cầu.",
      "Hai cấu hình có thể so sánh trực tiếp.",
      "Benchmark dùng cùng phiên bản.",
      "Đã xem chênh lệch giá và khối lượng.",
      "Kết luận đã nêu rõ đánh đổi.",
    ],
    takeaway:
      "Một phép so sánh tốt phải giải thích được vì sao thiết bị thắng trong bối cảnh cụ thể, thay vì chỉ công bố một người thắng chung cuộc.",
    publishedAt: "2026-07-03T02:00:00.000Z",
    initialViews: 1210,
  },
  {
    slug: "antutu-geekbench-3dmark-dung-de-lam-gi",
    title: "AnTuTu, Geekbench và 3DMark dùng để làm gì?",
    articleType: "introduction",
    tags: ["benchmark", "hieu-nang", "cpu", "gpu", "dien-thoai"],
    summary:
      "Phân biệt mục đích của các bộ benchmark phổ biến và cách tránh so sánh sai phiên bản hoặc sai nền tảng.",
    intro:
      "Mỗi benchmark trả lời một câu hỏi khác nhau. Không có một con số duy nhất mô tả đầy đủ tốc độ của thiết bị trong mọi tác vụ.",
    outcomes: [
      "Biết benchmark nào phù hợp với CPU, GPU hoặc tổng thể hệ thống.",
      "Hiểu điểm cao chưa chắc đồng nghĩa trải nghiệm luôn mượt.",
      "Nhận biết điều kiện để hai kết quả có thể đối chiếu.",
    ],
    steps: [
      {
        title: "Dùng Geekbench để xem CPU",
        detail:
          "Điểm đơn nhân gần với tác vụ ngắn và độ phản hồi; điểm đa nhân phản ánh công việc tận dụng nhiều luồng. Chỉ so trong cùng phiên bản Geekbench.",
      },
      {
        title: "Dùng 3DMark để xem GPU",
        detail:
          "Chọn đúng bài đo và API đồ họa. Bài stress test còn cho biết độ ổn định sau nhiều vòng chạy.",
      },
      {
        title: "Dùng AnTuTu như chỉ báo tổng hợp",
        detail:
          "AnTuTu kết hợp CPU, GPU, bộ nhớ và trải nghiệm hệ thống. Điểm phù hợp để sàng lọc cùng nền tảng, không thay thế phép đo chuyên biệt.",
      },
      {
        title: "Đối chiếu với tác vụ thật",
        detail:
          "Kiểm tra thời gian xuất video, tốc độ biên dịch, FPS trò chơi hoặc độ trễ mở ứng dụng tùy nhu cầu.",
      },
    ],
    mistakes: [
      "So AnTuTu giữa hai phiên bản ứng dụng khác nhau.",
      "Dùng điểm đa nhân để dự đoán mọi tác vụ.",
      "Bỏ qua nhiệt độ, chế độ hiệu năng và dung lượng pin khi đo.",
    ],
    checklist: [
      "Kết quả cùng benchmark và cùng phiên bản.",
      "Điều kiện nguồn điện và chế độ hiệu năng tương đương.",
      "Đã xem cả điểm đơn nhân và đa nhân.",
      "Đã xem bài đo GPU hoặc trò chơi thực tế.",
      "Đã kiểm tra hiệu năng duy trì.",
    ],
    takeaway:
      "Hãy chọn benchmark theo câu hỏi cần trả lời và luôn ghép điểm số với phép đo dài hạn hoặc tác vụ thật.",
    publishedAt: "2026-07-04T02:00:00.000Z",
    initialViews: 1640,
  },
  {
    slug: "cpu-gpu-npu-khac-nhau-nhu-the-nao",
    title: "CPU, GPU và NPU khác nhau như thế nào?",
    articleType: "introduction",
    tags: ["cpu", "gpu", "npu", "hieu-nang", "ai"],
    summary:
      "Giải thích vai trò của CPU, GPU và NPU bằng tác vụ thực tế để chọn thiết bị đúng nhu cầu.",
    intro:
      "Ba bộ xử lý có thể nằm trong cùng một chipset nhưng được tối ưu cho kiểu công việc khác nhau. Hiểu vai trò giúp bạn không đánh giá cả thiết bị chỉ từ tên CPU.",
    outcomes: [
      "CPU xử lý luồng công việc tổng quát và điều phối hệ thống.",
      "GPU xử lý song song cho đồ họa và nhiều phép tính lớn.",
      "NPU tăng tốc mô hình AI với hiệu suất điện tốt hơn.",
    ],
    steps: [
      {
        title: "Ghép CPU với tác vụ tổng quát",
        detail:
          "Mở ứng dụng, duyệt web, chạy mã, nén tệp và nhiều tác vụ văn phòng phụ thuộc đáng kể vào CPU và hiệu năng đơn nhân.",
      },
      {
        title: "Ghép GPU với hình ảnh và tính toán song song",
        detail:
          "Trò chơi, dựng hình, hiệu ứng video và một số phần mềm sáng tạo dùng GPU. VRAM và giới hạn điện cũng quan trọng như tên GPU.",
      },
      {
        title: "Ghép NPU với AI tại thiết bị",
        detail:
          "NPU có thể xử lý nhận diện hình ảnh, khử ồn, phiên âm hoặc mô hình AI cục bộ. TOPS không thể so trực tiếp nếu độ chính xác số khác nhau.",
      },
      {
        title: "Kiểm tra phần mềm có thực sự sử dụng phần cứng",
        detail:
          "Một bộ xử lý mạnh chỉ tạo lợi ích khi hệ điều hành, trình điều khiển và ứng dụng hỗ trợ đúng đường tăng tốc.",
      },
    ],
    mistakes: [
      "Coi TOPS là thước đo duy nhất của AI.",
      "Chọn GPU mạnh nhưng thiếu VRAM cho dự án.",
      "Đánh giá CPU chỉ bằng xung nhịp tối đa.",
    ],
    checklist: [
      "Đã xác định tác vụ phụ thuộc CPU, GPU hay NPU.",
      "Đã kiểm tra benchmark đúng loại.",
      "Đã xem giới hạn điện và tản nhiệt.",
      "Đã kiểm tra bộ nhớ hoặc VRAM.",
      "Ứng dụng cần dùng có hỗ trợ tăng tốc.",
    ],
    takeaway:
      "Đừng hỏi bộ xử lý nào mạnh nhất; hãy hỏi bộ xử lý nào được phần mềm của bạn sử dụng nhiều nhất và có thể duy trì hiệu năng tốt.",
    publishedAt: "2026-07-05T02:00:00.000Z",
    initialViews: 1180,
  },
  {
    slug: "cach-kiem-tra-hieu-nang-duy-tri",
    title: "Cách kiểm tra throttling và hiệu năng duy trì",
    articleType: "tutorial",
    tags: ["hieu-nang", "nhiet-do", "benchmark", "dien-thoai", "laptop"],
    summary:
      "Hướng dẫn đọc stress test, nhiệt độ và mức suy giảm hiệu năng khi thiết bị hoạt động trong thời gian dài.",
    intro:
      "Thiết bị có thể đạt điểm rất cao trong vài phút rồi giảm tốc để kiểm soát nhiệt. Hiệu năng duy trì cho biết tốc độ bạn thực sự nhận được trong phiên làm việc dài.",
    outcomes: [
      "Phân biệt điểm đỉnh với điểm ổn định.",
      "Đọc được phần trăm ổn định của stress test.",
      "Nhận biết suy giảm do nhiệt, giới hạn điện hoặc pin.",
    ],
    steps: [
      {
        title: "Ghi lại điểm và nhiệt độ ban đầu",
        detail:
          "Để thiết bị nguội, đặt độ sáng và chế độ nguồn cố định, sau đó chạy một lượt làm mốc.",
      },
      {
        title: "Chạy tải lặp đủ lâu",
        detail:
          "Dùng stress test hoặc tác vụ thật từ 15 đến 30 phút. Với laptop, kiểm tra cả khi cắm nguồn và khi dùng pin nếu cần.",
      },
      {
        title: "Tính mức duy trì",
        detail:
          "Lấy hiệu năng ổn định cuối phiên chia cho hiệu năng đỉnh. Đồng thời quan sát dao động, nhiệt độ bề mặt và tiếng quạt.",
      },
      {
        title: "Lặp lại trong điều kiện sử dụng thực",
        detail:
          "Ốp lưng, nhiệt độ phòng, đế kê và chế độ quạt đều có thể thay đổi kết quả. Ghi rõ điều kiện bên cạnh con số.",
      },
    ],
    mistakes: [
      "Chỉ chạy một lượt benchmark ngắn.",
      "So hai thiết bị trong nhiệt độ phòng khác nhau.",
      "Coi nhiệt độ chip và nhiệt độ bề mặt là một.",
    ],
    checklist: [
      "Thiết bị bắt đầu ở nhiệt độ tương đương.",
      "Độ sáng và chế độ nguồn đã cố định.",
      "Tải được chạy ít nhất 15 phút.",
      "Đã ghi điểm đỉnh, điểm ổn định và nhiệt độ.",
      "Đã thử lại với tác vụ thực tế.",
    ],
    takeaway:
      "Đối với chơi game, dựng video và công việc dài, hiệu năng duy trì thường có giá trị hơn điểm cao nhất của một lượt chạy.",
    publishedAt: "2026-07-06T02:00:00.000Z",
    initialViews: 760,
  },
  {
    slug: "oled-lcd-mini-led-nen-chon-loai-nao",
    title: "OLED, LCD và mini-LED: nên chọn loại màn hình nào?",
    articleType: "comparison",
    tags: ["man-hinh", "oled", "lcd", "mini-led", "mua-sam"],
    summary:
      "So sánh ưu, nhược điểm của OLED, LCD và mini-LED theo độ tương phản, độ sáng, độ bền và nhu cầu sử dụng.",
    intro:
      "Công nghệ tấm nền ảnh hưởng đến màu đen, độ tương phản, độ sáng, hiện tượng lưu ảnh và mức giá. Không có lựa chọn tốt nhất cho mọi người.",
    outcomes: [
      "OLED có màu đen sâu và phản hồi nhanh.",
      "LCD thường dễ tiếp cận và không có lưu ảnh hữu cơ.",
      "Mini-LED tăng độ sáng và tương phản bằng nhiều vùng làm tối cục bộ.",
    ],
    steps: [
      {
        title: "Xác định môi trường sử dụng",
        detail:
          "Dùng ngoài trời cần độ sáng tốt; xem phim phòng tối cần màu đen sâu; làm việc tĩnh nhiều giờ cần cân nhắc lưu ảnh và độ đồng đều.",
      },
      {
        title: "Đọc phép đo thay vì tên thương mại",
        detail:
          "So độ sáng SDR, HDR, độ tương phản, gam màu, Delta E, phản hồi và tần số PWM của đúng mẫu màn hình.",
      },
      {
        title: "Kiểm tra cách kiểm soát độ sáng",
        detail:
          "Một số OLED dùng PWM ở độ sáng thấp. Người nhạy cảm nên thử trực tiếp hoặc xem phép đo tần số và biên độ nhấp nháy.",
      },
      {
        title: "Đánh giá tuổi thọ và bảo hành",
        detail:
          "Xem cơ chế dịch chuyển điểm ảnh, bảo hành lưu ảnh, số vùng làm tối của mini-LED và độ đồng đều nền của LCD.",
      },
    ],
    mistakes: [
      "Cho rằng mọi màn hình OLED có chất lượng giống nhau.",
      "Dùng độ sáng HDR đỉnh để dự đoán độ sáng làm việc thường ngày.",
      "Bỏ qua phản chiếu, lớp phủ và PWM.",
    ],
    checklist: [
      "Đã xác định môi trường sáng hoặc tối.",
      "Đã xem độ sáng SDR và HDR riêng.",
      "Đã kiểm tra độ chính xác màu.",
      "Đã xem PWM hoặc hiện tượng nhấp nháy.",
      "Đã cân nhắc lưu ảnh và bảo hành.",
    ],
    takeaway:
      "Chọn công nghệ tấm nền sau khi xác định môi trường và nội dung sử dụng; sau đó dùng phép đo của đúng sản phẩm để quyết định.",
    publishedAt: "2026-07-07T02:00:00.000Z",
    initialViews: 1390,
  },
  {
    slug: "tan-so-quet-va-thoi-gian-phan-hoi",
    title: "Tần số quét và thời gian phản hồi khác nhau ra sao?",
    articleType: "introduction",
    tags: ["man-hinh", "tan-so-quet", "gaming", "do-tre"],
    summary:
      "Giải thích Hz, FPS, thời gian phản hồi điểm ảnh và độ trễ đầu vào bằng các ví dụ dễ áp dụng.",
    intro:
      "Tần số quét cho biết màn hình có thể cập nhật bao nhiêu lần mỗi giây; thời gian phản hồi cho biết điểm ảnh đổi trạng thái nhanh thế nào. Hai chỉ số liên quan nhưng không thay thế nhau.",
    outcomes: [
      "Phân biệt Hz của màn hình với FPS của nội dung.",
      "Hiểu hiện tượng bóng mờ và overshoot.",
      "Biết khi nào tần số quét cao tạo khác biệt rõ.",
    ],
    steps: [
      {
        title: "Kiểm tra tần số quét thực",
        detail:
          "Xem màn hình hỗ trợ mức cố định hay biến thiên, dải VRR và khả năng giảm tần số khi nội dung tĩnh.",
      },
      {
        title: "Đối chiếu với tốc độ khung hình",
        detail:
          "Màn hình 120 Hz chỉ phát huy đầy đủ khi hệ thống tạo đủ khung hình. VRR giúp giảm xé hình khi FPS dao động.",
      },
      {
        title: "Đọc thời gian phản hồi",
        detail:
          "Ưu tiên phép đo nhiều chuyển sắc thay vì một con số quảng cáo. Phản hồi quá chậm gây bóng mờ; tăng tốc quá mạnh có thể gây viền ngược.",
      },
      {
        title: "Kiểm tra độ trễ toàn hệ thống",
        detail:
          "Độ trễ còn đến từ đầu vào, xử lý hình ảnh, trò chơi và thiết bị điều khiển. TV nên bật chế độ trò chơi khi cần.",
      },
    ],
    mistakes: [
      "Cho rằng 120 Hz luôn tạo ra 120 FPS.",
      "Chỉ nhìn phản hồi 1 ms do hãng công bố.",
      "Bỏ qua dải VRR và độ trễ đầu vào.",
    ],
    checklist: [
      "Đã xem tần số quét tối đa và dải VRR.",
      "GPU đủ khả năng tạo FPS mục tiêu.",
      "Đã xem phép đo phản hồi nhiều chuyển sắc.",
      "Đã kiểm tra overshoot.",
      "Đã kiểm tra độ trễ đầu vào.",
    ],
    takeaway:
      "Trải nghiệm chuyển động tốt cần sự phối hợp giữa tần số quét, FPS, phản hồi điểm ảnh, VRR và độ trễ toàn hệ thống.",
    publishedAt: "2026-07-08T02:00:00.000Z",
    initialViews: 1040,
  },
  {
    slug: "do-sang-hdr-mau-sac-va-pwm",
    title: "Đọc độ sáng, HDR, màu sắc và PWM của màn hình",
    articleType: "guide",
    tags: ["man-hinh", "hdr", "mau-sac", "pwm", "bao-ve-mat"],
    summary:
      "Cách đọc bốn nhóm phép đo màn hình quan trọng mà không nhầm giữa con số quảng cáo và trải nghiệm thực tế.",
    intro:
      "Một màn hình dễ nhìn không chỉ cần độ phân giải cao. Độ sáng, phản chiếu, độ chính xác màu, HDR và cách điều khiển độ sáng cùng quyết định trải nghiệm.",
    outcomes: [
      "Phân biệt độ sáng SDR toàn màn hình với độ sáng HDR đỉnh.",
      "Hiểu gam màu rộng không đồng nghĩa màu chính xác.",
      "Biết PWM có thể ảnh hưởng đến người nhạy cảm.",
    ],
    steps: [
      {
        title: "Đọc độ sáng đúng ngữ cảnh",
        detail:
          "Dùng độ sáng SDR và độ phản chiếu để đánh giá ngoài trời. Độ sáng HDR đỉnh thường chỉ áp dụng cho vùng nhỏ trong thời gian ngắn.",
      },
      {
        title: "Đọc HDR như một hệ thống",
        detail:
          "HDR cần độ sáng, độ tương phản, khả năng làm tối và xử lý tông màu. Nhãn HDR đơn lẻ không đảm bảo hình ảnh ấn tượng.",
      },
      {
        title: "Kiểm tra gam màu và Delta E",
        detail:
          "Gam màu cho biết phạm vi màu; Delta E cho biết sai lệch so với chuẩn. Chế độ màu chính xác thường hữu ích cho chỉnh ảnh.",
      },
      {
        title: "Kiểm tra PWM ở nhiều mức sáng",
        detail:
          "Tần số, biên độ và mức sáng kích hoạt đều quan trọng. Người nhạy cảm nên thử sử dụng trong môi trường tối trước khi mua.",
      },
    ],
    mistakes: [
      "So độ sáng đỉnh HDR với độ sáng SDR toàn màn hình.",
      "Cho rằng màu rực hơn là màu chính xác hơn.",
      "Kết luận PWM chỉ bằng tần số mà bỏ qua biên độ.",
    ],
    checklist: [
      "Đã xem độ sáng SDR.",
      "Đã xem phản chiếu màn hình.",
      "Đã kiểm tra độ tương phản và HDR.",
      "Đã xem gam màu và Delta E.",
      "Đã kiểm tra PWM ở mức sáng thường dùng.",
    ],
    takeaway:
      "Hãy đọc màn hình bằng một nhóm phép đo liên kết với nhau và ưu tiên điều kiện sử dụng thực tế của bạn.",
    publishedAt: "2026-07-09T02:00:00.000Z",
    initialViews: 820,
  },
  {
    slug: "cach-doc-thong-so-camera-dien-thoai",
    title: "Cách đọc thông số camera điện thoại",
    articleType: "guide",
    tags: ["camera", "dien-thoai", "nhiep-anh", "thong-so"],
    summary:
      "Giải thích cảm biến, tiêu cự, khẩu độ, chống rung và xử lý ảnh để đánh giá camera điện thoại đầy đủ hơn.",
    intro:
      "Megapixel chỉ mô tả số điểm ảnh đầu ra. Chất lượng ảnh còn phụ thuộc cảm biến, ống kính, lấy nét, chống rung, xử lý tín hiệu và thuật toán.",
    outcomes: [
      "Đọc kích thước cảm biến và kích thước điểm ảnh đúng cách.",
      "Phân biệt khẩu độ, tiêu cự và góc nhìn.",
      "Hiểu vai trò của OIS, AF, ISP và xử lý nhiều khung hình.",
    ],
    steps: [
      {
        title: "Xác định vai trò từng camera",
        detail:
          "Tách camera chính, siêu rộng, tele và selfie. Không cộng số megapixel giữa các camera để tạo một điểm chất lượng.",
      },
      {
        title: "Đọc phần cứng thu sáng",
        detail:
          "Cảm biến lớn và khẩu độ phù hợp có thể thu nhiều ánh sáng hơn, nhưng độ sâu trường ảnh, chất lượng ống kính và xử lý vẫn quan trọng.",
      },
      {
        title: "Kiểm tra lấy nét và chống rung",
        detail:
          "AF nhanh giúp bắt khoảnh khắc; OIS hỗ trợ ảnh thiếu sáng và video. Camera siêu rộng hoặc selfie không phải lúc nào cũng có AF.",
      },
      {
        title: "Xem ảnh mẫu trong cùng tình huống",
        detail:
          "So chi tiết, dải sáng, màu da, nhiễu, chuyển động và độ nhất quán giữa các ống kính ở ban ngày lẫn ban đêm.",
      },
    ],
    mistakes: [
      "Xếp hạng camera chỉ bằng megapixel.",
      "Nhầm zoom số với camera tele quang học.",
      "Chỉ xem ảnh đủ sáng và bỏ qua chủ thể chuyển động.",
    ],
    checklist: [
      "Đã xác định vai trò từng camera.",
      "Đã xem kích thước cảm biến và tiêu cự tương đương.",
      "Đã kiểm tra AF và OIS.",
      "Đã xem ảnh người, đêm và chuyển động.",
      "Đã kiểm tra độ nhất quán màu giữa các camera.",
    ],
    takeaway:
      "Thông số camera giúp hiểu giới hạn phần cứng; ảnh mẫu có kiểm soát mới cho biết hệ thống camera xử lý tình huống thực tế tốt đến đâu.",
    publishedAt: "2026-07-10T02:00:00.000Z",
    initialViews: 1510,
  },
  {
    slug: "camera-chinh-sieu-rong-tele-dung-khi-nao",
    title: "Camera chính, siêu rộng và tele dùng khi nào?",
    articleType: "tutorial",
    tags: ["camera", "nhiep-anh", "dien-thoai", "tieu-cu"],
    summary:
      "Hướng dẫn chọn đúng camera theo chủ thể, khoảng cách và điều kiện sáng để ảnh ít méo và giữ được nhiều chi tiết.",
    intro:
      "Chọn đúng tiêu cự thường tạo khác biệt lớn hơn việc tăng độ bão hòa hoặc dùng bộ lọc. Mỗi camera có khoảng cách làm việc và điểm mạnh riêng.",
    outcomes: [
      "Dùng camera chính cho tình huống tổng quát và thiếu sáng.",
      "Dùng siêu rộng khi cần không gian nhưng kiểm soát méo hình.",
      "Dùng tele cho chân dung, chi tiết xa và phối cảnh nén.",
    ],
    steps: [
      {
        title: "Bắt đầu bằng camera chính",
        detail:
          "Camera chính thường có cảm biến lớn, OIS và xử lý tốt nhất. Hãy di chuyển vị trí trước khi chuyển sang zoom số.",
      },
      {
        title: "Dùng siêu rộng có chủ đích",
        detail:
          "Giữ đường chân trời thẳng, tránh đặt khuôn mặt sát mép và tìm tiền cảnh để tạo chiều sâu. Kiểm tra AF nếu chụp cận cảnh.",
      },
      {
        title: "Dùng tele khi đủ sáng",
        detail:
          "Tele giúp giảm méo khuôn mặt và tách chủ thể. Trong thiếu sáng, máy có thể tự cắt từ camera chính; hãy kiểm tra thông tin ảnh.",
      },
      {
        title: "Giữ màu sắc nhất quán",
        detail:
          "Khóa phơi sáng hoặc cân bằng trắng khi cần, đặc biệt khi quay video chuyển qua nhiều camera.",
      },
    ],
    mistakes: [
      "Dùng siêu rộng chụp chân dung sát mép khung.",
      "Dùng zoom số quá lớn rồi kỳ vọng chi tiết quang học.",
      "Che ống kính tele hoặc siêu rộng khi cầm ngang.",
    ],
    checklist: [
      "Đã lau sạch cụm ống kính.",
      "Đã chọn tiêu cự theo chủ thể.",
      "Đã kiểm tra ánh sáng trước khi dùng tele.",
      "Đường chân trời không bị nghiêng.",
      "Màu và phơi sáng nhất quán giữa các camera.",
    ],
    takeaway:
      "Hãy xem cụm camera như một bộ ống kính: chọn tiêu cự theo câu chuyện muốn kể, không chỉ theo mức zoom hiển thị trên màn hình.",
    publishedAt: "2026-07-11T02:00:00.000Z",
    initialViews: 890,
  },
  {
    slug: "danh-gia-kha-nang-quay-video",
    title: "Cách đánh giá khả năng quay video của thiết bị",
    articleType: "guide",
    tags: ["camera", "video", "ois", "microphone", "sang-tao"],
    summary:
      "Quy trình đánh giá độ phân giải, tốc độ khung hình, chống rung, dải sáng, âm thanh và nhiệt khi quay video.",
    intro:
      "Độ phân giải 4K hoặc 8K không tự đảm bảo video tốt. Chất lượng còn phụ thuộc đọc cảm biến, bitrate, chống rung, lấy nét, âm thanh và khả năng duy trì.",
    outcomes: [
      "Chọn đúng độ phân giải và FPS theo nội dung.",
      "Kiểm tra chống rung, lấy nét và dải sáng.",
      "Phát hiện giới hạn nhiệt hoặc thời lượng ghi.",
    ],
    steps: [
      {
        title: "Chọn cấu hình quay thực tế",
        detail:
          "Quay thử ở độ phân giải và FPS bạn sẽ dùng, không chỉ ở chế độ cao nhất. Kiểm tra camera nào hỗ trợ từng chế độ.",
      },
      {
        title: "Thử chuyển động và ánh sáng khó",
        detail:
          "Đi bộ, lia máy, quay ngược sáng và quay chủ thể di chuyển để xem rung, rolling shutter, lấy nét và chuyển tông.",
      },
      {
        title: "Kiểm tra âm thanh",
        detail:
          "Nghe giọng nói, tiếng gió, âm lượng lớn và khả năng chuyển hướng micro khi zoom. Kiểm tra hỗ trợ micro ngoài nếu cần.",
      },
      {
        title: "Quay liên tục",
        detail:
          "Theo dõi nhiệt độ, giảm sáng màn hình, thời lượng ghi, dung lượng tệp và hao pin trong một phiên dài.",
      },
    ],
    mistakes: [
      "Chỉ quay một đoạn tĩnh đủ sáng.",
      "So video sau khi nền tảng mạng xã hội đã nén.",
      "Bỏ qua âm thanh và giới hạn nhiệt.",
    ],
    checklist: [
      "Đã thử đúng độ phân giải và FPS cần dùng.",
      "Đã thử đi bộ và lia máy.",
      "Đã thử ngược sáng và thiếu sáng.",
      "Đã nghe lại âm thanh bằng tai nghe.",
      "Đã quay liên tục đủ lâu.",
    ],
    takeaway:
      "Một hệ thống video tốt phải ổn định cả hình, tiếng và nhiệt trong đúng cấu hình bạn sẽ sử dụng thường xuyên.",
    publishedAt: "2026-07-12T02:00:00.000Z",
    initialViews: 640,
  },
  {
    slug: "mah-khong-phai-la-thoi-luong-pin",
    title: "Vì sao mAh không phải là thời lượng pin?",
    articleType: "introduction",
    tags: ["pin-sac", "thoi-luong-pin", "dien-thoai", "laptop"],
    summary:
      "Giải thích mAh, Wh, mức tiêu thụ điện và cách đọc bài đo pin theo đúng kiểu sử dụng.",
    intro:
      "Dung lượng pin là lượng năng lượng có thể lưu trữ, còn thời lượng phụ thuộc mức tiêu thụ của toàn hệ thống. Hai thiết bị có pin giống nhau có thể dùng lâu rất khác nhau.",
    outcomes: [
      "Biết khi nào dùng mAh và khi nào dùng Wh.",
      "Hiểu tác động của màn hình, modem, chipset và phần mềm.",
      "Chọn đúng bài đo pin theo nhu cầu.",
    ],
    steps: [
      {
        title: "Đọc đơn vị đúng",
        detail:
          "mAh cần đi cùng điện áp để quy đổi năng lượng. Wh phù hợp hơn khi so pin laptop hoặc các thiết bị có điện áp khác nhau.",
      },
      {
        title: "Tách các kiểu tải",
        detail:
          "Duyệt web Wi‑Fi, xem video, chơi game, gọi 5G và chờ dùng các thành phần khác nhau. Không dùng một bài đo để đại diện mọi tình huống.",
      },
      {
        title: "Chuẩn hóa điều kiện",
        detail:
          "So ở độ sáng, tần số quét, kết nối và cấu hình tương đương. Sóng yếu có thể làm modem tiêu thụ nhiều điện hơn.",
      },
      {
        title: "Xem thêm hao pin chờ",
        detail:
          "Thiết bị có thời lượng tác vụ tốt nhưng hao pin nền cao vẫn gây bất tiện. Kiểm tra mức mất pin qua đêm và ứng dụng chạy nền.",
      },
    ],
    mistakes: [
      "Kết luận pin lớn hơn luôn dùng lâu hơn.",
      "So mAh giữa thiết bị có điện áp khác nhau.",
      "Bỏ qua độ sáng và chất lượng sóng khi đọc bài đo.",
    ],
    checklist: [
      "Đã xem dung lượng theo đơn vị phù hợp.",
      "Đã chọn bài đo giống cách sử dụng.",
      "Độ sáng và kết nối tương đương.",
      "Đã xem hao pin chờ.",
      "Đã kiểm tra tốc độ sạc và nhiệt khi sạc.",
    ],
    takeaway:
      "Hãy dùng dung lượng pin để hiểu phần cứng, nhưng dùng bài đo thời lượng trong nhiều kịch bản để dự đoán trải nghiệm.",
    publishedAt: "2026-07-13T02:00:00.000Z",
    initialViews: 1250,
  },
  {
    slug: "cach-doc-toc-do-va-hieu-suat-sac",
    title: "Cách đọc tốc độ sạc và hiệu suất sạc",
    articleType: "guide",
    tags: ["pin-sac", "sac-nhanh", "usb-c", "nhiet-do"],
    summary:
      "Hướng dẫn đánh giá công suất đỉnh, thời gian sạc, giao thức, nhiệt độ và năng lượng tiêu thụ khi sạc.",
    intro:
      "Con số watt trên quảng cáo thường là công suất đỉnh, không phải mức duy trì trong toàn bộ phiên sạc. Thời gian nạp và nhiệt độ mới cho biết trải nghiệm đầy đủ.",
    outcomes: [
      "Phân biệt công suất đỉnh với đường cong sạc.",
      "Kiểm tra tương thích củ sạc, cáp và giao thức.",
      "Đánh giá tốc độ cùng nhiệt và hiệu suất.",
    ],
    steps: [
      {
        title: "Xác định bộ sạc và cáp",
        detail:
          "Ghi rõ công suất, chuẩn USB Power Delivery hoặc giao thức riêng, khả năng của cáp và điện áp nguồn.",
      },
      {
        title: "Đo theo các mốc phần trăm",
        detail:
          "Ghi thời gian từ mức pin thấp đến 50%, 80% và 100%. Giai đoạn cuối thường giảm công suất để bảo vệ pin.",
      },
      {
        title: "Theo dõi nhiệt độ và công suất",
        detail:
          "Nhiệt độ phòng, việc sử dụng máy trong lúc sạc và ốp lưng có thể làm thay đổi đường cong sạc.",
      },
      {
        title: "Kiểm tra sạc thay thế",
        detail:
          "Thử củ sạc phổ biến để biết thiết bị có đạt tốc độ hợp lý khi không dùng phụ kiện chính hãng hay không.",
      },
    ],
    mistakes: [
      "Dùng watt đỉnh để suy ra thời gian sạc đầy.",
      "Bỏ qua giới hạn của cáp.",
      "So thời gian sạc từ các mức pin ban đầu khác nhau.",
    ],
    checklist: [
      "Đã ghi rõ củ sạc và cáp.",
      "Đã đo các mốc 50%, 80% và 100%.",
      "Đã theo dõi nhiệt độ.",
      "Đã thử bộ sạc USB-C thông dụng.",
      "Đã kiểm tra sạc không dây nếu cần.",
    ],
    takeaway:
      "Tốc độ sạc nên được đọc bằng đường cong thời gian, nhiệt độ và khả năng tương thích, không chỉ bằng công suất lớn nhất.",
    publishedAt: "2026-07-14T02:00:00.000Z",
    initialViews: 930,
  },
  {
    slug: "cham-soc-pin-dung-cach",
    title: "Chăm sóc pin đúng cách trong sử dụng hằng ngày",
    articleType: "tutorial",
    tags: ["pin-sac", "bao-tri", "dien-thoai", "laptop"],
    summary:
      "Những thói quen thực tế giúp giảm nhiệt, hạn chế pin ở trạng thái cực đoan và kéo dài tuổi thọ thiết bị.",
    intro:
      "Pin suy giảm tự nhiên theo thời gian. Mục tiêu hợp lý là giảm nhiệt và thời gian ở mức sạc cực cao hoặc cực thấp mà không làm việc sử dụng trở nên bất tiện.",
    outcomes: [
      "Nhận biết nhiệt là yếu tố gây hại quan trọng.",
      "Dùng giới hạn sạc khi lịch sử dụng cho phép.",
      "Biết cách lưu trữ thiết bị lâu ngày.",
    ],
    steps: [
      {
        title: "Giảm nhiệt khi sạc",
        detail:
          "Tránh chơi game nặng, phơi nắng hoặc đặt máy trên bề mặt giữ nhiệt trong lúc sạc. Tháo ốp nếu máy nóng bất thường.",
      },
      {
        title: "Dùng tính năng sạc thích ứng",
        detail:
          "Bật tối ưu sạc hoặc giới hạn phần trăm nếu thiết bị hỗ trợ. Không cần ám ảnh giữ pin trong một khoảng hẹp mỗi ngày.",
      },
      {
        title: "Tránh để pin cạn kéo dài",
        detail:
          "Sạc lại khi thuận tiện và không để thiết bị hết pin nhiều ngày. Khi lưu kho, giữ mức pin trung bình và tắt nguồn.",
      },
      {
        title: "Theo dõi dấu hiệu bất thường",
        detail:
          "Pin phồng, nóng khi không tải, tụt đột ngột hoặc tắt nguồn sớm cần được kiểm tra bởi nơi sửa chữa có chuyên môn.",
      },
    ],
    mistakes: [
      "Cố xả pin về 0% mỗi ngày để hiệu chỉnh.",
      "Dùng phụ kiện hư hỏng hoặc không rõ nguồn gốc.",
      "Tiếp tục dùng khi pin phồng.",
    ],
    checklist: [
      "Đã bật sạc thích ứng nếu có.",
      "Thiết bị không bị phủ kín khi sạc.",
      "Không chạy tải nặng khi máy quá nóng.",
      "Cáp và củ sạc ở tình trạng tốt.",
      "Biết nơi thay pin an toàn.",
    ],
    takeaway:
      "Thói quen đơn giản nhất là kiểm soát nhiệt và dùng tính năng bảo vệ pin có sẵn; không cần biến việc sạc thành một quy trình phức tạp.",
    publishedAt: "2026-07-15T02:00:00.000Z",
    initialViews: 1100,
  },
  {
    slug: "chon-dung-dung-luong-ram",
    title: "Chọn đúng dung lượng RAM cho điện thoại và laptop",
    articleType: "guide",
    tags: ["ram", "bo-nho", "laptop", "dien-thoai", "mua-sam"],
    summary:
      "Cách ước lượng RAM theo ứng dụng, đa nhiệm, hệ điều hành và khả năng nâng cấp thay vì chạy theo con số.",
    intro:
      "RAM thiếu gây tải lại ứng dụng và dùng bộ nhớ lưu trữ làm vùng hoán đổi; RAM dư quá nhiều thường không tăng tốc tác vụ. Mức phù hợp phụ thuộc phần mềm và vòng đời dự kiến.",
    outcomes: [
      "Ước lượng RAM từ khối lượng công việc.",
      "Phân biệt dung lượng với băng thông và độ trễ.",
      "Tính đến RAM hàn và khả năng nâng cấp.",
    ],
    steps: [
      {
        title: "Đo mức dùng hiện tại",
        detail:
          "Mở bộ ứng dụng thường dùng và quan sát mức RAM cao nhất. Tính thêm khoảng trống cho hệ điều hành, tác vụ nền và phiên bản phần mềm tương lai.",
      },
      {
        title: "Xem cấu hình kênh nhớ",
        detail:
          "Laptop có thể bị giảm băng thông nếu chỉ chạy một kênh. Với bộ nhớ hàn, kiểm tra cấu hình ngay từ lúc mua.",
      },
      {
        title: "Phân biệt RAM vật lý và mở rộng RAM",
        detail:
          "Tính năng dùng bộ nhớ lưu trữ làm RAM mở rộng chậm hơn RAM thật và không thay thế được dung lượng vật lý.",
      },
      {
        title: "Cân đối với CPU và tác vụ",
        detail:
          "Nhiều RAM không bù cho CPU hoặc GPU yếu. Dựng video, máy ảo và dữ liệu lớn cần đánh giá toàn bộ hệ thống.",
      },
    ],
    mistakes: [
      "Mua theo con số RAM lớn nhất trong tầm giá.",
      "Coi RAM mở rộng là RAM vật lý.",
      "Bỏ qua số khe và giới hạn nâng cấp.",
    ],
    checklist: [
      "Đã đo mức RAM khi dùng thật.",
      "Đã chừa khoảng trống cho tương lai.",
      "Đã kiểm tra số kênh nhớ.",
      "Đã kiểm tra RAM hàn hay tháo được.",
      "Dung lượng phù hợp với CPU và phần mềm.",
    ],
    takeaway:
      "Chọn đủ RAM cho phiên làm việc nặng nhất và vòng đời dự kiến; sau đó ưu tiên cấu hình kênh nhớ và khả năng nâng cấp.",
    publishedAt: "2026-07-16T02:00:00.000Z",
    initialViews: 1370,
  },
  {
    slug: "cach-chon-ssd-nvme",
    title: "Cách chọn SSD NVMe: không chỉ nhìn tốc độ đọc",
    articleType: "guide",
    tags: ["ssd", "luu-tru", "laptop", "pcie", "mua-sam"],
    summary:
      "Hướng dẫn đọc tốc độ tuần tự, ngẫu nhiên, độ bền, nhiệt độ, dung lượng và khả năng nâng cấp SSD.",
    intro:
      "Tốc độ đọc tuần tự lớn hữu ích khi chuyển tệp lớn, nhưng độ phản hồi hằng ngày còn liên quan đến truy cập ngẫu nhiên, bộ điều khiển, bộ nhớ đệm và trạng thái ổ.",
    outcomes: [
      "Phân biệt tốc độ tuần tự và ngẫu nhiên.",
      "Hiểu tác động của dung lượng trống và nhiệt độ.",
      "Kiểm tra đúng kích thước, chuẩn PCIe và khả năng nâng cấp.",
    ],
    steps: [
      {
        title: "Xác định loại tải lưu trữ",
        detail:
          "Tệp video lớn cần tốc độ tuần tự; hệ điều hành và nhiều tệp nhỏ cần độ trễ cùng IOPS; máy chủ hoặc ghi nhiều cần quan tâm độ bền.",
      },
      {
        title: "Kiểm tra chuẩn và kích thước",
        detail:
          "Xem khe M.2 hỗ trợ chiều dài nào, PCIe thế hệ nào và số lane. Ổ nhanh hơn chuẩn của máy vẫn chạy nhưng bị giới hạn.",
      },
      {
        title: "Xem hiệu năng khi ghi dài",
        detail:
          "Sau khi bộ nhớ đệm đầy, tốc độ có thể giảm mạnh. Bài đo ghi dài giúp đánh giá sao chép dự án lớn.",
      },
      {
        title: "Kiểm tra nhiệt và dung lượng",
        detail:
          "SSD có thể giảm tốc khi nóng. Chừa dung lượng trống và dùng tản nhiệt phù hợp nếu hệ thống cho phép.",
      },
    ],
    mistakes: [
      "Chọn SSD chỉ từ tốc độ đọc tối đa.",
      "Mua sai kích thước M.2 hoặc chuẩn không được hỗ trợ.",
      "Để ổ gần đầy rồi kỳ vọng hiệu năng như mới.",
    ],
    checklist: [
      "Đã xác định tải tuần tự hay ngẫu nhiên.",
      "Kích thước M.2 tương thích.",
      "Chuẩn PCIe tương thích.",
      "Đã xem tốc độ sau bộ nhớ đệm.",
      "Đã kiểm tra khe nâng cấp và tản nhiệt.",
    ],
    takeaway:
      "SSD phù hợp là ổ tương thích, đủ dung lượng và giữ được tốc độ trong tác vụ thật, không nhất thiết là ổ có con số đọc lớn nhất.",
    publishedAt: "2026-07-17T02:00:00.000Z",
    initialViews: 880,
  },
  {
    slug: "usb-c-thunderbolt-hdmi-khac-nhau",
    title: "USB-C, USB4, Thunderbolt và HDMI: cách kiểm tra cổng",
    articleType: "introduction",
    tags: ["cong-ket-noi", "usb-c", "thunderbolt", "hdmi", "laptop"],
    summary:
      "Giải thích vì sao hình dạng USB-C không nói lên tính năng và cách kiểm tra dữ liệu, sạc, màn hình ngoài.",
    intro:
      "USB-C là hình dạng đầu nối. Cùng một cổng có thể chỉ truyền dữ liệu cơ bản, hoặc đồng thời hỗ trợ sạc nhanh, màn hình và giao thức tốc độ cao.",
    outcomes: [
      "Phân biệt đầu nối với giao thức.",
      "Kiểm tra khả năng xuất màn hình và nhận sạc.",
      "Chọn cáp phù hợp với tốc độ và công suất.",
    ],
    steps: [
      {
        title: "Đọc tài liệu của đúng cổng",
        detail:
          "Laptop có nhiều cổng USB-C nhưng tính năng có thể khác nhau. Xem từng cổng hỗ trợ dữ liệu, DisplayPort, Power Delivery hay Thunderbolt.",
      },
      {
        title: "Xác định nhu cầu màn hình",
        detail:
          "Ghi số màn hình, độ phân giải, tần số quét và HDR. Băng thông thực tế còn phụ thuộc GPU, dock và cáp.",
      },
      {
        title: "Kiểm tra công suất sạc",
        detail:
          "Nguồn, thiết bị và cáp phải cùng hỗ trợ mức công suất. Một số laptop cần bộ sạc riêng để đạt hiệu năng tối đa.",
      },
      {
        title: "Chọn cáp có thông số rõ ràng",
        detail:
          "Cáp sạc công suất cao chưa chắc truyền dữ liệu nhanh hoặc xuất hình. Dùng cáp được ghi rõ tốc độ, công suất và khả năng hình ảnh.",
      },
    ],
    mistakes: [
      "Cho rằng mọi cổng USB-C đều giống nhau.",
      "Dùng cáp chỉ sạc cho dock tốc độ cao.",
      "Mua hub mà không kiểm tra băng thông chia sẻ.",
    ],
    checklist: [
      "Đã kiểm tra tính năng từng cổng.",
      "Đã xác định số màn hình và độ phân giải.",
      "Cáp hỗ trợ đúng tốc độ.",
      "Nguồn sạc đủ công suất.",
      "Dock tương thích với hệ điều hành.",
    ],
    takeaway:
      "Luôn kiểm tra cả cổng, giao thức, cáp và thiết bị ngoại vi như một chuỗi; mắt xích yếu nhất sẽ quyết định khả năng thực tế.",
    publishedAt: "2026-07-18T02:00:00.000Z",
    initialViews: 1190,
  },
  {
    slug: "danh-gia-nhiet-do-va-tieng-on-laptop",
    title: "Cách đánh giá nhiệt độ và tiếng ồn laptop",
    articleType: "tutorial",
    tags: ["laptop", "nhiet-do", "tieng-on", "tan-nhiet"],
    summary:
      "Quy trình kiểm tra nhiệt độ linh kiện, bề mặt, tiếng quạt và hiệu năng trong nhiều chế độ nguồn.",
    intro:
      "Nhiệt độ chip cao chưa đủ để kết luận laptop tản nhiệt kém. Cần xem hiệu năng duy trì, nhiệt ở vùng tay chạm, tiếng quạt và giới hạn công suất.",
    outcomes: [
      "Phân biệt nhiệt độ linh kiện với nhiệt độ bề mặt.",
      "Đo tiếng quạt trong điều kiện có ghi nhận tiếng nền.",
      "So các chế độ yên tĩnh, cân bằng và hiệu năng.",
    ],
    steps: [
      {
        title: "Đo trạng thái nhàn rỗi",
        detail:
          "Ghi nhiệt độ phòng, tiếng nền, nhiệt độ chip và tốc độ quạt sau khi máy ổn định.",
      },
      {
        title: "Chạy tải CPU và GPU",
        detail:
          "Dùng tác vụ riêng và tải kết hợp để xem hệ thống phân bổ công suất. Ghi điểm, công suất, nhiệt và tiếng quạt theo thời gian.",
      },
      {
        title: "Kiểm tra vùng tiếp xúc",
        detail:
          "Quan sát bàn phím, kê tay và đáy máy. Nhiệt độ bề mặt ảnh hưởng trực tiếp đến sự thoải mái.",
      },
      {
        title: "Thử nhiều chế độ",
        detail:
          "Chế độ yên tĩnh có thể đủ cho văn phòng; chế độ hiệu năng hữu ích khi cần tốc độ. So mức chênh hiệu năng với tiếng ồn tăng thêm.",
      },
    ],
    mistakes: [
      "So dB từ khoảng cách đo khác nhau.",
      "Kết luận chỉ từ nhiệt độ CPU.",
      "Không ghi nhiệt độ phòng và chế độ quạt.",
    ],
    checklist: [
      "Đã ghi nhiệt độ phòng.",
      "Đã đo trạng thái nhàn rỗi.",
      "Đã chạy tải CPU, GPU và tải kết hợp.",
      "Đã kiểm tra bàn phím và kê tay.",
      "Đã thử các chế độ nguồn.",
    ],
    takeaway:
      "Hệ thống tản nhiệt tốt là hệ thống duy trì đủ hiệu năng với nhiệt bề mặt và tiếng ồn chấp nhận được cho nhu cầu của bạn.",
    publishedAt: "2026-07-19T02:00:00.000Z",
    initialViews: 720,
  },
  {
    slug: "wifi-bluetooth-nfc-esim-uwb-la-gi",
    title: "Wi‑Fi, Bluetooth, NFC, eSIM và UWB dùng để làm gì?",
    articleType: "introduction",
    tags: ["ket-noi", "wifi", "bluetooth", "nfc", "esim", "uwb"],
    summary:
      "Bản đồ nhanh các chuẩn kết nối không dây và những yếu tố cần kiểm tra ngoài số phiên bản.",
    intro:
      "Phiên bản chuẩn chỉ cho biết khả năng lý thuyết. Tốc độ và tính năng thực tế còn phụ thuộc băng tần, số luồng, anten, khu vực và phần mềm.",
    outcomes: [
      "Wi‑Fi phục vụ mạng cục bộ và Internet tốc độ cao.",
      "Bluetooth kết nối phụ kiện công suất thấp.",
      "NFC, eSIM và UWB giải quyết các nhu cầu chuyên biệt.",
    ],
    steps: [
      {
        title: "Kiểm tra Wi‑Fi theo hạ tầng",
        detail:
          "Xem băng tần, độ rộng kênh, số luồng và router đang dùng. Chuẩn mới không giúp nhiều nếu router hoặc môi trường không hỗ trợ.",
      },
      {
        title: "Kiểm tra Bluetooth theo phụ kiện",
        detail:
          "Xem codec âm thanh, kết nối nhiều thiết bị, độ trễ và hồ sơ được hỗ trợ thay vì chỉ nhìn số phiên bản.",
      },
      {
        title: "Kiểm tra NFC và eSIM theo khu vực",
        detail:
          "Thanh toán, thẻ giao thông và nhà mạng hỗ trợ phụ thuộc quốc gia. Xác nhận với dịch vụ bạn sẽ dùng.",
      },
      {
        title: "Xác định lợi ích của UWB",
        detail:
          "UWB hỗ trợ định vị khoảng cách và hướng chính xác cho khóa số hoặc thiết bị tìm đồ, nhưng cần hệ sinh thái tương thích.",
      },
    ],
    mistakes: [
      "Dùng số phiên bản để kết luận tốc độ thực.",
      "Bỏ qua băng tần hoặc nhà mạng theo khu vực.",
      "Cho rằng có UWB là mọi thiết bị tìm đồ đều tương thích.",
    ],
    checklist: [
      "Router hỗ trợ chuẩn Wi‑Fi cần dùng.",
      "Thiết bị có đúng băng tần và số luồng.",
      "Tai nghe hỗ trợ codec mong muốn.",
      "Nhà mạng hỗ trợ eSIM.",
      "Dịch vụ NFC hoặc UWB hoạt động tại khu vực.",
    ],
    takeaway:
      "Hãy kiểm tra chuẩn kết nối cùng hạ tầng và hệ sinh thái thực tế; tính năng chỉ hữu ích khi cả hai đầu đều tương thích.",
    publishedAt: "2026-07-20T02:00:00.000Z",
    initialViews: 1060,
  },
  {
    slug: "chon-tai-nghe-codec-anc-microphone",
    title: "Chọn tai nghe: codec, chống ồn và microphone",
    articleType: "guide",
    tags: ["am-thanh", "tai-nghe", "bluetooth", "anc", "microphone"],
    summary:
      "Quy trình chọn tai nghe dựa trên độ vừa vặn, chất âm, chống ồn, cuộc gọi, độ trễ và thời lượng pin.",
    intro:
      "Một codec cao cấp không thể bù cho tai nghe đeo không kín hoặc điều chỉnh âm kém. Độ vừa vặn và tình huống sử dụng nên được kiểm tra trước thông số.",
    outcomes: [
      "Ưu tiên độ vừa vặn và độ kín.",
      "Phân biệt chống ồn chủ động với cách âm thụ động.",
      "Kiểm tra codec, độ trễ và micro trong hệ sinh thái thực.",
    ],
    steps: [
      {
        title: "Thử độ vừa vặn",
        detail:
          "Đeo ít nhất 20 phút, thử nhiều cỡ nút tai và vận động nhẹ. Độ kín ảnh hưởng trực tiếp đến bass và chống ồn.",
      },
      {
        title: "Thử ANC trong nhiều loại tiếng",
        detail:
          "Tiếng động cơ đều, giọng nói và gió là ba tình huống khác nhau. Kiểm tra cả cảm giác áp lực và chế độ xuyên âm.",
      },
      {
        title: "Ghi âm cuộc gọi",
        detail:
          "Thử trong phòng yên tĩnh, ngoài đường và nơi có gió. Nghe lại trên thiết bị khác thay vì chỉ hỏi người ở đầu dây.",
      },
      {
        title: "Kiểm tra codec và độ trễ",
        detail:
          "Điện thoại và tai nghe phải cùng hỗ trợ codec. Với trò chơi hoặc nhạc cụ, thử độ trễ thực tế hoặc dùng kết nối có dây.",
      },
    ],
    mistakes: [
      "Chọn tai nghe chỉ vì codec.",
      "Thử ANC duy nhất trong cửa hàng yên tĩnh.",
      "Bỏ qua độ thoải mái sau thời gian dài.",
    ],
    checklist: [
      "Đeo thoải mái ít nhất 20 phút.",
      "Độ kín ổn định.",
      "ANC và xuyên âm phù hợp.",
      "Micro đủ rõ trong môi trường cần dùng.",
      "Thiết bị nguồn hỗ trợ codec mong muốn.",
    ],
    takeaway:
      "Tai nghe tốt phải phù hợp với tai và môi trường của bạn trước khi xét đến codec hoặc các tính năng cao cấp.",
    publishedAt: "2026-07-21T02:00:00.000Z",
    initialViews: 990,
  },
  {
    slug: "hieu-cam-bien-dong-ho-thong-minh",
    title: "Hiểu cảm biến trên đồng hồ thông minh",
    articleType: "introduction",
    tags: ["dong-ho", "wearable", "cam-bien", "suc-khoe", "gps"],
    summary:
      "Giải thích cảm biến nhịp tim, SpO₂, ECG, nhiệt độ, GPS và cách đọc dữ liệu sức khỏe có trách nhiệm.",
    intro:
      "Đồng hồ thông minh tạo ước tính từ cảm biến quang học, điện cực, chuyển động và thuật toán. Dữ liệu hữu ích để theo dõi xu hướng nhưng không thay thế chẩn đoán y tế.",
    outcomes: [
      "Biết cảm biến nào đo trực tiếp và chỉ số nào được ước tính.",
      "Cải thiện độ vừa vặn để có dữ liệu ổn định.",
      "Phân biệt theo dõi sức khỏe với thiết bị y tế.",
    ],
    steps: [
      {
        title: "Đeo đúng vị trí",
        detail:
          "Đeo vừa, cao hơn xương cổ tay một chút và giữ mặt cảm biến sạch. Dây quá lỏng làm tăng nhiễu chuyển động.",
      },
      {
        title: "Hiểu giới hạn từng phép đo",
        detail:
          "Nhịp tim quang học có thể sai khi vận động mạnh; SpO₂ phụ thuộc tư thế; ECG thường là một đạo trình và tính năng có thể bị giới hạn theo khu vực.",
      },
      {
        title: "Đọc xu hướng thay vì một điểm",
        detail:
          "So dữ liệu trong cùng điều kiện qua nhiều ngày. Một giá trị bất thường đơn lẻ cần được đo lại.",
      },
      {
        title: "Kiểm tra GPS và pin",
        detail:
          "Tần suất lấy mẫu, GPS đa băng tần và chế độ tiết kiệm điện ảnh hưởng độ chính xác tuyến đường lẫn thời lượng.",
      },
    ],
    mistakes: [
      "Dùng một số đo để tự chẩn đoán.",
      "Đeo quá lỏng khi tập luyện.",
      "So dữ liệu từ hai thiết bị khác thuật toán như phép đo tuyệt đối.",
    ],
    checklist: [
      "Đồng hồ vừa cổ tay.",
      "Mặt cảm biến sạch.",
      "Đã kiểm tra tính năng theo khu vực.",
      "Đọc xu hướng nhiều ngày.",
      "Biết khi nào cần thiết bị y tế hoặc chuyên gia.",
    ],
    takeaway:
      "Dùng đồng hồ để theo dõi xu hướng và hình thành thói quen; khi có dấu hiệu đáng lo, hãy xác nhận bằng thiết bị phù hợp và tư vấn chuyên môn.",
    publishedAt: "2026-07-22T02:00:00.000Z",
    initialViews: 780,
  },
  {
    slug: "cach-chon-may-tinh-bang",
    title: "Cách chọn máy tính bảng cho học tập và làm việc",
    articleType: "guide",
    tags: ["may-tinh-bang", "mua-sam", "but-cam-ung", "ban-phim"],
    summary:
      "Chọn kích thước, hệ điều hành, bút, bàn phím, ứng dụng và bộ nhớ máy tính bảng theo luồng công việc.",
    intro:
      "Máy tính bảng phù hợp khi phần mềm, phụ kiện và cách quản lý tệp khớp với công việc. Cấu hình mạnh không giúp nếu ứng dụng cần dùng không có hoặc bị giới hạn.",
    outcomes: [
      "Xác định máy tính bảng là thiết bị chính hay phụ.",
      "Kiểm tra ứng dụng và phụ kiện trước khi mua.",
      "Cân đối kích thước màn hình với tính di động.",
    ],
    steps: [
      {
        title: "Vẽ luồng công việc",
        detail:
          "Ghi các bước từ nhận tệp, chỉnh sửa, ghi chú, họp đến xuất và chia sẻ. Kiểm tra từng ứng dụng trên hệ điều hành mục tiêu.",
      },
      {
        title: "Chọn kích thước và tỉ lệ",
        detail:
          "Màn hình lớn phù hợp đa nhiệm nhưng nặng hơn. Tỉ lệ màn hình ảnh hưởng đọc tài liệu, xem video và chia đôi ứng dụng.",
      },
      {
        title: "Thử bút và bàn phím",
        detail:
          "Xem độ trễ, lực nhấn, sạc bút, bố cục phím, touchpad và độ vững khi đặt trên đùi. Tính cả giá phụ kiện.",
      },
      {
        title: "Kiểm tra lưu trữ và kết nối",
        detail:
          "Xem dung lượng, thẻ nhớ, USB-C, xuất màn hình, dữ liệu di động và khả năng dùng ổ ngoài.",
      },
    ],
    mistakes: [
      "Mua trước rồi mới kiểm tra ứng dụng.",
      "Không tính khối lượng và giá phụ kiện.",
      "Chọn dung lượng quá thấp khi không có khe thẻ.",
    ],
    checklist: [
      "Ứng dụng cần dùng có phiên bản phù hợp.",
      "Kích thước đủ thoải mái.",
      "Đã thử bút và bàn phím.",
      "Đã cộng giá toàn bộ phụ kiện.",
      "Kết nối và lưu trữ đáp ứng luồng công việc.",
    ],
    takeaway:
      "Hãy mua cả một hệ thống gồm máy, ứng dụng và phụ kiện, không chỉ mua riêng phần cứng máy tính bảng.",
    publishedAt: "2026-07-23T02:00:00.000Z",
    initialViews: 1130,
  },
  {
    slug: "cach-chon-tv-theo-khong-gian",
    title: "Cách chọn TV theo không gian và nội dung",
    articleType: "guide",
    tags: ["tv", "man-hinh", "hdr", "gaming", "mua-sam"],
    summary:
      "Quy trình chọn kích thước, tấm nền, độ sáng, HDR, cổng HDMI và độ trễ TV theo phòng sử dụng.",
    intro:
      "TV cần được chọn theo khoảng cách xem, ánh sáng phòng, nội dung và hệ thống âm thanh. Một mẫu xuất sắc trong phòng tối chưa chắc phù hợp phòng khách nhiều cửa sổ.",
    outcomes: [
      "Chọn kích thước theo khoảng cách và góc nhìn.",
      "Cân đối màu đen, độ sáng và phản chiếu.",
      "Kiểm tra HDMI, VRR và độ trễ cho trò chơi.",
    ],
    steps: [
      {
        title: "Đo phòng và vị trí ngồi",
        detail:
          "Ghi khoảng cách, chiều cao mắt, vị trí cửa sổ và giới hạn kệ hoặc tường. Dùng kích thước đường chéo như điểm bắt đầu, không phải quy tắc cứng.",
      },
      {
        title: "Chọn công nghệ theo ánh sáng",
        detail:
          "Phòng tối ưu tiên màu đen và kiểm soát vùng sáng; phòng sáng cần độ sáng SDR, xử lý phản chiếu và góc nhìn phù hợp.",
      },
      {
        title: "Kiểm tra nội dung HDR",
        detail:
          "Xem độ sáng, độ tương phản, tone mapping và định dạng HDR mà nguồn phát hỗ trợ. Không chỉ nhìn nhãn chứng nhận.",
      },
      {
        title: "Kiểm tra trò chơi và âm thanh",
        detail:
          "Xem số cổng HDMI băng thông cao, VRR, độ trễ, eARC và khả năng đặt soundbar mà không che màn hình.",
      },
    ],
    mistakes: [
      "Chọn TV chỉ từ hình ảnh trong cửa hàng.",
      "Bỏ qua phản chiếu của phòng.",
      "Không kiểm tra số cổng HDMI cần dùng cùng lúc.",
    ],
    checklist: [
      "Đã đo khoảng cách xem.",
      "Đã xác định mức sáng của phòng.",
      "Đã kiểm tra phản chiếu và góc nhìn.",
      "Đủ cổng HDMI cho thiết bị.",
      "Đã tính vị trí soundbar hoặc loa.",
    ],
    takeaway:
      "TV phù hợp là TV hoạt động tốt trong chính căn phòng, nội dung và hệ thống thiết bị của bạn.",
    publishedAt: "2026-07-24T02:00:00.000Z",
    initialViews: 960,
  },
  {
    slug: "cach-chon-may-choi-game-cam-tay",
    title: "Cách chọn máy chơi game cầm tay",
    articleType: "guide",
    tags: ["may-choi-game", "gaming", "pin-sac", "man-hinh", "mua-sam"],
    summary:
      "Đánh giá hiệu năng theo công suất, màn hình, pin, hệ điều hành, thư viện game và khả năng sửa chữa máy chơi game cầm tay.",
    intro:
      "Máy chơi game cầm tay phải cân bằng hiệu năng, điện năng, nhiệt, khối lượng và trải nghiệm điều khiển. FPS cao nhất không phải lúc nào cũng tạo trải nghiệm di động tốt nhất.",
    outcomes: [
      "So hiệu năng tại cùng mức công suất.",
      "Ước lượng pin theo trò chơi thực tế.",
      "Kiểm tra thư viện game, điều khiển và khả năng sửa chữa.",
    ],
    steps: [
      {
        title: "Chọn thư viện game trước",
        detail:
          "Kiểm tra hệ điều hành, cửa hàng, chống gian lận, game độc quyền và khả năng đồng bộ dữ liệu.",
      },
      {
        title: "So FPS cùng mức điện",
        detail:
          "Ghi độ phân giải, thiết lập đồ họa và công suất. Dùng giới hạn FPS hợp lý để cân bằng độ mượt và pin.",
      },
      {
        title: "Đánh giá tính cầm nắm",
        detail:
          "Thử khối lượng, vị trí nút, độ rung, nhiệt ở tay và độ ồn. Màn hình lớn có thể làm thiết bị nặng hơn.",
      },
      {
        title: "Kiểm tra lưu trữ và sửa chữa",
        detail:
          "Xem khe thẻ, SSD, khả năng thay joystick, pin, linh kiện và điều kiện bảo hành.",
      },
    ],
    mistakes: [
      "So FPS ở mức công suất khác nhau.",
      "Bỏ qua khả năng tương thích game.",
      "Chỉ xem dung lượng pin mà không xem mức điện khi chơi.",
    ],
    checklist: [
      "Game cần chơi tương thích.",
      "FPS được so ở cùng cấu hình.",
      "Thiết bị cầm thoải mái.",
      "Pin đủ cho phiên chơi.",
      "Lưu trữ và linh kiện có thể bảo trì.",
    ],
    takeaway:
      "Máy cầm tay tốt nhất là máy chạy được thư viện game của bạn ở mức hiệu năng, pin và khối lượng chấp nhận được.",
    publishedAt: "2026-07-25T02:00:00.000Z",
    initialViews: 840,
  },
  {
    slug: "cach-chon-may-doc-sach-dien-tu",
    title: "Cách chọn máy đọc sách điện tử",
    articleType: "guide",
    tags: ["may-doc-sach", "e-ink", "man-hinh", "mua-sam"],
    summary:
      "Chọn kích thước, mật độ điểm ảnh, đèn nền, định dạng sách, bút và hệ sinh thái máy đọc sách.",
    intro:
      "Màn hình E Ink dễ đọc trong nhiều giờ và tiết kiệm điện khi hiển thị tĩnh, nhưng tốc độ làm tươi và hệ sinh thái nội dung khác đáng kể so với máy tính bảng.",
    outcomes: [
      "Chọn kích thước theo sách chữ, PDF hoặc truyện tranh.",
      "Kiểm tra định dạng, cửa hàng và quản lý thư viện.",
      "Hiểu ánh sáng trước, màu E Ink và tốc độ làm tươi.",
    ],
    steps: [
      {
        title: "Xác định loại tài liệu",
        detail:
          "Sách chữ phù hợp màn hình nhỏ; PDF và tài liệu học cần màn hình lớn hơn; truyện tranh màu cần cân nhắc độ bão hòa và tốc độ.",
      },
      {
        title: "Kiểm tra màn hình và ánh sáng",
        detail:
          "Xem mật độ điểm ảnh, lớp phủ, độ tương phản, đèn trước điều chỉnh nhiệt màu và khả năng ghi chú.",
      },
      {
        title: "Kiểm tra hệ sinh thái",
        detail:
          "Xem cửa hàng sách, định dạng, DRM, từ điển, đồng bộ ghi chú và cách chép sách cá nhân.",
      },
      {
        title: "Thử thao tác dài",
        detail:
          "Đánh giá khối lượng, nút chuyển trang, độ trễ, bóng lưu và thời gian dùng pin với đèn ở mức thường dùng.",
      },
    ],
    mistakes: [
      "Dùng tốc độ của máy tính bảng làm kỳ vọng cho E Ink.",
      "Không kiểm tra định dạng và DRM.",
      "Chọn màn hình quá nhỏ cho PDF.",
    ],
    checklist: [
      "Kích thước phù hợp loại tài liệu.",
      "Định dạng sách được hỗ trợ.",
      "Đèn trước dễ chịu.",
      "Khối lượng phù hợp cầm lâu.",
      "Ghi chú và đồng bộ đáp ứng nhu cầu.",
    ],
    takeaway:
      "Bắt đầu từ loại tài liệu và hệ sinh thái sách, sau đó mới chọn kích thước, bút và các tính năng bổ sung.",
    publishedAt: "2026-07-26T02:00:00.000Z",
    initialViews: 670,
  },
  {
    slug: "checklist-mua-thiet-bi-da-qua-su-dung",
    title: "Checklist mua điện thoại hoặc laptop đã qua sử dụng",
    articleType: "tutorial",
    tags: ["mua-sam", "thiet-bi-cu", "bao-mat", "dien-thoai", "laptop"],
    summary:
      "Danh sách kiểm tra ngoại hình, tài khoản, pin, màn hình, cổng, kết nối và benchmark trước khi mua thiết bị cũ.",
    intro:
      "Thiết bị cũ có thể đem lại giá trị tốt nếu kiểm tra có hệ thống. Ưu tiên quyền sở hữu hợp lệ, khả năng đăng xuất tài khoản và tình trạng phần cứng trước hiệu năng.",
    outcomes: [
      "Phát hiện khóa tài khoản hoặc quản lý doanh nghiệp.",
      "Kiểm tra linh kiện quan trọng trong thời gian ngắn.",
      "Lưu bằng chứng về tình trạng và thỏa thuận.",
    ],
    steps: [
      {
        title: "Xác minh thiết bị và quyền sở hữu",
        detail:
          "Đối chiếu số sê-ri, hóa đơn nếu có, tình trạng bảo hành và khóa kích hoạt. Không nhận máy chưa đăng xuất tài khoản chủ cũ.",
      },
      {
        title: "Kiểm tra ngoại hình và linh kiện",
        detail:
          "Xem khung, bản lề, ốc, tem, màn hình, camera, loa, micro, bàn phím, cổng và dấu hiệu vào nước hoặc sửa chữa.",
      },
      {
        title: "Kiểm tra pin và tải ngắn",
        detail:
          "Xem số chu kỳ hoặc sức khỏe pin khi hệ thống cung cấp, thử sạc và chạy benchmark ngắn để phát hiện tắt nguồn, quá nhiệt hoặc lỗi đồ họa.",
      },
      {
        title: "Xóa dữ liệu và thiết lập lại",
        detail:
          "Thực hiện khôi phục cài đặt, kích hoạt bằng tài khoản của bạn, cập nhật hệ thống và đổi toàn bộ thông tin đăng nhập liên quan.",
      },
    ],
    mistakes: [
      "Chuyển tiền trước khi kiểm tra khóa tài khoản.",
      "Chỉ nhìn ngoại hình mà không thử cổng và kết nối.",
      "Dùng benchmark dài trên máy có dấu hiệu pin phồng hoặc quá nóng.",
    ],
    checklist: [
      "Thiết bị không còn tài khoản chủ cũ.",
      "Số sê-ri và cấu hình khớp.",
      "Màn hình, camera, loa, micro và cổng hoạt động.",
      "Pin không phồng và sạc ổn định.",
      "Đã khôi phục và kích hoạt bằng tài khoản mới.",
    ],
    takeaway:
      "Không có mức giá rẻ nào bù được thiết bị bị khóa hoặc không an toàn. Hãy kiểm tra quyền sở hữu trước, phần cứng sau và chỉ thanh toán khi đã thiết lập được máy.",
    publishedAt: "2026-07-27T02:00:00.000Z",
    initialViews: 1540,
  },
  {
    slug: "chinh-sach-cap-nhat-phan-mem-quan-trong-ra-sao",
    title: "Chính sách cập nhật phần mềm quan trọng ra sao?",
    articleType: "guide",
    tags: ["phan-mem", "bao-mat", "cap-nhat", "mua-sam"],
    summary:
      "Cách đánh giá thời gian hỗ trợ hệ điều hành, bản vá bảo mật, phạm vi tính năng và khả năng duy trì hiệu năng.",
    intro:
      "Số năm hỗ trợ chỉ là điểm bắt đầu. Tần suất bản vá, thời điểm bắt đầu tính, phạm vi khu vực và chất lượng bản cập nhật quyết định giá trị sử dụng lâu dài.",
    outcomes: [
      "Phân biệt nâng cấp hệ điều hành với bản vá bảo mật.",
      "Kiểm tra mốc bắt đầu và phạm vi chính sách.",
      "Tính cập nhật phần mềm vào tổng chi phí sở hữu.",
    ],
    steps: [
      {
        title: "Đọc cam kết chính thức",
        detail:
          "Xác định số phiên bản hệ điều hành, số năm bảo mật, mốc tính từ ngày ra mắt hay ngày mua và mẫu máy cụ thể được áp dụng.",
      },
      {
        title: "Kiểm tra lịch sử triển khai",
        detail:
          "Xem tốc độ phát hành, sự khác nhau giữa khu vực hoặc nhà mạng và cách hãng xử lý lỗi sau cập nhật.",
      },
      {
        title: "Kiểm tra phạm vi tính năng",
        detail:
          "Một số tính năng AI hoặc camera phụ thuộc phần cứng, ngôn ngữ, tài khoản hoặc dịch vụ đám mây nên không đến với mọi mẫu.",
      },
      {
        title: "Lập kế hoạch cuối vòng đời",
        detail:
          "Xác định thời điểm thiết bị ngừng nhận bản vá, khả năng cài hệ điều hành thay thế, giá trị bán lại và kế hoạch thay máy.",
      },
    ],
    mistakes: [
      "Chỉ đếm số năm mà không xem mốc bắt đầu.",
      "Coi cập nhật hệ điều hành và bảo mật là một.",
      "Mặc định mọi tính năng mới đều đến với thiết bị cũ.",
    ],
    checklist: [
      "Đã đọc chính sách của đúng mẫu.",
      "Biết mốc bắt đầu hỗ trợ.",
      "Biết tần suất bản vá.",
      "Đã kiểm tra giới hạn khu vực.",
      "Đã tính thời điểm kết thúc hỗ trợ.",
    ],
    takeaway:
      "Thiết bị được hỗ trợ đều và minh bạch thường giữ giá trị sử dụng tốt hơn, đặc biệt khi bạn dự định dùng trong nhiều năm.",
    publishedAt: "2026-07-27T04:00:00.000Z",
    initialViews: 1020,
  },
  {
    slug: "cach-doc-chuan-khang-nuoc-ip",
    title: "Cách đọc chuẩn kháng nước và bụi IP",
    articleType: "introduction",
    tags: ["do-ben", "ip-rating", "dien-thoai", "dong-ho"],
    summary:
      "Giải thích hai chữ số trong chuẩn IP, giới hạn của bài thử phòng thí nghiệm và cách sử dụng thiết bị an toàn hơn.",
    intro:
      "Chuẩn IP mô tả khả năng chống vật rắn và nước trong điều kiện thử xác định. Kháng nước không đồng nghĩa chống nước tuyệt đối hoặc áp dụng cho mọi loại chất lỏng.",
    outcomes: [
      "Đọc được hai chữ số trong mã IP.",
      "Hiểu áp lực, thời gian và loại nước trong bài thử.",
      "Biết vì sao khả năng kháng nước có thể giảm theo thời gian.",
    ],
    steps: [
      {
        title: "Tách hai phần của mã",
        detail:
          "Chữ số đầu liên quan vật rắn và bụi; chữ số sau liên quan nước. Ký tự X nghĩa là chưa công bố mức cho phần đó, không mặc định bằng 0.",
      },
      {
        title: "Đọc điều kiện của hãng",
        detail:
          "Xem độ sâu, thời gian, nước tĩnh hay tia nước và yêu cầu đóng kín cổng. Một số mức cao không tự động bao gồm mọi phép thử thấp hơn.",
      },
      {
        title: "Phân biệt nước ngọt với chất lỏng khác",
        detail:
          "Nước biển, hồ bơi, xà phòng và đồ uống có thể ăn mòn hoặc thay đổi sức căng bề mặt. Làm theo hướng dẫn vệ sinh của hãng.",
      },
      {
        title: "Kiểm tra điều kiện bảo hành",
        detail:
          "Khả năng kháng nước có thể giảm do va đập, sửa chữa hoặc lão hóa gioăng. Hư hỏng do chất lỏng thường có điều kiện bảo hành riêng.",
      },
    ],
    mistakes: [
      "Coi IP68 là giấy phép mang máy đi bơi.",
      "Sạc khi cổng còn ướt.",
      "Dùng nhiệt cao để làm khô thiết bị.",
    ],
    checklist: [
      "Đã đọc điều kiện IP của đúng mẫu.",
      "Cổng và nắp đã đóng đúng.",
      "Không dùng trong nước ngoài phạm vi thử.",
      "Đã làm khô trước khi sạc.",
      "Đã kiểm tra điều kiện bảo hành.",
    ],
    takeaway:
      "Xem chuẩn IP như lớp bảo vệ cho sự cố, không phải lời đảm bảo cho mọi hoạt động dưới nước.",
    publishedAt: "2026-07-27T06:00:00.000Z",
    initialViews: 910,
  },
  {
    slug: "iphone-16-vs-galaxy-s25-flagship-nho-gon",
    title: "iPhone 16 và Galaxy S25: flagship nhỏ gọn nào hợp với bạn?",
    articleType: "comparison",
    tags: [
      "so-sanh-dien-thoai",
      "iphone-16",
      "galaxy-s25",
      "flagship",
      "mua-sam",
    ],
    summary:
      "So sánh iPhone 16 và Galaxy S25 theo màn hình, camera, pin, hệ sinh thái và trải nghiệm cầm nắm để chọn máy đúng nhu cầu.",
    coverImageUrl: "/images/devices/iphone-16.webp",
    publishedAt: "2026-07-27T08:00:00.000Z",
    initialViews: 1260,
    bodyMarkdown: `![iPhone 16 màu xanh](/images/devices/iphone-16.webp)

iPhone 16 và Galaxy S25 cùng nằm trong nhóm điện thoại cao cấp nhỏ gọn, cùng có giá mở bán quốc tế quanh 800 USD nhưng ưu tiên trải nghiệm rất khác nhau. iPhone 16 hướng tới sự đơn giản, video ổn định và khả năng kết nối với hệ sinh thái Apple. Galaxy S25 đặt trọng tâm vào màn hình 120 Hz, camera tele và khả năng tùy biến.

> **Kết luận nhanh:** chọn **iPhone 16** nếu bạn đang dùng Mac, iPad hoặc Apple Watch và ưu tiên quay video. Chọn **Galaxy S25** nếu màn hình mượt, camera zoom quang và khả năng tùy biến quan trọng hơn.

## Bảng so sánh nhanh

| Tiêu chí | iPhone 16 | Galaxy S25 |
|---|---|---|
| Màn hình | OLED 6,1 inch, 60 Hz | AMOLED 6,2 inch, 120 Hz |
| Độ sáng đỉnh công bố | 2.000 nit | 2.600 nit |
| Chip | Apple A18 | Snapdragon 8 Elite for Galaxy |
| Bộ nhớ tham chiếu | 8 GB / 128 GB | 12 GB / 256 GB |
| Khối lượng | 170 g | 162 g |
| Camera sau | Chính + siêu rộng | Chính + siêu rộng + tele 3x |
| Pin danh định | 3.561 mAh | 4.000 mAh |
| Sạc có dây tham chiếu | khoảng 27 W | 25 W |
| Sạc không dây | MagSafe đến 25 W | Qi không dây 15 W |
| Kháng bụi, nước | IP68 | IP68 |

*Dung lượng RAM không thể dùng để so trực tiếp hiệu quả quản lý bộ nhớ giữa iOS và Android. Giá, công suất sạc thực và tính năng phần mềm có thể khác theo thị trường.*

## Cầm nắm và màn hình

Galaxy S25 nhẹ hơn 8 g, thân máy hẹp hơn một chút và có màn hình lớn hơn 0,1 inch. Khác biệt quan trọng nhất là **120 Hz**: thao tác cuộn, chuyển cảnh và game hỗ trợ tốc độ khung hình cao trông liền mạch hơn rõ rệt.

iPhone 16 vẫn dùng 60 Hz. Màn hình có màu sắc tốt và độ sáng cao, nhưng người đã quen 90–120 Hz sẽ nhận ra khác biệt ngay. Đổi lại, tỷ lệ màn hình và kích thước gọn giúp máy dễ dùng bằng một tay.

### Nên thử gì tại cửa hàng?

1. Tắt video demo, mở một trang web dài và cuộn nhanh.
2. Gõ một đoạn văn bằng một tay để kiểm tra độ rộng bàn phím.
3. Đặt máy vào ốp tương đương; ốp có thể làm cảm giác cầm khác đáng kể.
4. Giảm độ sáng xuống mức bạn thường dùng để kiểm tra PWM và độ dễ chịu với mắt.

## Hiệu năng và phần mềm

Cả A18 lẫn Snapdragon 8 Elite đều dư sức cho ứng dụng thường ngày và game phổ biến. Thay vì chỉ nhìn điểm benchmark đỉnh, hãy xem thêm nhiệt độ và hiệu năng duy trì trong 20–30 phút nếu bạn chơi game nặng.

Khác biệt lớn hơn nằm ở hệ điều hành:

- **iOS:** phù hợp khi bạn dùng AirDrop, iCloud, iMessage, FaceTime, Apple Watch hoặc thường chuyển công việc giữa iPhone và Mac.
- **One UI trên Android:** linh hoạt hơn về màn hình chính, ứng dụng mặc định, đa nhiệm, chia sẻ tệp và các quy trình tự động.

Đừng chọn dựa trên số tính năng AI trong quảng cáo. Hãy kiểm tra tính năng đó có hỗ trợ tiếng Việt, có cần mạng, có giới hạn khu vực và có miễn phí lâu dài hay không.

![Samsung Galaxy S25 màu xanh navy](/images/devices/galaxy-s25.webp)

## Camera: tele hay video?

Galaxy S25 có camera tele quang học 3x, hữu ích khi chụp chân dung, sân khấu hoặc chi tiết ở xa. iPhone 16 không có camera tele riêng; mức zoom 2x chủ yếu dựa vào vùng trung tâm của cảm biến chính.

iPhone thường là lựa chọn dễ dự đoán hơn cho người quay video nhờ chuyển camera, phơi sáng và màu sắc ổn định. Galaxy S25 linh hoạt hơn khi chụp nhiều tiêu cự. Tuy vậy, chất lượng cuối cùng còn phụ thuộc ánh sáng và cách xử lý ảnh, vì vậy nên so ảnh gốc của cùng một cảnh thay vì ảnh đã qua mạng xã hội.

| Nhu cầu | Lựa chọn có lợi thế |
|---|---|
| Quay trẻ nhỏ, thú cưng, video mạng xã hội | iPhone 16 |
| Chụp chân dung và chủ thể ở xa | Galaxy S25 |
| Chụp góc rộng hằng ngày | Cả hai, nên xem màu ảnh mẫu |
| Chỉnh tay và tùy biến ứng dụng camera | Galaxy S25 |

## Pin và sạc

Không nên kết luận thời lượng pin chỉ từ 3.561 mAh và 4.000 mAh vì hai hệ điều hành, màn hình và chip quản lý điện khác nhau. Khi đọc bài thử pin, hãy chọn phép đo có cùng độ sáng, cùng kết nối và cùng chuỗi tác vụ.

iPhone 16 có lợi thế nếu bạn đã dùng phụ kiện MagSafe. Galaxy S25 dùng sạc USB-PD PPS phổ biến nhưng tốc độ có dây 25 W không phải điểm nổi bật trong phân khúc. Với cả hai máy, bộ sạc và cáp đúng chuẩn quan trọng hơn con số công suất in trên củ sạc.

## Chọn theo hồ sơ sử dụng

- **Chọn iPhone 16** nếu bạn đã ở trong hệ sinh thái Apple, thường quay video, muốn trải nghiệm ít phải tùy chỉnh và không nhạy cảm với màn hình 60 Hz.
- **Chọn Galaxy S25** nếu bạn muốn màn hình 120 Hz, thân máy nhẹ, camera tele, nhiều tùy biến và dung lượng lưu trữ khởi điểm rộng hơn.
- **Chưa nên chốt máy** nếu bạn cần pin hai ngày, zoom xa chuyên dụng hoặc chơi game nặng hàng giờ; hãy mở rộng so sánh sang các mẫu lớn hơn.

## Checklist trước khi mua

- [ ] Đã thử trực tiếp màn hình 60 Hz và 120 Hz.
- [ ] Đã kiểm tra giá của cùng dung lượng lưu trữ.
- [ ] Đã liệt kê đồng hồ, tai nghe và máy tính đang sử dụng.
- [ ] Đã xem ảnh gốc ở tiêu cự 1x, 2x và 3x.
- [ ] Đã kiểm tra chính sách bảo hành và cập nhật tại Việt Nam.
- [ ] Đã tính thêm chi phí ốp, sạc và dịch vụ đám mây.

Không có người thắng tuyệt đối. Với hai mẫu này, quyết định hợp lý nhất thường đến từ **màn hình 120 Hz và camera tele của Galaxy S25** đối đầu với **hệ sinh thái và trải nghiệm video của iPhone 16**.`,
  },
  {
    slug: "galaxy-a55-vs-galaxy-a35-co-nen-tra-them",
    title: "Galaxy A55 và Galaxy A35: có đáng trả thêm cho A55?",
    articleType: "comparison",
    tags: [
      "so-sanh-dien-thoai",
      "galaxy-a55",
      "galaxy-a35",
      "tam-trung",
      "mua-sam",
    ],
    summary:
      "Phân tích điểm giống, khác giữa Galaxy A55 5G và Galaxy A35 5G để biết khi nào nên tiết kiệm và khi nào đáng nâng cấp.",
    coverImageUrl: "/images/devices/galaxy-a55-5g.webp",
    publishedAt: "2026-07-27T09:00:00.000Z",
    initialViews: 1080,
    bodyMarkdown: `![Samsung Galaxy A55 5G](/images/devices/galaxy-a55-5g.webp)

Galaxy A55 5G và Galaxy A35 5G có ngoại hình, màn hình và pin rất gần nhau. Khoản chênh lệch của A55 chủ yếu mua thêm khung kim loại, chip nhanh hơn và camera siêu rộng tốt hơn — không phải một trải nghiệm hoàn toàn khác.

> **Kết luận nhanh:** Galaxy A35 là lựa chọn giá trị nếu nhu cầu chính là mạng xã hội, xem video và liên lạc. Galaxy A55 đáng nâng cấp khi bạn chơi game thường xuyên, giữ máy lâu hoặc coi trọng hoàn thiện và camera phụ.

## Hai máy giống nhau ở đâu?

| Hạng mục | Galaxy A55 5G | Galaxy A35 5G |
|---|---|---|
| Màn hình | AMOLED 6,6 inch, 120 Hz | AMOLED 6,6 inch, 120 Hz |
| Độ phân giải | 1.080 × 2.340 | 1.080 × 2.340 |
| Pin | 5.000 mAh | 5.000 mAh |
| Sạc có dây | 25 W | 25 W |
| Kháng bụi, nước | IP67 | IP67 |
| Mở rộng lưu trữ | microSD | microSD |
| Khối lượng | 213 g | 209 g |

Vì nền tảng trải nghiệm giống nhau, người dùng cơ bản khó thấy A55 “nhanh gấp bội”. Cả hai đều cho màn hình 120 Hz, loa stereo, pin lớn và khả năng chống nước ở mức IP67.

## A55 hơn ở những điểm nào?

### Hiệu năng duy trì

Exynos 1480 trên A55 mạnh hơn Exynos 1380 của A35, đặc biệt ở GPU. Lợi thế rõ hơn trong game, chỉnh ảnh, xuất video hoặc khi bạn muốn dùng máy trong nhiều năm. Với nhắn tin, bản đồ và video, khác biệt ít rõ hơn.

### Vật liệu và cảm giác cầm

A55 dùng khung nhôm, trong khi A35 dùng khung nhựa. Kim loại tạo cảm giác chắc và cao cấp hơn nhưng cũng góp phần làm A55 nặng hơn. Khi lắp ốp dày, khác biệt về vật liệu có thể trở nên ít quan trọng.

### Camera phụ

Hai máy đều có camera chính 50 MP, nhưng A55 có camera siêu rộng độ phân giải cao hơn. Nếu thường chụp kiến trúc, nhóm đông người hoặc phong cảnh, đây là nâng cấp có ý nghĩa. Camera macro không nên là lý do chính để chọn máy.

![Samsung Galaxy A35 5G](/images/devices/galaxy-a35-5g.webp)

## Khi nào A35 là món hời hơn?

A35 hợp lý hơn khi:

- Chênh lệch giá thực tế lớn hơn chi phí của một bộ sạc, ốp tốt và thẻ nhớ cộng lại.
- Bạn chủ yếu dùng ứng dụng liên lạc, ngân hàng, bản đồ, xem phim và chụp ảnh ban ngày.
- Máy luôn nằm trong ốp nên khung kim loại không mang nhiều giá trị.
- Bạn không chơi game nặng hoặc không cần camera siêu rộng tốt hơn.

Hãy so **giá thực trả của cùng cấu hình RAM và lưu trữ**, không so giá niêm yết của A55 128 GB với A35 256 GB.

## Khi nào nên trả thêm cho A55?

A55 thuyết phục hơn khi:

- Bạn giữ điện thoại từ ba năm trở lên và muốn dư địa hiệu năng tốt hơn.
- Bạn chơi game nhiều hoặc dùng các ứng dụng chỉnh sửa ảnh, video.
- Cảm giác khung kim loại và độ hoàn thiện là tiêu chí quan trọng.
- Bạn dùng camera siêu rộng thường xuyên.
- Mức chênh giá sau khuyến mãi nhỏ.

## Bài thử 15 phút trước khi chốt

1. Mở cùng năm ứng dụng trên hai máy và chuyển qua lại.
2. Quay video vài phút, sau đó mở trình chỉnh sửa và xuất một đoạn ngắn.
3. Chụp cùng cảnh bằng camera 1x và siêu rộng.
4. Cầm máy bằng một tay trong năm phút để kiểm tra khối lượng và cạnh máy.
5. Xem giá của đúng dung lượng, thời hạn bảo hành và quà tặng có thật sự cần thiết.

## Checklist quyết định

- [ ] A35 đã đủ nhanh cho toàn bộ ứng dụng chính.
- [ ] Đã thử camera siêu rộng của cả hai.
- [ ] Đã cầm máy khi có ốp.
- [ ] Đã so cùng dung lượng lưu trữ.
- [ ] Đã tính giá sau khuyến mãi, không chỉ giá niêm yết.

Nếu A35 đáp ứng đủ và chênh lệch giá lớn, hãy tiết kiệm. Nếu mức chênh nhỏ, A55 là khoản đầu tư hợp lý cho hiệu năng dài hạn và hoàn thiện tốt hơn.`,
  },
  {
    slug: "iphone-16-pro-max-vs-galaxy-s25-ultra",
    title: "iPhone 16 Pro Max và Galaxy S25 Ultra: chọn hệ flagship nào?",
    articleType: "comparison",
    tags: [
      "so-sanh-dien-thoai",
      "iphone-16-pro-max",
      "galaxy-s25-ultra",
      "flagship",
      "camera",
    ],
    summary:
      "So sánh hai flagship màn hình lớn theo camera, bút S Pen, video, pin, sạc và hệ sinh thái thay vì chỉ nhìn điểm benchmark.",
    coverImageUrl: "/images/devices/galaxy-s25-ultra.webp",
    publishedAt: "2026-07-27T10:00:00.000Z",
    initialViews: 1740,
    bodyMarkdown: `![Galaxy S25 Ultra màu Titanium Silverblue](/images/devices/galaxy-s25-ultra.webp)

iPhone 16 Pro Max và Galaxy S25 Ultra đều là điện thoại đầu bảng màn hình 6,9 inch. Chúng đủ mạnh cho hầu hết nhu cầu, vì vậy lựa chọn thực tế nên xoay quanh camera, quy trình làm việc, hệ sinh thái và cảm giác cầm.

> **Tóm tắt:** iPhone 16 Pro Max hợp với người quay video, làm việc cùng Mac và muốn trải nghiệm nhất quán. Galaxy S25 Ultra hợp với người cần zoom linh hoạt, S Pen, đa nhiệm và sạc có dây nhanh hơn.

## Thông số nền tảng

| Tiêu chí | iPhone 16 Pro Max | Galaxy S25 Ultra |
|---|---|---|
| Màn hình | LTPO OLED 6,9 inch, 120 Hz | LTPO AMOLED 6,9 inch, 120 Hz |
| Độ phân giải | 1.320 × 2.868 | 1.440 × 3.120 |
| Chip | Apple A18 Pro | Snapdragon 8 Elite for Galaxy |
| Bản lưu trữ tham chiếu | 256 GB | 256 GB |
| Khối lượng | 227 g | 218 g |
| Camera chính | 48 MP | 200 MP |
| Zoom quang xa | 5x | 5x, kèm thêm tiêu cự tele |
| Pin danh định | 4.685 mAh | 5.000 mAh |
| Sạc có dây tham chiếu | khoảng 30 W | 45 W |
| Bút | Không | S Pen tích hợp |

Megapixel, mAh và watt không tự động quyết định người thắng. Chúng cần được đọc cùng kích thước cảm biến, thuật toán, hiệu suất chip và bài đo thực tế.

## Thiết kế: cùng lớn nhưng không giống nhau

Galaxy S25 Ultra nhẹ hơn 9 g và có S Pen nằm trong thân máy. iPhone có các góc bo tròn hơn; Galaxy vuông hơn và cung cấp diện tích viết lớn. Cả hai đều trở nên nặng đáng kể khi dùng ốp chống sốc.

Nếu thường đọc trên giường hoặc dùng một tay, hãy thử ít nhất 10 phút. Đừng chỉ cầm máy vài giây tại quầy: mỏi cổ tay là vấn đề xuất hiện theo thời gian.

## Camera ảnh và video

Galaxy S25 Ultra cung cấp nhiều lựa chọn tiêu cự hơn, phù hợp du lịch, sân khấu và chụp chủ thể ở xa. S Pen còn có ích khi chỉnh ảnh chính xác hoặc ghi chú lên ảnh chụp màn hình.

iPhone 16 Pro Max có lợi thế về một quy trình video liền mạch: quay, xem trước, chuyển tệp sang Mac và dựng trong các ứng dụng quen thuộc. Chế độ quay chuyên nghiệp chỉ hữu ích khi bạn có đủ dung lượng lưu trữ và biết kiểm soát phơi sáng, âm thanh.

### Đừng so camera bằng một ảnh duy nhất

Hãy chụp cùng năm tình huống:

1. Khuôn mặt ngược sáng.
2. Trẻ em hoặc thú cưng đang di chuyển.
3. Biển hiệu ban đêm.
4. Video đi bộ có chuyển giữa các ống kính.
5. Chủ thể ở mức zoom 5x và 10x.

Sau đó xem tệp gốc trên cùng một màn hình. Ảnh đăng qua mạng xã hội đã bị nén và có thể che mất khác biệt.

![iPhone 16 Pro Max màu titan](/images/devices/iphone-16-pro-max.webp)

## S Pen, đa nhiệm và hệ sinh thái

S Pen là khác biệt phần cứng mà iPhone không có đối thủ trực tiếp. Nó hữu ích cho ký tài liệu, ghi chú nhanh, chọn vùng màn hình và chỉnh sửa chính xác. Nếu không dùng bút sau tuần đầu, lợi thế này không nên ảnh hưởng quyết định.

iPhone tạo giá trị khi kết hợp với Mac, iPad, Apple Watch và AirPods. Galaxy linh hoạt hơn với cửa sổ nổi, chia đôi màn hình, tùy biến giao diện và kết nối với nhiều loại thiết bị.

| Hồ sơ người dùng | Máy phù hợp hơn |
|---|---|
| Quay video và dựng trên Mac | iPhone 16 Pro Max |
| Ghi chú, ký tài liệu bằng bút | Galaxy S25 Ultra |
| Chụp xa khi du lịch, sự kiện | Galaxy S25 Ultra |
| Đã dùng Apple Watch và iCloud | iPhone 16 Pro Max |
| Thích đa nhiệm, tùy biến sâu | Galaxy S25 Ultra |

## Pin, sạc và chi phí sở hữu

Galaxy có pin danh định lớn hơn và sạc có dây 45 W; iPhone có hệ phụ kiện MagSafe phong phú. Thời lượng pin thực vẫn phải đọc từ cùng một bài thử, vì độ sáng, tín hiệu mạng và ứng dụng nền có thể tạo chênh lệch lớn.

Ngoài giá máy, hãy cộng thêm:

- Dung lượng đám mây trong ba năm.
- Ốp, kính, bộ sạc và cáp phù hợp.
- Khả năng dùng lại đồng hồ, tai nghe và phụ kiện hiện có.
- Chi phí sửa màn hình, pin và bảo hành mở rộng.

## Kết luận

Chọn Galaxy S25 Ultra nếu bạn sẽ dùng **S Pen, zoom xa và đa nhiệm** hằng tuần. Chọn iPhone 16 Pro Max nếu **video và hệ sinh thái Apple** là trung tâm công việc. Nếu không cần các điểm khác biệt đó, một flagship nhỏ hơn hoặc đời trước có thể mang lại giá trị tốt hơn.`,
  },
  {
    slug: "10-cai-dat-can-lam-khi-mua-dien-thoai-moi",
    title: "10 cài đặt nên làm ngay khi mua điện thoại mới",
    articleType: "tutorial",
    tags: [
      "meo-dien-thoai",
      "bao-mat",
      "dien-thoai-moi",
      "sao-luu",
      "quyen-rieng-tu",
    ],
    summary:
      "Checklist thiết lập điện thoại mới an toàn: cập nhật, khóa màn hình, sao lưu, tìm thiết bị, quyền ứng dụng và liên hệ khẩn cấp.",
    coverImageUrl: "/images/devices/galaxy-s25.webp",
    publishedAt: "2026-07-27T11:00:00.000Z",
    initialViews: 1380,
    bodyMarkdown: `![Điện thoại Galaxy S25](/images/devices/galaxy-s25.webp)

Một chiếc điện thoại mới chỉ thực sự sẵn sàng khi dữ liệu có bản sao, tài khoản có lớp bảo vệ thứ hai và bạn biết cách tìm hoặc khóa máy từ xa. Mười bước dưới đây áp dụng cho cả iPhone lẫn Android; tên mục có thể khác tùy phiên bản hệ điều hành.

> Hãy hoàn tất các bước bảo mật **trước khi** cài ứng dụng ngân hàng, ví điện tử hoặc đăng nhập tài khoản công việc.

## 1. Cập nhật hệ điều hành và ứng dụng

Kết nối Wi-Fi tin cậy, cắm sạc và cài toàn bộ bản cập nhật. Khởi động lại, sau đó kiểm tra thêm một lần vì một số bản vá chỉ xuất hiện sau khi máy lên phiên bản trung gian.

Không nên khôi phục ứng dụng hàng loạt rồi mới cập nhật: quá trình đồng bộ nền có thể làm máy nóng và khiến việc chẩn đoán lỗi khó hơn.

## 2. Đặt mã khóa mạnh

Dùng mã ít nhất sáu chữ số hoặc mật khẩu chữ và số. Tránh ngày sinh, số điện thoại, dãy lặp và mẫu dễ đoán. Sinh trắc học giúp mở khóa tiện hơn nhưng **không thay thế mã dự phòng**.

Nếu thiết bị hỗ trợ, hãy bật yêu cầu xác thực ngay khi thay đổi mật khẩu tài khoản, tắt tính năng tìm máy hoặc truy cập mật khẩu đã lưu.

## 3. Bật xác thực hai bước cho tài khoản chính

Tài khoản Apple hoặc Google là chìa khóa tới ảnh, email, bản sao lưu và khả năng xóa máy. Ưu tiên khóa bảo mật hoặc ứng dụng tạo mã; SMS nên là phương án dự phòng.

Lưu mã khôi phục ở nơi tách khỏi điện thoại, chẳng hạn trình quản lý mật khẩu trên thiết bị khác hoặc bản in cất an toàn.

## 4. Bật tìm, khóa và xóa máy từ xa

Kích hoạt Find My hoặc Find My Device, cho phép lưu vị trí cuối và kiểm tra thiết bị đã xuất hiện trong trang quản lý tài khoản.

### Thử ngay, đừng chỉ bật

1. Mở trang tìm thiết bị từ máy tính khác.
2. Cho điện thoại phát âm thanh.
3. Xác nhận vị trí gần đúng và tên máy dễ nhận biết.
4. Đọc trước quy trình đánh dấu thất lạc, nhưng không bấm xóa máy.

## 5. Thiết lập sao lưu tự động

Chọn rõ những dữ liệu cần sao lưu: ảnh, danh bạ, tin nhắn, ghi chú, cấu hình ứng dụng và tệp xác thực. Kiểm tra dung lượng đám mây còn trống và thời điểm sao lưu gần nhất.

> Một nút “đã bật sao lưu” chưa phải bằng chứng. Hãy mở một ảnh hoặc liên hệ từ giao diện web hay thiết bị thứ hai để chắc dữ liệu khôi phục được.

## 6. Rà quyền riêng tư của ứng dụng

Chỉ cấp quyền khi tính năng cần dùng. Với vị trí, ảnh, micro và camera, ưu tiên:

- Chỉ khi dùng ứng dụng.
- Vị trí gần đúng nếu không cần tọa độ chính xác.
- Chỉ các ảnh đã chọn thay vì toàn bộ thư viện.
- Tắt quyền cho ứng dụng không còn dùng.

Không cần tắt mọi quyền; mục tiêu là giới hạn quyền theo đúng chức năng.

## 7. Ẩn nội dung nhạy cảm trên màn hình khóa

Ẩn mã OTP, nội dung tin nhắn và thông báo ngân hàng khi máy đang khóa. Vẫn có thể giữ biểu tượng hoặc tên ứng dụng để biết có thông báo mới.

Đồng thời tắt truy cập nhanh vào ví, trung tâm điều khiển hoặc trợ lý giọng nói từ màn hình khóa nếu mô hình đe dọa của bạn yêu cầu.

![iPhone 16](/images/devices/iphone-16.webp)

## 8. Thêm thông tin và liên hệ khẩn cấp

Điền nhóm máu, dị ứng, thuốc đang dùng và người cần gọi nếu phù hợp. Chỉ thêm dữ liệu bạn chấp nhận hiển thị khi máy khóa.

Thực hành phím tắt gọi khẩn cấp một lần bằng hướng dẫn trên màn hình, nhưng dừng trước bước thực hiện cuộc gọi.

## 9. Kiểm tra SIM, eSIM và mã PIN

Đặt mã PIN cho SIM nếu cần bảo vệ khỏi việc tháo SIM sang máy khác để nhận OTP. Ghi lại mã PUK từ nhà mạng ở nơi an toàn; nhập sai PIN nhiều lần có thể khóa SIM.

Với eSIM, lưu thông tin nhà mạng và hiểu quy trình chuyển sang máy thay thế trước khi xóa thiết bị cũ.

## 10. Tối ưu pin và màn hình theo thói quen

Bật độ sáng tự động, thời gian tắt màn hình hợp lý và chế độ sạc tối ưu. Không cần tắt 5G, tần số quét cao hay mọi ứng dụng nền ngay từ đầu. Hãy dùng máy vài ngày, mở thống kê pin rồi xử lý đúng ứng dụng tiêu hao bất thường.

## Checklist hoàn tất

- [ ] Hệ điều hành và ứng dụng đã cập nhật.
- [ ] Mã khóa mạnh và sinh trắc học hoạt động.
- [ ] Xác thực hai bước và mã khôi phục đã lưu.
- [ ] Đã thử phát âm thanh bằng tính năng tìm máy.
- [ ] Có ít nhất một bản sao lưu kiểm tra được.
- [ ] Quyền vị trí, ảnh, micro và camera đã rà soát.
- [ ] Nội dung nhạy cảm không hiện trên màn hình khóa.
- [ ] Liên hệ khẩn cấp đã thiết lập.
- [ ] Biết cách khôi phục SIM hoặc eSIM.
- [ ] Đã ghi lại ngày bắt đầu bảo hành và số sê-ri.

Sau checklist này, hãy dùng máy bình thường trong một tuần rồi kiểm tra lại pin, dung lượng và quyền ứng dụng. Cấu hình tốt là cấu hình theo thói quen thật, không phải danh sách dài các tính năng bị tắt.`,
  },
  {
    slug: "12-meo-keo-dai-pin-dien-thoai-khong-can-tat-het-tinh-nang",
    title: "12 mẹo kéo dài pin điện thoại mà không phải tắt hết tính năng",
    articleType: "guide",
    tags: ["meo-dien-thoai", "pin", "sac-pin", "iphone", "android"],
    summary:
      "Tối ưu thời lượng và tuổi thọ pin bằng cách xử lý màn hình, tín hiệu yếu, ứng dụng nền, nhiệt độ và thói quen sạc.",
    coverImageUrl: "/images/devices/iphone-16-plus.webp",
    publishedAt: "2026-07-27T12:00:00.000Z",
    initialViews: 1920,
    bodyMarkdown: `![iPhone 16 Plus](/images/devices/iphone-16-plus.webp)

Cách tiết kiệm pin hiệu quả không phải là tắt mọi tính năng cao cấp. Hãy tìm đúng nguyên nhân tiêu hao, ưu tiên thay đổi ít ảnh hưởng trải nghiệm và đo lại sau vài ngày.

## Trước hết: phân biệt hai mục tiêu

| Mục tiêu | Cách đánh giá |
|---|---|
| Dùng lâu hơn trong một lần sạc | Thời gian bật màn hình, mức hao qua đêm, pin còn lại cuối ngày |
| Giữ pin bền trong nhiều năm | Dung lượng tối đa, số chu kỳ, nhiệt độ khi sạc và tốc độ suy giảm |

Một cài đặt có thể giúp thời lượng trong ngày nhưng không thay đổi đáng kể tuổi thọ hóa học. Nhiệt độ cao mới là yếu tố cần tránh nhất cho cả hai.

## 1. Xem thống kê trước khi chỉnh

Mở mục pin và chọn chu kỳ 24 giờ hoặc 7–10 ngày. Tách ba trường hợp:

- **Màn hình dùng nhiều:** ưu tiên độ sáng và thời gian tự khóa.
- **Ứng dụng chạy nền:** kiểm tra quyền nền, định vị và đồng bộ.
- **Hao khi không dùng:** kiểm tra sóng yếu, đồng bộ lỗi hoặc ứng dụng bị treo.

Chụp màn hình số liệu ban đầu để so lại sau ba ngày.

## 2. Giảm độ sáng, không cần giảm chất lượng màn hình

Bật độ sáng tự động và hạ một chút so với mức mặc định. Chế độ tối giúp tiết kiệm trên OLED trong giao diện có nhiều vùng đen, nhưng lợi ích phụ thuộc độ sáng và nội dung.

## 3. Rút ngắn thời gian tự khóa

Màn hình sáng quên trong vài phút có thể tốn nhiều hơn hàng loạt tinh chỉnh nhỏ. Chọn 30 giây hoặc một phút nếu phù hợp và bật chống chạm nhầm trong túi.

## 4. Xử lý vùng sóng yếu

Điện thoại tăng công suất để giữ kết nối khi tín hiệu kém. Ở tầng hầm, thang máy hoặc chuyến tàu dài, Wi-Fi Calling hay chế độ máy bay khi không cần liên lạc có thể hiệu quả hơn việc tắt từng ứng dụng.

## 5. Giới hạn vị trí chính xác

Ứng dụng thời tiết thường chỉ cần vị trí gần đúng; ứng dụng bản đồ cần chính xác khi dẫn đường. Chuyển quyền “luôn luôn” thành “khi sử dụng” cho ứng dụng không cần theo dõi nền.

## 6. Tắt làm mới nền có chọn lọc

Giữ nền cho nhắn tin, gọi xe, nhà thông minh hoặc ứng dụng công việc cần thông báo tức thời. Tắt với cửa hàng, game và ứng dụng ít dùng. Tắt toàn bộ có thể khiến bạn phải chờ đồng bộ mỗi lần mở.

## 7. Kiểm soát thông báo gây bật màn hình

Tắt nhóm thông báo quảng cáo và khuyến mãi. Gộp thông báo không khẩn cấp theo lịch giúp giảm số lần màn hình sáng và số lần bạn mở máy.

## 8. Dùng tần số quét thích ứng

Nếu máy có chế độ thích ứng, hãy dùng nó trước khi khóa cố định 60 Hz. Hệ thống có thể giảm tần số khi nội dung tĩnh mà vẫn giữ chuyển động mượt khi cần.

## 9. Tải nội dung trước khi di chuyển

Bản đồ, playlist, podcast và phim tải qua Wi-Fi giúp giảm truyền dữ liệu khi sóng di động yếu. Hãy xóa nội dung ngoại tuyến cũ để tránh đầy bộ nhớ.

## 10. Tránh nhiệt trong lúc sạc

Không sạc dưới gối, trong xe nóng hoặc khi máy đang chơi game nặng. Nếu máy nóng bất thường:

1. Dừng tác vụ nặng.
2. Tháo ốp nếu nhà sản xuất cho phép.
3. Đặt máy ở nơi thoáng, tránh quạt lạnh hoặc tủ lạnh gây ngưng tụ.
4. Chỉ sạc tiếp khi nhiệt độ trở lại bình thường.

## 11. Dùng sạc tối ưu theo lịch sinh hoạt

Tính năng sạc tối ưu hoặc giới hạn mức sạc hữu ích nếu máy thường cắm điện lâu. Không cần ám ảnh giữ pin trong một khoảng phần trăm tuyệt đối; hãy ưu tiên đủ pin cho ngày sử dụng và tránh nhiệt.

## 12. Cập nhật và khởi động lại khi có dấu hiệu bất thường

Nếu pin tụt nhanh sau cập nhật, cho máy một đến hai ngày hoàn tất lập chỉ mục. Sau đó khởi động lại, cập nhật ứng dụng và kiểm tra lại thống kê. Đừng khôi phục cài đặt gốc trước khi xác định ứng dụng hoặc dịch vụ gây lỗi.

## Những “mẹo” nên thận trọng

- Đóng cưỡng bức mọi ứng dụng liên tục có thể làm chúng tải lại nhiều hơn.
- Luôn tắt Bluetooth thường đem lại lợi ích nhỏ nhưng làm mất trải nghiệm đồng hồ, tai nghe.
- Ứng dụng “dọn RAM, làm mát pin” không thể thay đổi vật lý tản nhiệt và có thể chạy nền thêm.
- Dùng bộ sạc công suất lớn không ép máy nhận quá mức nếu thiết bị và sạc tuân thủ chuẩn; chất lượng và nhiệt độ quan trọng hơn nhãn watt.

## Checklist chẩn đoán nhanh

- [ ] Đã xem ứng dụng dùng pin trong bảy ngày.
- [ ] Đã kiểm tra hao pin qua đêm.
- [ ] Độ sáng tự động và tự khóa đang hoạt động.
- [ ] Ứng dụng không cần thiết không có vị trí nền.
- [ ] Máy không thường xuyên nóng khi sạc.
- [ ] Cáp và củ sạc có nguồn gốc rõ ràng.

Chỉ thay đổi một nhóm cài đặt mỗi lần và đo lại. Cách này giúp bạn biết điều gì thực sự hiệu quả, thay vì biến điện thoại mạnh thành một thiết bị luôn ở chế độ tiết kiệm.`,
  },
  {
    slug: "meo-chup-anh-dien-thoai-dep-hon-khong-can-app",
    title: "Chụp ảnh điện thoại đẹp hơn: 9 mẹo không cần cài thêm app",
    articleType: "tutorial",
    tags: ["meo-dien-thoai", "camera", "nhiep-anh", "pixel", "iphone"],
    summary:
      "Hướng dẫn chọn ống kính, khóa nét, bù sáng, xử lý chuyển động và chụp đêm để ảnh điện thoại rõ và tự nhiên hơn.",
    coverImageUrl: "/images/devices/pixel-9-pro.webp",
    publishedAt: "2026-07-27T13:00:00.000Z",
    initialViews: 1560,
    bodyMarkdown: `![Google Pixel 9 Pro](/images/devices/pixel-9-pro.webp)

Ảnh điện thoại đẹp thường đến từ ánh sáng, vị trí đứng và thời điểm bấm máy hơn là số megapixel. Trước khi tìm bộ lọc mới, hãy luyện chín thao tác có thể dùng với hầu hết ứng dụng camera mặc định.

## 1. Lau ống kính

Vết dầu nhỏ làm nguồn sáng bị lóe, ảnh mất tương phản và khuôn mặt trông mờ. Dùng khăn mềm sạch, lau cả camera chính, siêu rộng và tele. Đây là bước có tỷ lệ hiệu quả trên công sức cao nhất.

## 2. Chọn camera theo tình huống

| Tình huống | Camera nên thử trước | Lưu ý |
|---|---|---|
| Đời thường, thiếu sáng | Camera chính 1x | Thường có cảm biến và chống rung tốt nhất |
| Kiến trúc, nhóm đông | Siêu rộng | Giữ người tránh sát mép để giảm méo |
| Chân dung | Tele 2x–3x | Lùi xa để khuôn mặt tự nhiên hơn |
| Sân khấu, chủ thể xa | Tele quang | Cần đủ sáng và giữ máy chắc |
| Đồ vật nhỏ | Camera có AF gần | Không phải siêu rộng nào cũng lấy nét gần |

Đừng zoom số bằng cách kéo liên tục nếu có thể tiến gần hoặc đổi sang camera quang phù hợp.

## 3. Bật lưới và giữ đường chân trời

Đặt đường chân trời theo vạch ngang, chủ thể chính gần giao điểm một phần ba và kiểm tra các cột dọc ở mép ảnh. Quy tắc một phần ba là điểm khởi đầu, không phải luật bắt buộc.

## 4. Chạm để lấy nét rồi chỉnh sáng

Chạm vào khuôn mặt hoặc vật thể quan trọng. Sau đó kéo thanh phơi sáng xuống một chút nếu vùng sáng bị cháy. Ảnh hơi tối thường dễ cứu hơn vùng trời đã mất chi tiết.

Khóa nét/phơi sáng khi quay một cảnh dài hoặc khi chủ thể đứng yên nhưng hậu cảnh thay đổi độ sáng.

## 5. Tìm ánh sáng mềm

Đặt người gần cửa sổ, dưới mái hiên hoặc quay mặt về phía vùng trời sáng. Tránh ánh nắng trưa chiếu thẳng tạo bóng sâu dưới mắt. Khi ngược sáng, thử đổi góc hoặc dùng HDR thay vì tăng sáng toàn ảnh.

## 6. Chụp chuyển động bằng chuỗi ảnh

Với trẻ em, thú cưng và thể thao:

1. Dùng camera chính thay vì tele trong thiếu sáng.
2. Giữ nút chụp hoặc dùng chế độ liên tiếp nếu máy hỗ trợ.
3. Bấm sớm hơn khoảnh khắc dự đoán.
4. Chọn ảnh có mắt rõ và tư thế tự nhiên, rồi xóa phần còn lại.

## 7. Giữ máy chắc khi chụp đêm

Tựa khuỷu tay vào người, tựa máy lên bề mặt cố định và giữ thêm một nhịp sau khi bấm. Chế độ đêm ghép nhiều khung hình nên chủ thể chuyển động vẫn có thể mờ.

Không phải lúc nào chế độ đêm dài hơn cũng tốt hơn. Nếu có người di chuyển, hãy tìm thêm ánh sáng hoặc giảm thời gian phơi sáng.

![Xiaomi 14 Ultra với cụm camera lớn](/images/devices/xiaomi-14-ultra.webp)

## 8. Dùng chân dung có chủ đích

Kiểm tra mép tóc, kính và bàn tay — các vùng tách nền dễ lỗi. Giảm mức xóa phông nếu viền không tự nhiên. Với nhóm nhiều người, ảnh thường 1x có thể an toàn hơn chế độ chân dung.

## 9. Chỉnh nhẹ theo thứ tự

Một quy trình đơn giản:

1. Cắt và cân thẳng.
2. Giảm vùng sáng, nâng bóng tối vừa phải.
3. Chỉnh cân bằng trắng để da không quá xanh hoặc vàng.
4. Tăng tương phản, độ nét rất nhẹ.
5. So với bản gốc trước khi lưu.

Tránh tăng bão hòa và làm nét tới mức bầu trời loang màu hoặc da có viền.

## Bài tập 15 phút

Chọn một chủ thể và chụp sáu ảnh: 1x, siêu rộng, tele; mỗi tiêu cự chụp ở ngang mắt và thấp hơn. Không dùng bộ lọc. Sau đó chọn một ảnh và ghi lại **vì sao** ảnh đó tốt hơn: ánh sáng, nền, khoảnh khắc hay tiêu cự.

## Checklist trước khi bấm máy

- [ ] Ống kính sạch.
- [ ] Đường chân trời thẳng.
- [ ] Chủ thể không bị cắt ở khớp tay, chân.
- [ ] Vùng sáng quan trọng chưa cháy.
- [ ] Đã chọn camera quang phù hợp.
- [ ] Nền không có vật “mọc” khỏi đầu chủ thể.

Kỹ thuật tốt nhất là kỹ thuật bạn thực hiện kịp trước khi khoảnh khắc trôi qua. Hãy tập vài thao tác ổn định thay vì mở quá nhiều chế độ.`,
  },
  {
    slug: "don-dep-bo-nho-dien-thoai-an-toan",
    title: "Dọn bộ nhớ điện thoại an toàn mà không xóa nhầm dữ liệu",
    articleType: "guide",
    tags: ["meo-dien-thoai", "bo-nho", "sao-luu", "anh", "ung-dung"],
    summary:
      "Quy trình giải phóng dung lượng theo mức độ an toàn, từ tệp tải về và nội dung ngoại tuyến đến ảnh, video và dữ liệu ứng dụng.",
    coverImageUrl: "/images/devices/galaxy-a55-5g.webp",
    publishedAt: "2026-07-27T14:00:00.000Z",
    initialViews: 1320,
    bodyMarkdown: `![Samsung Galaxy A55 5G](/images/devices/galaxy-a55-5g.webp)

Khi bộ nhớ gần đầy, camera có thể không quay được, ứng dụng cập nhật thất bại và hệ thống thiếu chỗ cho tệp tạm. Quy tắc an toàn là **đo trước, sao lưu, xóa từ nhóm dễ khôi phục đến nhóm không thể thay thế**.

## Mục tiêu dung lượng trống

Không có một tỷ lệ bắt buộc cho mọi máy, nhưng nên giữ đủ chỗ cho bản cập nhật lớn, video mới và tệp tạm. Nếu máy liên tục dưới vài GB trống, hãy xử lý sớm thay vì chờ cảnh báo.

## Bước 1: xem nhóm nào đang chiếm chỗ

Mở phần quản lý dung lượng và ghi lại:

| Nhóm | Câu hỏi cần trả lời |
|---|---|
| Ảnh, video | Đã sao lưu và kiểm tra được chưa? |
| Ứng dụng | Có ứng dụng lớn nào không dùng 30–90 ngày? |
| Tin nhắn | Có video, tệp đính kèm hoặc nhóm chat quá lớn? |
| Nội dung ngoại tuyến | Phim, nhạc, podcast, bản đồ còn cần không? |
| Tệp tải về | Có bộ cài, PDF hoặc tệp nén đã dùng xong? |
| Hệ thống / Khác | Có tăng bất thường sau một ứng dụng cụ thể? |

Chụp màn hình trước và sau để biết bước nào mang lại hiệu quả.

## Bước 2: xác minh bản sao lưu

Đừng xóa ảnh chỉ vì ứng dụng báo “đã đồng bộ”. Hãy:

1. Mở dịch vụ ảnh từ trình duyệt hoặc thiết bị khác.
2. Kiểm tra vài ảnh và video mới nhất.
3. Tải thử một tệp về.
4. Xác nhận đúng tài khoản và thư viện.

Nếu ảnh quan trọng, nên có thêm một bản sao trên máy tính hoặc ổ lưu trữ tách biệt.

## Bước 3: xóa nội dung có thể tải lại

Ưu tiên phim, nhạc, podcast, bản đồ ngoại tuyến và tệp tải về cũ. Đây là nhóm ít rủi ro vì có thể tải lại khi cần.

Kiểm tra từng ứng dụng streaming; nút xóa ứng dụng không phải lúc nào cũng xóa nội dung tải nằm trong thư mục riêng.

## Bước 4: gỡ hoặc “offload” ứng dụng ít dùng

- **Gỡ hoàn toàn:** xóa ứng dụng và dữ liệu cục bộ.
- **Offload/lưu trữ ứng dụng:** xóa phần ứng dụng nhưng giữ tài liệu để cài lại.
- **Xóa cache:** xóa tệp tạm, có thể khiến ứng dụng tải lại.
- **Xóa dữ liệu:** có thể đăng xuất và xóa toàn bộ dữ liệu cục bộ.

Đọc kỹ nút bấm. “Xóa cache” và “xóa dữ liệu” không giống nhau.

## Bước 5: xử lý ảnh và video lớn

Video 4K, quay chậm và bản chỉnh sửa trùng thường chiếm nhiều nhất. Lọc theo dung lượng hoặc thời lượng, xử lý từng tháng và dọn thùng rác **chỉ sau khi** đã kiểm tra bản sao.

Giữ lại bản gốc nếu bạn còn chỉnh sửa. Tệp gửi qua mạng xã hội thường đã bị nén và không phải bản sao chất lượng đầy đủ.

## Bước 6: dọn tệp đính kèm trong ứng dụng chat

Mỗi ứng dụng nhắn tin có cơ chế sao lưu riêng. Xóa tệp trong thư viện có thể không xóa bản trong cuộc trò chuyện, và ngược lại.

Trước khi xóa:

- Kiểm tra lịch sử chat đã sao lưu.
- Lưu riêng giấy tờ, hóa đơn và ảnh không thể tải lại.
- Xóa video meme hoặc tệp chuyển tiếp theo dung lượng.
- Tắt tự động tải mọi phương tiện trong nhóm đông người.

## Không nên làm

- Không cài ứng dụng “dọn rác” không rõ nguồn gốc và cấp quyền toàn bộ ảnh, tệp.
- Không xóa thư mục hệ thống bằng trình quản lý tệp nếu không biết ứng dụng sở hữu.
- Không dọn thùng rác ngay lập tức khi chưa xác minh bản sao.
- Không khôi phục cài đặt gốc chỉ để giải phóng vài GB.

## Checklist an toàn

- [ ] Đã xem phân bổ dung lượng.
- [ ] Đã mở thử bản sao ảnh từ thiết bị khác.
- [ ] Đã xóa nội dung ngoại tuyến không cần.
- [ ] Đã xem kỹ cache khác dữ liệu ứng dụng.
- [ ] Đã lưu tài liệu quan trọng trong ứng dụng chat.
- [ ] Đã kiểm tra thùng rác trước khi xóa vĩnh viễn.

Lặp quy trình mỗi tháng sẽ nhẹ nhàng hơn một lần “đại phẫu”. Nếu mục Hệ thống/Khác tiếp tục tăng bất thường sau khi khởi động lại và cập nhật, hãy sao lưu rồi liên hệ hỗ trợ của hãng trước khi xóa dữ liệu.`,
  },
  {
    slug: "chuyen-du-lieu-sang-dien-thoai-moi-khong-bo-sot",
    title: "Chuyển dữ liệu sang điện thoại mới: checklist không bỏ sót",
    articleType: "tutorial",
    tags: [
      "meo-dien-thoai",
      "chuyen-du-lieu",
      "sao-luu",
      "bao-mat",
      "dien-thoai-moi",
    ],
    summary:
      "Quy trình chuyển ảnh, tin nhắn, ứng dụng, eSIM và mã xác thực sang máy mới, kiểm tra đầy đủ trước khi xóa máy cũ.",
    coverImageUrl: "/images/devices/pixel-9.webp",
    publishedAt: "2026-07-27T15:00:00.000Z",
    initialViews: 1190,
    bodyMarkdown: `![Google Pixel 9](/images/devices/pixel-9.webp)

Chuyển điện thoại không chỉ là sao chép ảnh và danh bạ. Những thứ dễ bị bỏ sót nhất thường là mã xác thực hai bước, lịch sử chat, eSIM, tệp tải về và ứng dụng ngân hàng. Hãy giữ máy cũ nguyên trạng cho tới khi hoàn tất kiểm tra.

> **Nguyên tắc vàng:** không đăng xuất, khôi phục cài đặt gốc hoặc giao máy cũ cho người khác trong ngày đầu tiên.

## Chuẩn bị trước khi chuyển

- Cập nhật hai máy và ứng dụng chuyển dữ liệu.
- Sạc cả hai trên 70% hoặc cắm nguồn.
- Kết nối Wi-Fi ổn định; chuẩn bị cáp đúng chuẩn nếu có.
- Kiểm tra dung lượng máy mới đủ chứa dữ liệu.
- Tạo bản sao lưu mới và ghi lại thời gian hoàn tất.
- Biết mật khẩu tài khoản Apple/Google, mã khóa máy và mã PIN SIM.

Nếu đổi giữa iPhone và Android, kiểm tra trước ứng dụng nào không có phiên bản tương ứng và dữ liệu nào chỉ nằm trong hệ sinh thái cũ.

## Nhóm dữ liệu cần kiểm kê

| Nhóm | Cách kiểm tra sau chuyển |
|---|---|
| Danh bạ, lịch | So tổng số mục và vài liên hệ mới nhất |
| Ảnh, video | Mở tệp mới nhất, cũ nhất và một video dài |
| Tin nhắn | Tìm một cuộc trò chuyện cũ có ảnh đính kèm |
| Ghi chú, tệp | Mở tệp ngoại tuyến quan trọng |
| Mật khẩu | Đăng nhập thử một dịch vụ ít rủi ro |
| Xác thực 2 bước | Tạo mã hoặc phê duyệt đăng nhập trên máy mới |
| Ứng dụng ngân hàng | Kích hoạt theo quy trình của từng ngân hàng |
| Đồng hồ, tai nghe | Ghép đôi và kiểm tra dữ liệu sức khỏe |
| SIM/eSIM | Gọi, nhận SMS và thử dữ liệu di động |

## Bước 1: dùng công cụ chuyển chính thức

Ưu tiên quy trình thiết lập ban đầu của nhà sản xuất. Kết nối bằng cáp thường nhanh và ổn định hơn với thư viện ảnh lớn. Giữ hai máy gần nhau, không mở game hoặc camera trong khi chuyển.

Đọc kỹ màn hình lựa chọn: một số công cụ chỉ chuyển ứng dụng tương ứng từ cửa hàng, không chuyển dữ liệu đăng nhập bên trong.

## Bước 2: xử lý ứng dụng xác thực

Đây là bước cần làm trước khi mất quyền truy cập máy cũ.

1. Mở từng ứng dụng tạo mã hoặc trình quản lý mật khẩu.
2. Dùng chức năng chuyển/xuất chính thức nếu có.
3. Đăng nhập thử một tài khoản trên thiết bị khác.
4. Lưu mã khôi phục ngoại tuyến.
5. Chỉ xóa khóa cũ sau khi khóa mới hoạt động.

Với tài khoản công việc, có thể cần quản trị viên cấp lại quyền. Hãy xử lý trong giờ hỗ trợ thay vì tối muộn hoặc trước chuyến đi.

## Bước 3: chuyển lịch sử chat theo từng ứng dụng

Lịch sử chat không phải lúc nào cũng nằm trong bản sao lưu hệ thống. Kiểm tra hướng dẫn bên trong WhatsApp, Zalo, Signal hoặc ứng dụng bạn dùng. Một số quy trình yêu cầu hai máy cùng số điện thoại, cùng Wi-Fi hoặc quét mã QR.

Không xóa ứng dụng trên máy cũ trước khi mở được tin nhắn và tệp đính kèm trên máy mới.

![iPhone 16](/images/devices/iphone-16.webp)

## Bước 4: chuyển SIM, eSIM và số điện thoại

Với SIM vật lý, tắt hai máy trước khi tháo nếu nhà sản xuất khuyến nghị. Với eSIM, dùng quy trình của nhà mạng; mã QR cũ có thể chỉ dùng một lần.

Sau khi chuyển, thử:

- Một cuộc gọi đi và đến.
- Một SMS thường, không chỉ ứng dụng chat.
- Dữ liệu di động khi đã tắt Wi-Fi.
- OTP của một dịch vụ ít rủi ro.

## Bước 5: kiểm tra máy mới theo ba vòng

### Vòng 1 — dữ liệu

So ảnh, danh bạ, lịch, ghi chú, tệp và tin nhắn.

### Vòng 2 — quyền truy cập

Kiểm tra email, mật khẩu, xác thực hai bước, ngân hàng, chữ ký số và tài khoản công việc.

### Vòng 3 — phần cứng kết nối

Ghép lại đồng hồ, tai nghe, xe hơi, thiết bị nhà thông minh; kiểm tra Bluetooth, NFC và thanh toán không tiếp xúc.

## Bao giờ mới nên xóa máy cũ?

Giữ máy cũ ít nhất vài ngày nếu có thể. Khi chắc chắn:

1. Sao lưu lần cuối những tệp phát sinh.
2. Đăng xuất tài khoản và tắt khóa kích hoạt theo hướng dẫn hãng.
3. Tháo SIM, thẻ nhớ và thiết bị tin cậy.
4. Khôi phục cài đặt gốc.
5. Khởi động tới màn hình chào mừng để xác nhận dữ liệu đã xóa.
6. Nếu bán hoặc tặng, ghi lại tình trạng bàn giao.

## Checklist cuối

- [ ] Ảnh, video, danh bạ, lịch và ghi chú đã kiểm tra.
- [ ] Mã xác thực hai bước hoạt động trên máy mới.
- [ ] Tin nhắn và tệp đính kèm quan trọng còn đủ.
- [ ] Gọi, SMS và dữ liệu di động hoạt động.
- [ ] Ứng dụng ngân hàng và công việc đã kích hoạt.
- [ ] Đồng hồ, tai nghe và xe hơi đã ghép lại.
- [ ] Máy cũ chưa bị xóa trước khi hoàn tất toàn bộ bước trên.

Một lần chuyển dữ liệu tốt cần thêm thời gian kiểm tra. Vài giờ giữ máy cũ nguyên trạng rẻ hơn nhiều so với việc khôi phục một tài khoản hoặc tệp không còn bản sao.`,
  },
];

export const WIKI_SEED_ARTICLES = articles.map((article) => ({
  ...article,
  bodyMarkdown: renderArticle(article),
}));
