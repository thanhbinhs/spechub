import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export const ADMIN_HARDWARE_MODULE_KINDS = [
  "chipset",
  "cpu",
  "gpu",
  "npu",
  "modem",
  "memory-standard",
  "storage-standard",
  "operating-system",
] as const;

export type AdminHardwareModuleKind =
  (typeof ADMIN_HARDWARE_MODULE_KINDS)[number];

export class ChipsetCpuClusterDto {
  @ApiPropertyOptional({ example: "Prime" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cluster_name?: string;

  @ApiProperty({ example: "Cortex-X2" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  core_microarchitecture!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  core_count!: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  clock_ghz?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cluster_order?: number;
}

export class ChipsetCpuComponentDto {
  @ApiProperty({ example: "Kryo CPU (Snapdragon 8 Gen 1)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "kryo-cpu-snapdragon-8-gen-1" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "CPU slug must be kebab-case",
  })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  core_count?: number;

  @ApiPropertyOptional({ example: "ARMv9-A" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  isa_name?: string;

  @ApiPropertyOptional({ example: "Cortex-X2 / A710 / A510" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  microarchitecture?: string;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_frequency_mhz?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  supports_64bit?: boolean;

  @ApiPropertyOptional({ type: [ChipsetCpuClusterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChipsetCpuClusterDto)
  clusters?: ChipsetCpuClusterDto[];
}

export class ChipsetGpuComponentDto {
  @ApiProperty({ example: "Adreno 730" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "adreno-730" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "GPU slug must be kebab-case",
  })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Adreno 7" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  gpu_generation?: string;

  @ApiPropertyOptional({ example: 818 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  clock_mhz?: number;

  @ApiPropertyOptional({ example: "OpenGL ES 3.2, OpenCL 2.0 FP, Vulkan 1.1" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  api_support?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  opengl_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  opencl_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vulkan_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ray_tracing_support?: boolean;
}

export class ChipsetNpuComponentDto {
  @ApiProperty({ example: "Hexagon AI Engine" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "hexagon-ai-engine-snapdragon-8-gen-1" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "NPU slug must be kebab-case",
  })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  dedicated_npu?: boolean;

  @ApiPropertyOptional({ example: 27 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tops?: number;

  @ApiPropertyOptional({ example: "7th Gen Qualcomm AI Engine" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ai_engine_version?: string;

  @ApiPropertyOptional({ example: "Qualcomm Hexagon" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  dsp_name?: string;

  @ApiPropertyOptional({ example: "Hexagon Tensor Accelerator" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tensor_accelerator?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_int8?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_fp16?: boolean;

  @ApiPropertyOptional({ example: "INT8, INT16, FP16, mixed precision" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  quantization?: string;
}

export class ChipsetBenchmarkResultDto {
  @ApiProperty()
  @IsUUID("4")
  benchmark_id!: string;

  @ApiProperty({ example: 1290942 })
  @Type(() => Number)
  @IsNumber()
  score!: number;

  @ApiPropertyOptional({ example: "overall" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  subscore_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  source_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  tested_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  test_environment_note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ambient_temp_c?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  os_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  app_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  power_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_thermal_throttled?: boolean;
}

export class CreateHardwareModuleDto {
  @ApiProperty({ enum: ADMIN_HARDWARE_MODULE_KINDS })
  @IsIn(ADMIN_HARDWARE_MODULE_KINDS)
  kind!: AdminHardwareModuleKind;

  @ApiProperty({ example: "Snapdragon 8 Elite" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "snapdragon-8-elite" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  slug!: string;

  @ApiProperty({
    example:
      "Nền tảng SoC cao cấp dành cho thiết bị di động, nêu rõ thế hệ, cấu hình chính, khả năng tương thích và giới hạn sử dụng.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(120)
  description!: string;

  @ApiPropertyOptional({
    description: "Public image URL for the hardware module.",
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  image_url?: string | null;

  @ApiPropertyOptional({
    description: "Source page used to verify or attribute the module image.",
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  image_source_url?: string | null;

  @ApiPropertyOptional({
    description:
      "Manufacturer, vendor, or standards organization UUID. Required for chipsets.",
  })
  @IsOptional()
  @IsUUID("4")
  organization_id?: string;

  @ApiPropertyOptional({
    description: "Required for chipset and operating system modules.",
    example: "soc",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_64bit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  integrated_5g?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  integrated_wifi?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_ram_gb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  max_display_resolution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_camera_mp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  announcement_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  release_date?: Date;

  @ApiPropertyOptional({
    description: "Primary CPU linked to a chipset.",
    nullable: true,
  })
  @IsOptional()
  @IsUUID("4")
  cpu_id?: string | null;

  @ApiPropertyOptional({
    description: "Primary GPU linked to a chipset.",
    nullable: true,
  })
  @IsOptional()
  @IsUUID("4")
  gpu_id?: string | null;

  @ApiPropertyOptional({
    description: "Primary NPU linked to a chipset.",
    nullable: true,
  })
  @IsOptional()
  @IsUUID("4")
  npu_id?: string | null;

  @ApiPropertyOptional({
    description: "Primary modem linked to a chipset.",
    nullable: true,
  })
  @IsOptional()
  @IsUUID("4")
  modem_id?: string | null;

  @ApiPropertyOptional({
    description: "Whether the selected modem is integrated into the chipset.",
  })
  @IsOptional()
  @IsBoolean()
  modem_is_integrated?: boolean;

  @ApiPropertyOptional({
    type: ChipsetCpuComponentDto,
    description:
      "CPU được khởi tạo và liên kết nguyên tử khi tạo một chipset/SoC.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChipsetCpuComponentDto)
  cpu?: ChipsetCpuComponentDto;

  @ApiPropertyOptional({
    type: ChipsetGpuComponentDto,
    description:
      "GPU được khởi tạo và liên kết nguyên tử khi tạo một chipset/SoC.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChipsetGpuComponentDto)
  gpu?: ChipsetGpuComponentDto;

  @ApiPropertyOptional({
    type: ChipsetNpuComponentDto,
    description:
      "NPU/AI engine được khởi tạo và liên kết nguyên tử khi tạo một chipset/SoC.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChipsetNpuComponentDto)
  npu?: ChipsetNpuComponentDto;

  @ApiPropertyOptional({
    type: [ChipsetBenchmarkResultDto],
    description:
      "Kết quả benchmark cấp chipset; AnTuTu có thể gồm overall, CPU, GPU, memory và UX.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChipsetBenchmarkResultDto)
  benchmark_results?: ChipsetBenchmarkResultDto[];

  @ApiPropertyOptional({
    type: [ChipsetCpuClusterDto],
    description:
      "CPU core clusters. Used when creating or updating a standalone CPU module.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChipsetCpuClusterDto)
  clusters?: ChipsetCpuClusterDto[];

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  core_count?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  thread_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  big_little?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  isa_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  microarchitecture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  core_type?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_frequency_mhz?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  min_frequency_mhz?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  l1_instruction_cache?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  l1_data_cache?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  l2_cache?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  l3_cache?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  simd_extension?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  virtualization?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  out_of_order?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smt?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  shader_units?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  compute_units?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  clock_mhz?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  fp32_gflops?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ray_tracing_support?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  api_support?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  gpu_generation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  opengl_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  opencl_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vulkan_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  directx_feature_level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  metal_support?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cuda_support?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  video_decode_codecs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  video_encode_codecs?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops_int4?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops_int8?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  tops_fp16?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dedicated_npu?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  dsp_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ai_engine_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tensor_accelerator?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_int8?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_fp16?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_fp32?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  quantization?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_downlink_mbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_uplink_mbps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_mmwave?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_satellite?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  supported_5g_modes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lte_category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supports_5g_nr?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  carrier_aggregation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  volte?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vonr?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  dual_sim_capability?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  supported_technologies?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  generation?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  max_data_rate_mtps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  typical_data_rate_mtps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  jedec_standard?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  prefetch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ecc?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dual_channel?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  voltage?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  bandwidth_gbps?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  channel_width_bits?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  maximum_capacity_gb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_mobile?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1800)
  release_year?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: "Use the benchmark module for measured storage performance.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sequential_read_mbps?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: "Use the benchmark module for measured storage performance.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sequential_write_mbps?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: "Use the benchmark module for measured storage performance.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  random_read_iops?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: "Use the benchmark module for measured storage performance.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  random_write_iops?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  interface?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  half_duplex?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  full_duplex?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  command_queue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  boot_partition?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rpmb?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trim?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  secure_erase?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hs200?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hs400?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  kernel_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_open_source?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  kernel_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  license_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  initial_release_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  os_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  supported_architectures?: string;
}
