import type { PrismaClient } from "../generated/client";

const CPU_CAPABILITIES = [
  ["armv8", "ARMv8", "instruction_set"],
  ["armv9", "ARMv9", "instruction_set"],
  ["x86", "x86", "instruction_set"],
  ["x86-64", "x86-64", "instruction_set"],
  ["risc-v", "RISC-V", "instruction_set"],
  ["64-bit", "64-bit", "feature"],
  ["smt", "Simultaneous multithreading", "feature"],
  ["hyper-threading", "Hyper-Threading", "feature"],
  ["virtualization", "Hardware virtualization", "feature"],
  ["aes", "AES acceleration", "instruction"],
  ["neon", "NEON", "instruction"],
  ["avx", "AVX", "instruction"],
  ["avx2", "AVX2", "instruction"],
  ["avx-512", "AVX-512", "instruction"],
  ["sve", "SVE", "instruction"],
  ["sve2", "SVE2", "instruction"],
  ["ai-acceleration", "AI acceleration", "feature"],
] as const;

const GPU_APIS = [
  ["opengl-es", "OpenGL ES", "graphics"],
  ["opencl", "OpenCL", "compute"],
  ["vulkan", "Vulkan", "graphics"],
  ["directx", "DirectX", "graphics"],
  ["metal", "Metal", "platform"],
  ["cuda", "CUDA", "compute"],
] as const;

const CAMERA_FEATURES = [
  ["hdr", "HDR", "computational"],
  ["hdr10", "HDR10", "video"],
  ["raw", "RAW capture", "capture"],
  ["ai", "AI photography", "computational"],
  ["night-mode", "Night mode", "computational"],
  ["portrait-mode", "Portrait mode", "computational"],
  ["super-resolution", "Super resolution", "computational"],
  ["dual-pixel-pdaf", "Dual Pixel PDAF", "focus"],
  ["laser-autofocus", "Laser autofocus", "focus"],
  ["automatic-scene", "Automatic scene recognition", "computational"],
  ["face-detection", "Face detection", "detection"],
  ["smile-detection", "Smile detection", "detection"],
] as const;

const VIDEO_MODES = [
  ["8k-30", "8K at 30 fps", 7680, 4320, 30, "standard"],
  ["4k-120", "4K at 120 fps", 3840, 2160, 120, "high_frame_rate"],
  ["4k-60", "4K at 60 fps", 3840, 2160, 60, "standard"],
  ["4k-30", "4K at 30 fps", 3840, 2160, 30, "standard"],
  ["1080p-240", "1080p at 240 fps", 1920, 1080, 240, "slow_motion"],
  ["1080p-120", "1080p at 120 fps", 1920, 1080, 120, "slow_motion"],
  ["1080p-60", "1080p at 60 fps", 1920, 1080, 60, "standard"],
  ["1080p-30", "1080p at 30 fps", 1920, 1080, 30, "standard"],
  ["720p-960", "720p at 960 fps", 1280, 720, 960, "slow_motion"],
] as const;

const HDR_STANDARDS = [
  ["hdr10", "HDR10"],
  ["hdr10-plus", "HDR10+"],
  ["dolby-vision", "Dolby Vision"],
  ["hlg", "HLG"],
] as const;

const COLOR_GAMUTS = [
  ["srgb", "sRGB"],
  ["display-p3", "Display P3"],
  ["dci-p3", "DCI-P3"],
  ["adobe-rgb", "Adobe RGB"],
  ["rec-2020", "Rec. 2020"],
] as const;

const CHARGING_PROTOCOLS = [
  ["usb-pd", "USB Power Delivery", "wired"],
  ["usb-pd-pps", "USB PD PPS", "wired"],
  ["qualcomm-quick-charge", "Qualcomm Quick Charge", "wired"],
  ["qi", "Qi", "wireless"],
  ["qi2", "Qi2", "wireless"],
  ["reverse-wired", "Reverse wired charging", "reverse"],
  ["reverse-wireless", "Reverse wireless charging", "reverse"],
] as const;

const CONNECTIVITY_FEATURES = [
  ["nfc", "NFC", "nfc"],
  ["gps", "GPS", "gps"],
  ["dual-frequency-gps", "Dual-frequency GPS", "gps"],
  ["esim", "eSIM", "sim"],
  ["dual-sim", "Dual SIM", "sim"],
  ["infrared", "Infrared blaster", "infrared"],
  ["uwb", "Ultra-wideband", "uwb"],
  ["satellite-sos", "Satellite emergency messaging", "satellite"],
] as const;

export async function seedCatalogReferenceData(prisma: PrismaClient) {
  await Promise.all([
    prisma.cpu_capabilities.createMany({
      data: CPU_CAPABILITIES.map(([code, name, capability_type]) => ({
        code,
        name,
        capability_type,
      })),
      skipDuplicates: true,
    }),
    prisma.gpu_apis.createMany({
      data: GPU_APIS.map(([slug, name, api_type]) => ({
        slug,
        name,
        api_type,
      })),
      skipDuplicates: true,
    }),
    prisma.camera_features.createMany({
      data: CAMERA_FEATURES.map(([code, name, feature_category]) => ({
        code,
        name,
        feature_category,
      })),
      skipDuplicates: true,
    }),
    prisma.camera_video_modes.createMany({
      data: VIDEO_MODES.map(
        ([
          slug,
          name,
          resolution_width,
          resolution_height,
          frame_rate_fps,
          mode_type,
        ]) => ({
          slug,
          name,
          resolution_width,
          resolution_height,
          frame_rate_fps,
          mode_type,
        }),
      ),
      skipDuplicates: true,
    }),
    prisma.hdr_standards.createMany({
      data: HDR_STANDARDS.map(([slug, name]) => ({ slug, name })),
      skipDuplicates: true,
    }),
    prisma.color_gamuts.createMany({
      data: COLOR_GAMUTS.map(([slug, name]) => ({ slug, name })),
      skipDuplicates: true,
    }),
    prisma.charging_protocols.createMany({
      data: CHARGING_PROTOCOLS.map(([slug, name, protocol_type]) => ({
        slug,
        name,
        protocol_type,
      })),
      skipDuplicates: true,
    }),
    prisma.connectivity_features.createMany({
      data: CONNECTIVITY_FEATURES.map(([code, name, feature_category]) => ({
        code,
        name,
        feature_category,
      })),
      skipDuplicates: true,
    }),
  ]);
}
