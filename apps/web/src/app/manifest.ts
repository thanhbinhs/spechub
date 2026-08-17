import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpecHub",
    short_name: "SpecHub",
    description: "Tìm, so sánh và chọn thiết bị dễ dàng.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Xem thiết bị",
        short_name: "Thiết bị",
        description: "Xem điện thoại, laptop và nhiều thiết bị khác",
        url: "/devices",
      },
      {
        name: "So sánh thiết bị",
        short_name: "So sánh",
        description: "Đặt hai thiết bị cạnh nhau",
        url: "/compare",
      },
      {
        name: "Hỏi SpecHub AI",
        short_name: "Hỏi AI",
        description: "Nhận câu trả lời dễ hiểu từ dữ liệu thiết bị",
        url: "/ai",
      },
    ],
  };
}
