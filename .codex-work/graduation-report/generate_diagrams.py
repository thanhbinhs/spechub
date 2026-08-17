from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_ITALIC = "/System/Library/Fonts/Supplemental/Arial Italic.ttf"

# Hệ màu đơn sắc theo phong cách sơ đồ học thuật của báo cáo mẫu.
# Các tên cũ được giữ để phần khai báo sơ đồ dễ đọc, nhưng toàn bộ đều
# ánh xạ về đen, trắng hoặc xám trung tính.
NAVY = "#000000"
BLUE = "#000000"
CYAN = "#FFFFFF"
PALE = "#F2F2F2"
GREEN = "#000000"
GREEN_PALE = "#FFFFFF"
ORANGE = "#000000"
ORANGE_PALE = "#FFFFFF"
RED = "#000000"
RED_PALE = "#FFFFFF"
PURPLE = "#000000"
PURPLE_PALE = "#FFFFFF"
GRAY = "#000000"
LIGHT = "#BFBFBF"
WHITE = "#FFFFFF"
INK = "#000000"


DIAGRAM_REPLACEMENTS = [
    ("Prisma schema", "Lược đồ Prisma"), ("Schema Zod", "Lược đồ Zod"),
    ("build/test/lint", "biên dịch / kiểm thử / kiểm tra mã"),
    ("pipeline", "quy trình"), ("controller", "bộ điều khiển"),
    ("endpoint", "điểm cuối API"), ("route", "tuyến"),
    ("Worker", "Tiến trình nền"), ("worker", "tiến trình nền"),
    ("Wishlist", "Danh sách yêu thích"), ("wishlist", "danh sách yêu thích"),
    ("notification", "thông báo"), ("delivery", "lần gửi"),
    ("alert", "cảnh báo"), ("session", "phiên đăng nhập"),
    ("access token", "mã truy cập"), ("refresh token", "mã làm mới"),
    ("refresh cookie", "cookie chứa mã làm mới"),
    ("raw page", "trang dữ liệu thô"), ("Candidate", "Dữ liệu đề xuất"),
    ("Review queue", "Hàng đợi kiểm duyệt"), ("audit", "nhật ký hoạt động"),
    ("Cache", "Bộ nhớ đệm"), ("cache", "bộ nhớ đệm"),
    ("Web service", "Dịch vụ web"), ("API service", "Dịch vụ API"),
    ("Static assets", "Tài nguyên tĩnh"), ("Health / metrics", "Trạng thái / chỉ số"),
    ("Jobs", "Tác vụ"), ("Payment", "Thanh toán"),
    ("Seed và migration", "Dữ liệu mẫu và di trú dữ liệu"),
    ("API key", "khóa API"), ("rate limiting", "giới hạn tần suất"),
    ("request ID", "mã định danh yêu cầu"), ("queue", "hàng đợi"),
    ("Catalog API", "API danh mục"), ("Catalog", "Danh mục dữ liệu"),
    ("Search/Vector", "Tìm kiếm/véc-tơ"),
    ("workspace", "không gian làm việc"),
]

TECHNICAL_LABEL_NORMALIZATION = [
    ("Lược đồ Prisma", "Prisma schema"),
    ("Lược đồ Zod", "Zod schema"),
    ("biên dịch / kiểm thử / kiểm tra mã", "build / test / lint"),
    ("bộ điều khiển", "controller"),
    ("điểm cuối API", "API endpoint"),
    ("tuyến", "route"),
    ("Tiến trình nền", "Worker"),
    ("tiến trình nền", "worker"),
    ("Bộ nhớ đệm", "Cache"),
    ("bộ nhớ đệm", "cache"),
    ("Phiên đăng nhập", "Session"),
    ("phiên đăng nhập", "session"),
    ("mã truy cập", "access token"),
    ("mã làm mới", "refresh token"),
    ("khóa API", "API key"),
    ("giới hạn tần suất", "rate limiting"),
    ("mã định danh yêu cầu", "request ID"),
    ("hàng đợi kiểm duyệt", "review queue"),
    ("nhật ký hoạt động", "audit log"),
    ("Dữ liệu mẫu và di trú dữ liệu", "Seed data và migration"),
    ("Tìm kiếm/véc-tơ", "Search/Vector"),
    ("không gian làm việc", "workspace"),
]


def academic_label(value: str) -> str:
    text = str(value)
    for source, target in TECHNICAL_LABEL_NORMALIZATION:
        text = text.replace(source, target)
    return text


def font(size: int, bold: bool = False, italic: bool = False):
    path = FONT_BOLD if bold else FONT_ITALIC if italic else FONT_REGULAR
    return ImageFont.truetype(path, size)


def canvas(title: str, subtitle: str = "", size=(2200, 1500)):
    im = Image.new("RGB", size, WHITE)
    d = ImageDraw.Draw(im)
    # Tiêu đề và mô tả được đặt ở caption của báo cáo, không lặp lại trong ảnh.
    return im, d


def text_box(d, xy, title, lines=(), fill=PALE, outline=BLUE, title_fill=None,
             title_size=27, body_size=23, radius=18, center=False):
    title = academic_label(title)
    x1, y1, x2, y2 = xy
    d.rectangle(xy, fill=WHITE if fill != PALE else PALE, outline=INK, width=3)
    if title_fill:
        d.rectangle((x1, y1, x2, min(y2, y1 + 58)), fill="#E6E6E6", outline=INK, width=2)
        title_color = INK
        ty = y1 + 13
    else:
        title_color = NAVY
        ty = y1 + 18
    tf = font(title_size, bold=True)
    if center:
        bb = d.textbbox((0, 0), title, font=tf)
        tx = x1 + (x2 - x1 - (bb[2] - bb[0])) / 2
    else:
        tx = x1 + 24
    d.text((tx, ty), title, font=tf, fill=title_color)
    y = y1 + (76 if title_fill else 66)
    for line in lines:
        line = academic_label(line)
        segments = wrap(line, width=max(18, int((x2 - x1) / (body_size * 0.55)))) or [""]
        for seg in segments:
            prefix = "• " if not seg.startswith(("→", "✓", "–")) else ""
            d.text((x1 + 25, y), prefix + seg, font=font(body_size), fill=INK)
            y += body_size + 11
        y += 3


def arrow(d, start, end, color=GRAY, width=5, label=None, label_offset=(0, -36)):
    color = INK
    d.line((*start, *end), fill=color, width=max(3, width - 1))
    x1, y1 = start
    x2, y2 = end
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 20
    for delta in (2.55, -2.55):
        p = (x2 + length * math.cos(angle + delta), y2 + length * math.sin(angle + delta))
        d.line((x2, y2, p[0], p[1]), fill=color, width=max(3, width - 1))
    if label:
        label = academic_label(label)
        mx = (x1 + x2) / 2 + label_offset[0]
        my = (y1 + y2) / 2 + label_offset[1]
        bb = d.textbbox((0, 0), label, font=font(20, bold=True))
        pad = 7
        d.rectangle((mx - pad, my - pad, mx + bb[2] - bb[0] + pad, my + bb[3] - bb[1] + pad), fill=WHITE)
        d.text((mx, my), label, font=font(20, bold=True), fill=color)


def actor(d, center, label, color=NAVY):
    label = academic_label(label)
    color = INK
    x, y = center
    d.ellipse((x - 25, y - 90, x + 25, y - 40), outline=color, width=5)
    d.line((x, y - 40, x, y + 55), fill=color, width=5)
    d.line((x - 55, y - 5, x + 55, y - 5), fill=color, width=5)
    d.line((x, y + 55, x - 48, y + 120), fill=color, width=5)
    d.line((x, y + 55, x + 48, y + 120), fill=color, width=5)
    f = font(24, bold=True)
    bb = d.textbbox((0, 0), label, font=f)
    d.text((x - (bb[2] - bb[0]) / 2, y + 138), label, font=f, fill=color)


def usecase(d, xy, label, fill=CYAN, outline=BLUE, size=23):
    label = academic_label(label)
    d.ellipse(xy, fill=WHITE, outline=INK, width=3)
    x1, y1, x2, y2 = xy
    max_chars = max(16, int((x2 - x1) / (size * .55)))
    lines = wrap(label, max_chars)
    y = (y1 + y2) / 2 - len(lines) * (size + 4) / 2
    for line in lines:
        f = font(size, bold=True)
        bb = d.textbbox((0, 0), line, font=f)
        d.text(((x1 + x2) / 2 - (bb[2] - bb[0]) / 2, y), line, font=f, fill=INK)
        y += size + 5


def save(im, name):
    path = OUT / name
    gray = ImageOps.grayscale(im)
    diff = ImageChops.difference(gray, Image.new("L", gray.size, 255))
    bbox = diff.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        pad = 38
        gray = gray.crop((max(0, left - pad), max(0, top - pad),
                          min(gray.width, right + pad), min(gray.height, bottom + pad)))
    gray.convert("RGB").save(path, optimize=True, dpi=(180, 180))
    print(path)


def generate_monochrome_assets():
    """Tạo bản đen–trắng của ảnh giao diện và logo mà không sửa ảnh gốc."""
    ui_src = ROOT / "assets" / "ui"
    ui_out = ROOT / "assets" / "ui-bw"
    ui_out.mkdir(parents=True, exist_ok=True)
    for source in sorted(ui_src.glob("*.png")):
        image = Image.open(source).convert("RGB")
        ImageOps.grayscale(image).convert("RGB").save(ui_out / source.name, optimize=True)

    logo_src = ROOT / "assets" / "phenikaa-logo.png"
    if logo_src.exists():
        logo = Image.open(logo_src).convert("RGBA")
        alpha = logo.getchannel("A")
        mono = ImageOps.grayscale(logo.convert("RGB"))
        # Tăng độ tương phản để logo rõ khi in đen–trắng.
        mono = ImageOps.autocontrast(mono, cutoff=1)
        rgba = Image.merge("RGBA", (mono, mono, mono, alpha))
        rgba.save(ROOT / "assets" / "phenikaa-logo-bw.png", optimize=True)


def diagram_context():
    im, d = canvas("Sơ đồ ngữ cảnh hệ thống Spechub", "Tác nhân bên ngoài và các năng lực cốt lõi")
    text_box(d, (650, 260, 1550, 1310), "NỀN TẢNG SPECHUB", [
        "Danh mục thiết bị, phần cứng và thông số chuẩn hóa",
        "Tìm kiếm, lọc, xem chi tiết và so sánh thiết bị",
        "Khuyến nghị theo nhu cầu và trợ lý AI có trích dẫn",
        "Wiki cộng tác, quy trình duyệt và lịch sử phiên bản",
        "Wishlist, theo dõi giá, cảnh báo và thông báo",
        "Quản trị dữ liệu, nguồn thu thập và chất lượng nội dung",
        "API B2B, giới hạn sử dụng và gói thuê bao",
    ], fill=PALE, outline=NAVY, title_fill=NAVY, title_size=34, body_size=28)
    actors = [
        ((270, 440), "Khách truy cập"),
        ((270, 940), "Người dùng"),
        ((1900, 420), "Biên tập viên"),
        ((1900, 760), "Quản trị viên"),
        ((1900, 1100), "Đối tác B2B"),
    ]
    for pos, label in actors:
        actor(d, pos, label)
    arrow(d, (380, 430), (640, 430), BLUE, label="Tra cứu")
    arrow(d, (380, 930), (640, 930), GREEN, label="Cá nhân hóa")
    arrow(d, (1810, 410), (1560, 410), PURPLE, label="Biên tập")
    arrow(d, (1810, 750), (1560, 750), RED, label="Quản trị")
    arrow(d, (1810, 1090), (1560, 1090), ORANGE, label="API")
    save(im, "01-context.png")


def diagram_architecture():
    im, d = canvas("Kiến trúc logic nhiều lớp", "Luồng truy cập từ trình duyệt đến dữ liệu và dịch vụ nền")
    layers = [
        ((160, 250, 2040, 420), "PRESENTATION LAYER — Next.js 15 / React 19", ["App Router • PWA • TanStack Query • Tailwind CSS • responsive UI"], CYAN, BLUE),
        ((160, 495, 2040, 690), "API LAYER — NestJS 11 / Fastify 5", ["REST /api/v1 • ValidationPipe • JWT / Roles • Swagger • rate limiting • request ID"], GREEN_PALE, GREEN),
        ((160, 765, 2040, 980), "DOMAIN / SERVICE LAYER", ["Catalog • Search/Compare • AI/RAG • Wiki • Alerts • Affiliate • Billing • B2B API"], PURPLE_PALE, PURPLE),
        ((160, 1055, 2040, 1320), "DATA & INFRASTRUCTURE LAYER", ["PostgreSQL 16 + pgvector", "Redis cache/session/queue", "Optional Meilisearch", "Worker và external services"], ORANGE_PALE, ORANGE),
    ]
    for xy, title, lines, fill, outline in layers:
        text_box(d, xy, title, lines, fill=fill, outline=outline, title_fill=outline, title_size=28, body_size=25, center=True)
    for y1, y2 in ((420, 495), (690, 765), (980, 1055)):
        arrow(d, (1100, y1 + 8), (1100, y2 - 8), NAVY, width=6, label="HTTPS / DTO" if y1 == 420 else "service call" if y1 == 690 else "Prisma Client", label_offset=(20, -18))
    save(im, "02-architecture.png")


def diagram_deployment():
    im, d = canvas("Mô hình triển khai tham chiếu", "Các tiến trình có thể đóng gói độc lập trong môi trường container")
    text_box(d, (90, 310, 500, 570), "Client device", ["Browser", "PWA cache", "HTTPS"], fill=CYAN, outline=BLUE, title_fill=BLUE)
    text_box(d, (680, 245, 1160, 520), "Web service", ["Next.js", "SSR/CSR", "Static assets"], fill=GREEN_PALE, outline=GREEN, title_fill=GREEN)
    text_box(d, (680, 690, 1160, 1030), "API service", ["NestJS + Fastify", "REST /api/v1", "Health / metrics"], fill=PURPLE_PALE, outline=PURPLE, title_fill=PURPLE)
    text_box(d, (680, 1130, 1160, 1360), "Worker", ["Scheduled jobs", "Price alerts", "Source synchronization"], fill=ORANGE_PALE, outline=ORANGE, title_fill=ORANGE)
    text_box(d, (1370, 230, 2070, 480), "PostgreSQL 16", ["Relational data", "pgvector • pg_trgm • unaccent"], fill=CYAN, outline=NAVY, title_fill=NAVY)
    text_box(d, (1370, 565, 2070, 805), "Redis", ["Session", "Cache", "Job coordination"], fill=RED_PALE, outline=RED, title_fill=RED)
    text_box(d, (1370, 890, 2070, 1130), "Search / AI / Payment", ["Optional Meilisearch", "LLM/Embedding", "Stripe và webhook"], fill=PALE, outline=GRAY, title_fill=GRAY)
    arrow(d, (505, 425), (675, 380), BLUE, label="HTTPS")
    arrow(d, (920, 525), (920, 680), PURPLE, label="REST")
    arrow(d, (1165, 810), (1365, 360), NAVY, label="Prisma")
    arrow(d, (1165, 835), (1365, 675), RED, label="Cache/session", label_offset=(-115, -52))
    arrow(d, (1165, 865), (1365, 1000), GRAY, label="SDK/HTTP")
    arrow(d, (1165, 1240), (1365, 740), ORANGE, label="Jobs", label_offset=(-115, 18))
    save(im, "03-deployment.png")


def diagram_usecase_public():
    im, d = canvas("Use case phía người dùng", "Các chức năng công khai và cá nhân hóa")
    actor(d, (220, 520), "Khách truy cập")
    actor(d, (220, 1060), "Người dùng")
    d.rectangle((520, 230, 2060, 1370), outline=INK, width=4)
    d.text((550, 250), "Biên hệ thống Spechub", font=font(28, bold=True), fill=NAVY)
    cases = [
        ((620, 340, 1120, 470), "Tìm kiếm và lọc thiết bị", CYAN, BLUE),
        ((1370, 340, 1910, 470), "Xem thông số và nguồn trích dẫn", CYAN, BLUE),
        ((620, 570, 1120, 700), "So sánh nhiều thiết bị", GREEN_PALE, GREEN),
        ((1370, 570, 1910, 700), "Nhận khuyến nghị theo nhu cầu", GREEN_PALE, GREEN),
        ((620, 800, 1120, 930), "Hỏi trợ lý AI có trích dẫn", PURPLE_PALE, PURPLE),
        ((1370, 800, 1910, 930), "Đọc và đóng góp Wiki", PURPLE_PALE, PURPLE),
        ((620, 1050, 1120, 1180), "Quản lý wishlist", ORANGE_PALE, ORANGE),
        ((1370, 1050, 1910, 1180), "Tạo cảnh báo giá và nhận thông báo", ORANGE_PALE, ORANGE),
    ]
    for xy, label, fill, outline in cases:
        usecase(d, xy, label, fill, outline)
    for end in [(620, 405), (1370, 405), (620, 635), (1370, 635), (620, 865), (1370, 865)]:
        d.line((330, 500, *end), fill=GRAY, width=3)
    for end in [(620, 1115), (1370, 1115), (1370, 865)]:
        d.line((330, 1040, *end), fill=ORANGE, width=3)
    save(im, "04-usecase-user.png")


def diagram_usecase_admin():
    im, d = canvas("Use case biên tập và quản trị", "Phân quyền theo vai trò Editor, Moderator và Admin")
    actor(d, (220, 440), "Biên tập viên", PURPLE)
    actor(d, (220, 930), "Kiểm duyệt viên", GREEN)
    actor(d, (1980, 690), "Quản trị viên", RED)
    d.rectangle((470, 230, 1740, 1370), outline=INK, width=4)
    d.text((500, 250), "Catalog Studio và quản trị Spechub", font=font(28, bold=True), fill=NAVY)
    cases = [
        ((590, 340, 1100, 470), "Soạn và cập nhật dữ liệu catalog", PURPLE_PALE, PURPLE),
        ((1170, 340, 1630, 470), "Quản lý nguồn thu thập", PURPLE_PALE, PURPLE),
        ((590, 580, 1100, 710), "Duyệt thay đổi và đối soát trích dẫn", GREEN_PALE, GREEN),
        ((1170, 580, 1630, 710), "Xuất bản phiên bản Wiki", GREEN_PALE, GREEN),
        ((590, 820, 1100, 950), "Quản lý người dùng và quyền", RED_PALE, RED),
        ((1170, 820, 1630, 950), "Theo dõi audit và webhook", RED_PALE, RED),
        ((590, 1060, 1100, 1190), "Quản lý gói thuê bao và API key", ORANGE_PALE, ORANGE),
        ((1170, 1060, 1630, 1190), "Theo dõi sức khỏe và chỉ số", ORANGE_PALE, ORANGE),
    ]
    for xy, label, fill, outline in cases:
        usecase(d, xy, label, fill, outline)
    for end in [(590, 405), (1170, 405), (590, 645)]:
        d.line((330, 430, *end), fill=PURPLE, width=3)
    for end in [(590, 645), (1170, 645)]:
        d.line((330, 920, *end), fill=GREEN, width=3)
    for end in [(1100, 885), (1630, 885), (1100, 1125), (1630, 1125)]:
        d.line((1870, 680, *end), fill=RED, width=3)
    save(im, "05-usecase-admin.png")


def sequence(title, subtitle, participants, messages, filename):
    im, d = canvas(title, subtitle, size=(2200, 1600))
    left, right = 150, 2050
    step = (right - left) / (len(participants) - 1)
    xs = [left + i * step for i in range(len(participants))]
    for x, (name, color) in zip(xs, participants):
        name = academic_label(name)
        d.rectangle((x - 145, 230, x + 145, 310), fill="#E6E6E6", outline=INK, width=3)
        f = font(23, bold=True)
        bb = d.textbbox((0, 0), name, font=f)
        d.text((x - (bb[2] - bb[0]) / 2, 255), name, font=f, fill=INK)
        # Lifeline UML dạng nét đứt.
        y = 310
        while y < 1500:
            d.line((x, y, x, min(y + 18, 1500)), fill=INK, width=2)
            y += 30
    y = 375
    for idx, (src, dst, label, color, dashed) in enumerate(messages, 1):
        label = academic_label(label)
        x1, x2 = xs[src], xs[dst]
        if dashed:
            seg = 18
            direction = 1 if x2 > x1 else -1
            xx = x1
            while (xx - x2) * direction < 0:
                nx = xx + direction * min(seg, abs(x2 - xx))
                d.line((xx, y, nx, y), fill=INK, width=3)
                xx = nx + direction * 10
        else:
            d.line((x1, y, x2, y), fill=INK, width=3)
        direction = 1 if x2 > x1 else -1
        d.polygon([(x2, y), (x2 - 18 * direction, y - 10), (x2 - 18 * direction, y + 10)], fill=INK)
        max_chars = max(22, int(abs(x2 - x1) / 15))
        lines = wrap(f"{idx}. {label}", max_chars)
        for j, line in enumerate(lines):
            d.text((min(x1, x2) + 14, y - 32 - (len(lines) - 1 - j) * 24), font=font(20), text=line, fill=INK)
        y += 105 + (len(lines) - 1) * 25
    save(im, filename)


def diagram_sequences():
    sequence(
        "Biểu đồ tuần tự đăng nhập và làm mới phiên",
        "Refresh token gắn với phiên Redis; logout thu hồi phiên",
        [("Người dùng", BLUE), ("Web", GREEN), ("Auth API", PURPLE), ("PostgreSQL", NAVY), ("Redis", RED)],
        [
            (0, 1, "Gửi email và mật khẩu qua HTTPS", BLUE, False),
            (1, 2, "POST /api/v1/auth/login", PURPLE, False),
            (2, 3, "Tìm người dùng và kiểm tra mật khẩu băm", NAVY, False),
            (3, 2, "Trả hồ sơ và vai trò", NAVY, True),
            (2, 4, "Tạo session UUID có thời hạn", RED, False),
            (2, 1, "Trả access token và đặt refresh cookie", PURPLE, True),
            (1, 2, "POST /auth/refresh khi access token hết hạn", PURPLE, False),
            (2, 4, "Xác minh session chưa bị thu hồi", RED, False),
            (2, 1, "Cấp access token mới", PURPLE, True),
        ], "06-sequence-auth.png")
    sequence(
        "Biểu đồ tuần tự trợ lý AI theo RAG",
        "Câu trả lời được ràng buộc bởi ngữ cảnh catalog và nguồn trích dẫn",
        [("Người dùng", BLUE), ("Web", GREEN), ("AI API", PURPLE), ("Search/Vector", ORANGE), ("Catalog", NAVY), ("LLM", RED)],
        [
            (0, 1, "Nhập câu hỏi hoặc yêu cầu khuyến nghị", BLUE, False),
            (1, 2, "POST /api/v1/ai/ask", PURPLE, False),
            (2, 3, "Chuẩn hóa truy vấn, tìm top-k ngữ cảnh", ORANGE, False),
            (3, 4, "Tải thông số, wiki và nguồn liên quan", NAVY, False),
            (4, 2, "Trả context đã lọc cùng citation ID", NAVY, True),
            (2, 5, "Tạo prompt có chính sách và ngữ cảnh", RED, False),
            (5, 2, "Trả lời có tham chiếu tới bằng chứng", RED, True),
            (2, 1, "Trả nội dung, trích dẫn và metadata", PURPLE, True),
            (1, 0, "Hiển thị câu trả lời và liên kết nguồn", BLUE, True),
        ], "07-sequence-ai-rag.png")
    sequence(
        "Biểu đồ tuần tự tìm kiếm và so sánh",
        "Một luồng đọc tối ưu cho khách truy cập không cần đăng nhập",
        [("Người dùng", BLUE), ("Web", GREEN), ("Catalog API", PURPLE), ("Search", ORANGE), ("PostgreSQL", NAVY)],
        [
            (0, 1, "Nhập từ khóa và bộ lọc", BLUE, False),
            (1, 2, "GET /search với tham số đã chuẩn hóa", PURPLE, False),
            (2, 3, "Tìm toàn văn hoặc Meilisearch", ORANGE, False),
            (3, 2, "Trả danh sách ID xếp hạng", ORANGE, True),
            (2, 4, "Tải model, variant và phần cứng", NAVY, False),
            (4, 2, "Trả kết quả phân trang", NAVY, True),
            (2, 1, "DTO tìm kiếm", PURPLE, True),
            (0, 1, "Chọn thiết bị để so sánh", BLUE, False),
            (1, 2, "GET /compare theo các slug", PURPLE, False),
            (2, 1, "Ma trận thuộc tính chuẩn hóa", PURPLE, True),
        ], "08-sequence-search-compare.png")


def flow(title, subtitle, nodes, edges, filename):
    im, d = canvas(title, subtitle, size=(2200, 1550))
    centers = {}
    for key, xy, label, fill, outline in nodes:
        label = academic_label(label)
        if key in {"match", "approve"}:
            x1, y1, x2, y2 = xy
            points = [((x1 + x2) / 2, y1), (x2, (y1 + y2) / 2),
                      ((x1 + x2) / 2, y2), (x1, (y1 + y2) / 2)]
            d.polygon(points, fill=WHITE, outline=INK)
            lines = wrap(label, width=28)
            ty = (y1 + y2) / 2 - len(lines) * 15
            for line in lines:
                f = font(22, bold=True)
                bb = d.textbbox((0, 0), line, font=f)
                d.text(((x1 + x2 - (bb[2] - bb[0])) / 2, ty), line, font=f, fill=INK)
                ty += 27
        else:
            text_box(d, xy, label, [], fill=fill, outline=outline, title_size=25, center=True)
        centers[key] = ((xy[0] + xy[2]) / 2, (xy[1] + xy[3]) / 2, xy)
    for src, dst, label, color in edges:
        sx, sy, sxy = centers[src]
        dx, dy, dxy = centers[dst]
        if abs(dx - sx) >= abs(dy - sy):
            start = (sxy[2] if dx > sx else sxy[0], sy)
            end = (dxy[0] if dx > sx else dxy[2], dy)
        else:
            start = (sx, sxy[3] if dy > sy else sxy[1])
            end = (dx, dxy[1] if dy > sy else dxy[3])
        arrow(d, start, end, color, label=label)
    save(im, filename)


def diagram_flows():
    flow(
        "Luồng theo dõi giá và phát cảnh báo",
        "Tác vụ nền đảm bảo không gửi lặp và lưu vết trạng thái",
        [
            ("create", (120, 300, 560, 440), "Người dùng tạo cảnh báo", CYAN, BLUE),
            ("validate", (780, 300, 1280, 440), "API kiểm tra ngưỡng và quyền", GREEN_PALE, GREEN),
            ("store", (1500, 300, 2040, 440), "Lưu alert đang hoạt động", PURPLE_PALE, PURPLE),
            ("worker", (1500, 690, 2040, 830), "Worker đọc giá mới nhất", ORANGE_PALE, ORANGE),
            ("match", (780, 690, 1280, 830), "So khớp điều kiện và chống lặp", RED_PALE, RED),
            ("notify", (120, 690, 560, 830), "Tạo notification", CYAN, BLUE),
            ("deliver", (120, 1110, 560, 1250), "Gửi qua kênh đã cấu hình", GREEN_PALE, GREEN),
            ("audit", (780, 1110, 1280, 1250), "Ghi delivery và kết quả", PALE, GRAY),
            ("update", (1500, 1110, 2040, 1250), "Cập nhật lần kích hoạt", PURPLE_PALE, PURPLE),
        ],
        [("create", "validate", "HTTPS", BLUE), ("validate", "store", "Hợp lệ", GREEN),
         ("store", "worker", "Lịch chạy", ORANGE), ("worker", "match", "Giá mới", RED),
         ("match", "notify", "Đạt ngưỡng", BLUE), ("notify", "deliver", "Xếp hàng", GREEN),
         ("deliver", "audit", "Kết quả", GRAY), ("audit", "update", "Hoàn tất", PURPLE)],
        "09-flow-price-alert.png")
    flow(
        "Luồng thu thập, chuẩn hóa và duyệt dữ liệu",
        "Dữ liệu ngoài không đi thẳng vào catalog công khai",
        [
            ("source", (120, 300, 560, 440), "Nguồn dữ liệu đã đăng ký", CYAN, BLUE),
            ("fetch", (790, 300, 1270, 440), "Thu thập raw page", GREEN_PALE, GREEN),
            ("extract", (1500, 300, 2040, 440), "Trích xuất trường dữ liệu", PURPLE_PALE, PURPLE),
            ("normalize", (1500, 700, 2040, 840), "Chuẩn hóa đơn vị và alias", ORANGE_PALE, ORANGE),
            ("diff", (790, 700, 1270, 840), "Tạo bản thay đổi có nguồn", RED_PALE, RED),
            ("review", (120, 700, 560, 840), "Biên tập viên đối soát", CYAN, BLUE),
            ("approve", (120, 1120, 560, 1260), "Phê duyệt / từ chối", GREEN_PALE, GREEN),
            ("publish", (790, 1120, 1270, 1260), "Xuất bản có audit", PURPLE_PALE, PURPLE),
            ("index", (1500, 1120, 2040, 1260), "Lập chỉ mục tìm kiếm / embedding", PALE, GRAY),
        ],
        [("source", "fetch", "Job", BLUE), ("fetch", "extract", "HTML/JSON", GREEN),
         ("extract", "normalize", "Dữ liệu thô", PURPLE), ("normalize", "diff", "Candidate", ORANGE),
         ("diff", "review", "Review queue", RED), ("review", "approve", "Quyết định", BLUE),
         ("approve", "publish", "Được duyệt", GREEN), ("publish", "index", "Sự kiện", GRAY)],
        "10-flow-ingestion.png")


def entity(d, xy, name, fields, color=NAVY):
    x1, y1, x2, y2 = xy
    d.rectangle(xy, fill=WHITE, outline=INK, width=3)
    d.rectangle((x1, y1, x2, y1 + 54), fill="#E6E6E6", outline=INK, width=2)
    f = font(22, bold=True)
    bb = d.textbbox((0, 0), name, font=f)
    d.text((x1 + (x2 - x1 - (bb[2] - bb[0])) / 2, y1 + 14), name, font=f, fill=INK)
    y = y1 + 67
    for fld in fields:
        d.text((x1 + 16, y), fld, font=font(18), fill=INK)
        y += 27


def relationship(d, path, source_card="1", target_card="N", label="", dashed=False):
    """Vẽ connector orthogonal theo waypoint, không đi xuyên entity box."""
    if len(path) < 2:
        raise ValueError("A relationship path requires at least two points")

    for start, end in zip(path, path[1:]):
        if dashed:
            x1, y1 = start
            x2, y2 = end
            length = abs(x2 - x1) + abs(y2 - y1)
            if length == 0:
                continue
            step = 18
            gap = 10
            drawn = 0
            while drawn < length:
                finish = min(length, drawn + step)
                if x1 == x2:
                    direction = 1 if y2 >= y1 else -1
                    p1 = (x1, y1 + direction * drawn)
                    p2 = (x1, y1 + direction * finish)
                else:
                    direction = 1 if x2 >= x1 else -1
                    p1 = (x1 + direction * drawn, y1)
                    p2 = (x1 + direction * finish, y1)
                d.line((*p1, *p2), fill=INK, width=3)
                drawn += step + gap
        else:
            d.line((*start, *end), fill=INK, width=3)

    # Đặt nhãn ở segment dài nhất để tránh chèn lên các góc connector.
    segments = list(zip(path, path[1:]))
    start, end = max(
        segments,
        key=lambda pair: abs(pair[1][0] - pair[0][0]) + abs(pair[1][1] - pair[0][1]),
    )
    relation_text = f"{source_card} : {target_card}"
    if label:
        relation_text += f"  {label}"
    label_font = font(16, italic=True)
    bb = d.textbbox((0, 0), relation_text, font=label_font)
    width = bb[2] - bb[0]
    height = bb[3] - bb[1]
    mx = (start[0] + end[0]) / 2
    my = (start[1] + end[1]) / 2
    x = mx - width / 2
    y = my - height / 2
    d.rectangle((x - 8, y - 6, x + width + 8, y + height + 6), fill=WHITE)
    d.text((x, y), relation_text, font=label_font, fill=INK)


def erd(title, subtitle, entities, rels, filename):
    im, d = canvas(title, subtitle, size=(2400, 1750))
    boxes = {}
    for key, xy, name, fields, color in entities:
        boxes[key] = xy
    # Connector được vẽ trước entity và chỉ đi qua vùng trắng đã dành sẵn.
    for a, b, source_card, target_card, label, path, *options in rels:
        if a not in boxes or b not in boxes:
            raise KeyError(f"Unknown ERD entity in relationship: {a} -> {b}")
        relationship(d, path, source_card, target_card, label, bool(options and options[0]))
    for key, xy, name, fields, color in entities:
        entity(d, xy, name, fields, color)
    d.text(
        (80, 1695),
        "Ký hiệu: 1 : N = one-to-many; nét đứt = logical reference, không phải physical foreign key.",
        font=font(17, italic=True),
        fill=INK,
    )
    save(im, filename)


def diagram_erds():
    erd("ERD nhóm catalog", "Các physical foreign key tiêu biểu trong Prisma schema",
        [
            ("org", (80, 120, 580, 390), "organizations", ["PK id", "name, slug", "created_at"], NAVY),
            ("cat", (950, 120, 1450, 390), "device_categories", ["PK id", "name, slug", "parent_category_id"], BLUE),
            ("status", (1820, 120, 2320, 390), "release_statuses", ["PK id", "code, name", "sort_order"], GREEN),
            ("fam", (80, 680, 580, 980), "product_families", ["PK id", "FK brand_org_id", "FK device_category_id", "name, slug"], PURPLE),
            ("model", (950, 650, 1450, 1010), "device_models", ["PK id", "FK product_family_id", "FK release_status_id", "name, slug", "release_date"], ORANGE),
            ("alias", (1820, 680, 2320, 980), "device_model_aliases", ["PK id", "FK device_model_id", "alias", "normalized_alias"], RED),
            ("currency", (80, 1280, 580, 1580), "currencies", ["PK id", "code, name", "symbol", "decimal_digits"], GRAY),
            ("variant", (950, 1240, 1450, 1600), "device_variants", ["PK id", "FK device_model_id", "FK release_status_id", "FK currency_id", "variant_name"], NAVY),
            ("price", (1820, 1240, 2320, 1600), "variant_price_history", ["PK id", "FK device_variant_id", "FK currency_id", "price, price_type", "effective_date"], BLUE),
        ],
        [
            ("org", "fam", "1", "N", "brand_org_id", [(260, 390), (260, 680)]),
            ("cat", "fam", "1", "N", "device_category_id", [(1080, 390), (1080, 520), (520, 520), (520, 680)]),
            ("fam", "model", "1", "N", "product_family_id", [(580, 830), (950, 830)]),
            ("status", "model", "1", "N", "release_status_id", [(1820, 260), (1600, 260), (1600, 560), (1370, 560), (1370, 650)]),
            ("model", "alias", "1", "N", "device_model_id", [(1450, 820), (1820, 820)]),
            ("model", "variant", "1", "N", "device_model_id", [(1200, 1010), (1200, 1240)]),
            ("status", "variant", "1", "N", "release_status_id", [(1820, 320), (1650, 320), (1650, 1120), (1420, 1120), (1420, 1240)]),
            ("currency", "variant", "1", "N", "currency_id", [(580, 1430), (950, 1430)]),
            ("variant", "price", "1", "N", "device_variant_id", [(1450, 1430), (1820, 1430)]),
        ], "11-erd-catalog.png")
    erd("ERD nhóm hardware và scoring", "Join table biểu diễn quan hệ component; scoring và benchmark được tách riêng",
        [
            ("chip", (80, 100, 580, 390), "chipsets", ["PK id", "name, slug", "process_node_id", "manufacturer_org_id"], NAVY),
            ("variant", (950, 100, 1450, 430), "device_variants", ["PK id", "FK device_model_id", "variant_name", "sku_code", "release_status_id"], BLUE),
            ("display", (1820, 100, 2320, 390), "display_units", ["PK id", "name, slug", "size_inches", "refresh_rate_hz"], GREEN),
            ("vchip", (80, 680, 580, 990), "variant_chipsets", ["PK/FK device_variant_id", "PK/FK chipset_id", "position", "notes"], PURPLE),
            ("score", (950, 650, 1450, 1010), "variant_scorecards", ["PK id", "FK device_variant_id", "FK scoring_profile_id", "total_score", "status"], ORANGE),
            ("vdisplay", (1820, 680, 2320, 990), "variant_displays", ["PK/FK device_variant_id", "PK/FK display_unit_id", "position", "notes"], RED),
            ("profile", (80, 1280, 580, 1580), "scoring_profiles", ["PK id", "FK device_category_id", "name, version", "status"], GRAY),
            ("bench", (950, 1280, 1450, 1580), "benchmarks", ["PK id", "name, slug", "benchmark_type", "target_type"], NAVY),
            ("vbench", (1820, 1250, 2320, 1610), "device_variant_benchmarks", ["PK id", "FK benchmark_id", "FK device_variant_id", "score", "tested_at"], BLUE),
        ],
        [
            ("chip", "vchip", "1", "N", "chipset_id", [(330, 390), (330, 680)]),
            ("variant", "vchip", "1", "N", "device_variant_id", [(950, 300), (760, 300), (760, 560), (500, 560), (500, 680)]),
            ("variant", "score", "1", "N", "device_variant_id", [(1200, 430), (1200, 650)]),
            ("variant", "vdisplay", "1", "N", "device_variant_id", [(1450, 300), (1640, 300), (1640, 560), (1900, 560), (1900, 680)]),
            ("display", "vdisplay", "1", "N", "display_unit_id", [(2070, 390), (2070, 680)]),
            ("profile", "score", "1", "N", "scoring_profile_id", [(330, 1280), (330, 1120), (1050, 1120), (1050, 1010)]),
            ("variant", "vbench", "1", "N", "device_variant_id", [(1450, 380), (1660, 380), (1660, 1120), (2200, 1120), (2200, 1250)]),
            ("bench", "vbench", "1", "N", "benchmark_id", [(1450, 1430), (1820, 1430)]),
        ],
        "12-erd-hardware.png")
    erd("ERD nhóm content, crawler và AI/search", "Physical foreign key và một logical reference của embedding",
        [
            ("source", (80, 100, 580, 400), "sources", ["PK id", "name, slug", "source_type", "trust_level"], NAVY),
            ("cite", (950, 100, 1450, 430), "citations", ["PK id", "FK source_id", "url, title", "excerpt"], BLUE),
            ("wcite", (1820, 100, 2320, 430), "wiki_article_citations", ["PK id", "FK article_id", "FK citation_id", "anchor_key"], GREEN),
            ("user", (80, 680, 580, 1010), "users", ["PK id", "email", "role", "is_active"], PURPLE),
            ("wiki", (950, 650, 1450, 1030), "wiki_articles", ["PK id", "FK author_user_id", "title, slug", "status", "current_revision_id"], ORANGE),
            ("rev", (1820, 680, 2320, 1010), "wiki_revisions", ["PK id", "FK article_id", "FK author_user_id", "revision_number", "is_published"], RED),
            ("data_source", (80, 1280, 580, 1580), "data_sources", ["PK id", "name, slug", "base_url", "crawl_config"], GRAY),
            ("raw", (950, 1250, 1450, 1610), "raw_pages", ["PK id", "FK source_id", "url", "status", "device_model_id"], NAVY),
            ("embed", (1820, 1280, 2320, 1580), "embeddings", ["PK id", "entity_type/id", "chunk_text", "embedding", "model_name"], BLUE),
        ],
        [
            ("source", "cite", "1", "N", "source_id", [(580, 260), (950, 260)]),
            ("cite", "wcite", "1", "N", "citation_id", [(1450, 260), (1820, 260)]),
            ("wiki", "wcite", "1", "N", "article_id", [(1450, 760), (1650, 760), (1650, 560), (2070, 560), (2070, 430)]),
            ("wiki", "rev", "1", "N", "article_id", [(1450, 840), (1820, 840)]),
            ("user", "wiki", "1", "N", "author_user_id", [(580, 840), (950, 840)]),
            ("user", "rev", "1", "N", "author_user_id", [(400, 680), (400, 540), (1730, 540), (1730, 900), (1820, 900)]),
            ("data_source", "raw", "1", "N", "source_id", [(580, 1430), (950, 1430)]),
            ("wiki", "embed", "1", "N", "entity_type/id", [(1300, 1030), (1300, 1140), (2070, 1140), (2070, 1280)], True),
        ],
        "13-erd-content-ai.png")
    erd("ERD nhóm user engagement, subscription và B2B", "Các foreign key tiêu biểu theo đúng Prisma schema",
        [
            ("plan", (80, 100, 580, 400), "subscription_plans", ["PK id", "code, name", "price_monthly/yearly", "is_active"], NAVY),
            ("user", (950, 100, 1450, 430), "users", ["PK id", "email", "password_hash", "role, is_active"], BLUE),
            ("variant", (1820, 100, 2320, 430), "device_variants", ["PK id", "device_model_id", "variant_name", "sku_code"], GREEN),
            ("sub", (80, 680, 580, 1010), "subscriptions", ["PK id", "FK user_id", "FK plan_id", "status", "billing_cycle"], PURPLE),
            ("wish", (950, 680, 1450, 1010), "wishlists", ["PK id", "FK user_id", "name", "is_public"], ORANGE),
            ("alert", (1820, 680, 2320, 1010), "price_alerts", ["PK id", "FK user_id", "FK device_variant_id", "target_price", "is_active"], RED),
            ("key", (80, 1280, 580, 1580), "api_keys", ["PK id", "FK user_id", "key_prefix, key_hash", "scopes", "revoked_at"], GRAY),
            ("notify", (950, 1280, 1450, 1580), "notifications", ["PK id", "FK user_id", "type, title", "read_at"], NAVY),
            ("deliver", (1820, 1250, 2320, 1610), "notification_deliveries", ["PK id", "FK notification_id", "channel, recipient", "status, attempts"], BLUE),
        ],
        [
            ("plan", "sub", "1", "N", "plan_id", [(330, 400), (330, 680)]),
            ("user", "sub", "1", "1", "user_id", [(950, 300), (760, 300), (760, 560), (500, 560), (500, 680)]),
            ("user", "wish", "1", "N", "user_id", [(1200, 430), (1200, 680)]),
            ("user", "alert", "1", "N", "user_id", [(1450, 300), (1640, 300), (1640, 560), (1900, 560), (1900, 680)]),
            ("variant", "alert", "1", "N", "device_variant_id", [(2070, 430), (2070, 680)]),
            ("user", "key", "1", "N", "user_id", [(950, 380), (700, 380), (700, 1130), (330, 1130), (330, 1280)]),
            ("user", "notify", "1", "N", "user_id", [(1450, 380), (1600, 380), (1600, 1130), (1300, 1130), (1300, 1280)]),
            ("notify", "deliver", "1", "N", "notification_id", [(1450, 1430), (1820, 1430)]),
        ],
        "14-erd-user-commerce.png")


def diagram_monorepo():
    im, d = canvas("Cấu trúc monorepo Spechub", "Tổ chức theo ứng dụng triển khai và gói dùng chung", size=(2200, 1550))
    text_box(d, (650, 120, 1550, 340), "spechub/ — pnpm workspace + Turborepo",
             ["Single repository, unified build / test / lint pipeline"],
             fill=PALE, outline=INK, title_fill=INK, center=True)

    groups = [
        ((80, 500, 1030, 1480), "DEPLOYABLE APPS"),
        ((1170, 500, 2120, 1480), "SHARED PACKAGES"),
    ]
    for (x1, y1, x2, y2), label in groups:
        d.rectangle((x1, y1, x2, y2), outline=INK, width=3)
        d.rectangle((x1, y1, x2, y1 + 70), fill="#E6E6E6", outline=INK, width=2)
        f = font(27, bold=True)
        bb = d.textbbox((0, 0), label, font=f)
        d.text(((x1 + x2 - (bb[2] - bb[0])) / 2, y1 + 20), label, font=f, fill=INK)

    left_boxes = [
        ((150, 640, 960, 850), "apps/web", ["Next.js App Router", "22 web routes", "PWA và responsive UI"]),
        ((150, 930, 960, 1140), "apps/api", ["NestJS + Fastify", "30 controllers", "186 API endpoints"]),
        ((150, 1220, 960, 1410), "apps/worker", ["Background jobs", "Data synchronization", "Price alerts"]),
    ]
    right_boxes = [
        ((1240, 640, 2050, 850), "packages/database", ["Prisma schema", "139 models", "Seed data và migration"]),
        ((1240, 930, 2050, 1140), "packages/shared", ["Shared types", "Zod schema", "Shared constants"]),
        ((1240, 1220, 2050, 1410), "packages/config", ["TypeScript / ESLint", "Tooling configuration", "Repository conventions"]),
    ]
    for xy, title, lines in left_boxes + right_boxes:
        text_box(d, xy, title, lines, fill=WHITE, outline=INK, title_fill=INK,
                 title_size=27, body_size=24, center=True)

    arrow(d, (880, 345), (555, 490), INK, width=4)
    arrow(d, (1320, 345), (1645, 490), INK, width=4)
    save(im, "15-monorepo.png")


if __name__ == "__main__":
    diagram_context()
    diagram_architecture()
    diagram_deployment()
    diagram_usecase_public()
    diagram_usecase_admin()
    diagram_sequences()
    diagram_flows()
    diagram_erds()
    diagram_monorepo()
    generate_monochrome_assets()
