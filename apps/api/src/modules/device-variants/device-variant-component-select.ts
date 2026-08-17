import { Prisma } from "@spechub/database";

export const DEVICE_VARIANT_BENCHMARK_SELECT = {
  id: true,
  score: true,
  subscore_name: true,
  tested_at: true,
  source_id: true,
  benchmark: {
    select: {
      id: true,
      name: true,
      slug: true,
      benchmark_type: true,
      version: true,
      higher_is_better: true,
      unit: { select: { name: true, symbol: true } },
    },
  },
  benchmark_run: {
    select: {
      id: true,
      test_environment_note: true,
      ambient_temp_c: true,
      os_version: true,
      app_version: true,
      power_mode: true,
      is_thermal_throttled: true,
    },
  },
} satisfies Prisma.device_variant_benchmarksSelect;

const HARDWARE_BENCHMARK_SELECT = {
  score: true,
  subscore_name: true,
  tested_at: true,
  benchmark: {
    select: {
      name: true,
      slug: true,
      benchmark_type: true,
      version: true,
    },
  },
  benchmark_run: {
    select: { is_thermal_throttled: true },
  },
} as const;

export const DEVICE_SCORECARD_SELECT = {
  id: true,
  category_slug: true,
  score_version: true,
  overall_score: true,
  coverage_percent: true,
  score_source: true,
  raw_metric_count: true,
  rationale: true,
  factors: true,
  calculated_at: true,
  module_scores: {
    select: {
      id: true,
      module_key: true,
      module_name: true,
      score: true,
      weight_percent: true,
      coverage_percent: true,
      rationale: true,
      raw_metrics: true,
    },
    orderBy: [{ weight_percent: "desc" as const }],
  },
} satisfies Prisma.variant_scorecardsSelect;

export const DEVICE_VARIANT_COMPONENT_SELECT = {
  variant_physical_specs: true,
  variant_io_specs: true,
  variant_thermal_specs: true,
  device_variant_benchmarks: {
    select: DEVICE_VARIANT_BENCHMARK_SELECT,
    orderBy: [{ benchmark: { name: "asc" as const } }],
  },
  variant_module_scores: {
    select: {
      module_kind: true,
      module_id: true,
      score: true,
      score_source: true,
      score_version: true,
      rationale: true,
      factors: true,
    },
    orderBy: [{ module_kind: "asc" as const }, { score: "desc" as const }],
  },
  variant_score_metric_inputs: {
    select: {
      metric_key: true,
      raw_value: true,
      unit: true,
      normalized_score: true,
      source_label: true,
    },
    orderBy: [{ metric_key: "asc" as const }],
  },
  variant_scorecards: {
    select: DEVICE_SCORECARD_SELECT,
    orderBy: [{ calculated_at: "desc" as const }],
    take: 1,
  },
  variant_chipsets: {
    select: {
      chip_role: true,
      is_primary: true,
      chipset: {
        select: {
          id: true,
          name: true,
          slug: true,
          chip_kind: true,
          model_code: true,
          integrated_5g: true,
          max_ram_gb: true,
          process_node: { select: { node_nm: true } },
          chipset_benchmarks: {
            select: HARDWARE_BENCHMARK_SELECT,
            orderBy: [{ tested_at: "desc" as const }],
          },
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
          chipset_cpu_links: {
            select: {
              is_primary: true,
              cpu: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  core_count: true,
                  thread_count: true,
                  big_little: true,
                  isa_name: true,
                  microarchitecture: true,
                  core_type: true,
                  max_frequency_mhz: true,
                  min_frequency_mhz: true,
                  supports_64bit: true,
                  cpu_clusters: {
                    select: {
                      core_count: true,
                      clock_ghz: true,
                      cluster_order: true,
                    },
                    orderBy: [{ cluster_order: "asc" as const }],
                  },
                  cpu_benchmarks: {
                    select: HARDWARE_BENCHMARK_SELECT,
                    orderBy: [{ tested_at: "desc" as const }],
                  },
                },
              },
            },
          },
          chipset_gpu_links: {
            select: {
              is_primary: true,
              gpu: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  gpu_generation: true,
                  clock_mhz: true,
                  ray_tracing_support: true,
                  compute_units: true,
                  shader_units: true,
                  fp32_gflops: true,
                  gpu_benchmarks: {
                    select: HARDWARE_BENCHMARK_SELECT,
                    orderBy: [{ tested_at: "desc" as const }],
                  },
                },
              },
            },
          },
          chipset_npu_links: {
            select: {
              is_primary: true,
              npu: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  dedicated_npu: true,
                  tops: true,
                  tops_int8: true,
                  tops_int4: true,
                  npu_benchmarks: {
                    select: HARDWARE_BENCHMARK_SELECT,
                    orderBy: [{ tested_at: "desc" as const }],
                  },
                },
              },
            },
          },
          chipset_modem_links: {
            select: {
              is_primary: true,
              is_integrated: true,
              modem: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  lte_category: true,
                  supports_5g_nr: true,
                  supports_mmwave: true,
                },
              },
            },
          },
        },
      },
    },
  },
  variant_cpus: {
    select: {
      cpu_role: true,
      is_primary: true,
      cpu: {
        select: {
          id: true,
          name: true,
          slug: true,
          core_count: true,
          thread_count: true,
          big_little: true,
          isa_name: true,
          microarchitecture: true,
          core_type: true,
          max_frequency_mhz: true,
          min_frequency_mhz: true,
          l1_instruction_cache: true,
          l1_data_cache: true,
          l2_cache: true,
          l3_cache: true,
          supports_64bit: true,
          simd_extension: true,
          virtualization: true,
          out_of_order: true,
          smt: true,
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
          architecture: {
            select: { id: true, name: true, slug: true },
          },
          cpu_clusters: {
            select: {
              cluster_name: true,
              core_microarchitecture: true,
              core_count: true,
              clock_ghz: true,
              cluster_order: true,
            },
            orderBy: [{ cluster_order: "asc" as const }],
          },
          cpu_benchmarks: {
            select: HARDWARE_BENCHMARK_SELECT,
            orderBy: [{ tested_at: "desc" as const }],
          },
        },
      },
    },
  },
  variant_gpus: {
    select: {
      gpu_role: true,
      is_primary: true,
      gpu: {
        select: {
          id: true,
          name: true,
          slug: true,
          shader_units: true,
          compute_units: true,
          clock_mhz: true,
          fp32_gflops: true,
          ray_tracing_support: true,
          api_support: true,
          gpu_generation: true,
          opengl_version: true,
          opencl_version: true,
          vulkan_version: true,
          directx_feature_level: true,
          metal_support: true,
          cuda_support: true,
          video_decode_codecs: true,
          video_encode_codecs: true,
          max_display_resolution: true,
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
          architecture: {
            select: { id: true, name: true, slug: true },
          },
          gpu_benchmarks: {
            select: HARDWARE_BENCHMARK_SELECT,
            orderBy: [{ tested_at: "desc" as const }],
          },
        },
      },
    },
  },
  variant_npus: {
    select: {
      npu_role: true,
      is_primary: true,
      npu: {
        select: {
          id: true,
          name: true,
          slug: true,
          tops: true,
          tops_int8: true,
          tops_int4: true,
          tops_fp16: true,
          dedicated_npu: true,
          dsp_name: true,
          ai_engine_version: true,
          tensor_accelerator: true,
          supports_int8: true,
          supports_fp16: true,
          supports_fp32: true,
          quantization: true,
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
          architecture: {
            select: { id: true, name: true, slug: true },
          },
          npu_benchmarks: {
            select: HARDWARE_BENCHMARK_SELECT,
            orderBy: [{ tested_at: "desc" as const }],
          },
        },
      },
    },
  },
  variant_modems: {
    select: {
      modem_role: true,
      is_primary: true,
      modem: {
        select: {
          id: true,
          name: true,
          slug: true,
          max_downlink_mbps: true,
          max_uplink_mbps: true,
          supports_mmwave: true,
          supports_satellite: true,
          supported_5g_modes: true,
          lte_category: true,
          supports_5g_nr: true,
          carrier_aggregation: true,
          volte: true,
          vonr: true,
          dual_sim_capability: true,
          supported_technologies: true,
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
        },
      },
    },
  },
  variant_displays: {
    select: {
      display_role: true,
      display_order: true,
      display_unit: {
        select: {
          id: true,
          name: true,
          slug: true,
          size_inch: true,
          aspect_ratio: true,
          resolution_width: true,
          resolution_height: true,
          pixel_density_ppi: true,
          refresh_rate_hz: true,
          refresh_rate_min_hz: true,
          brightness_peak_nits: true,
          brightness_typical_nits: true,
          brightness_hbm_nits: true,
          contrast_ratio: true,
          color_depth_bits: true,
          touch_sampling_hz: true,
          has_dc_dimming: true,
          ltpo_version: true,
          pwm_frequency_hz: true,
          color_gamut: true,
          hdr_formats: true,
          hdr_support: {
            select: {
              certification: true,
              hdr_standard: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          color_gamuts: {
            select: {
              coverage_percent: true,
              volume_percent: true,
              color_gamut: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          display_technology: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: [{ display_order: "asc" as const }],
  },
  variant_batteries: {
    select: {
      battery_role: true,
      is_primary: true,
      battery_unit: {
        select: {
          id: true,
          name: true,
          slug: true,
          capacity_mah: true,
          energy_wh: true,
          wired_charging_w: true,
          wireless_charging_w: true,
          reverse_wired_charging_w: true,
          reverse_wireless_charging_w: true,
          removable: true,
          cycle_life: true,
          battery_chemistry: { select: { id: true, name: true, slug: true } },
          charging_support: {
            select: {
              max_power_w: true,
              is_reverse: true,
              charging_protocol: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  protocol_type: true,
                  version: true,
                },
              },
            },
          },
        },
      },
    },
  },
  variant_camera_systems: {
    select: {
      position: true,
      system_name: true,
      notes: true,
      variant_camera_modules: {
        select: {
          position: true,
          role: true,
          module_order: true,
          is_primary: true,
          usage_type: true,
          notes: true,
          camera_module: {
            select: {
              id: true,
              name: true,
              slug: true,
              effective_megapixel: true,
              aperture: true,
              focal_length_mm_eq: true,
              optical_zoom: true,
              has_ois: true,
              has_eis: true,
              has_af: true,
              video_capabilities: true,
              camera_module_sensor_links: {
                select: {
                  is_primary: true,
                  camera_sensor: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      optical_format: true,
                      sensor_width_mm: true,
                      sensor_height_mm: true,
                      pixel_size_um: true,
                      supports_stacked: true,
                      supports_hdr: true,
                      max_video_fps: true,
                      max_video_resolution: true,
                    },
                  },
                },
              },
              camera_feature_links: {
                select: {
                  camera_feature: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      feature_category: true,
                    },
                  },
                },
              },
              camera_video_modes: {
                select: {
                  has_stabilization: true,
                  video_mode: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      resolution_width: true,
                      resolution_height: true,
                      frame_rate_fps: true,
                      mode_type: true,
                      hdr_standard: true,
                      codec: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ module_order: "asc" as const }],
      },
    },
  },
  variant_memory_configs: {
    select: {
      capacity_gb: true,
      speed_mhz: true,
      bandwidth_gbps: true,
      channel_count: true,
      is_primary: true,
      notes: true,
      memory_standard: {
        select: {
          id: true,
          name: true,
          slug: true,
          memory_type: true,
          generation: true,
          max_data_rate_mtps: true,
          typical_data_rate_mtps: true,
          jedec_standard: true,
          prefetch: true,
          ecc: true,
          dual_channel: true,
          bandwidth_gbps: true,
          channel_width_bits: true,
          maximum_capacity_gb: true,
        },
      },
    },
    orderBy: [
      { is_primary: "desc" as const },
      { capacity_gb: "desc" as const },
    ],
  },
  variant_storage_configs: {
    select: {
      total_capacity_gb: true,
      module_count: true,
      is_expandable: true,
      expansion_max_gb: true,
      storage_standard: {
        select: {
          id: true,
          name: true,
          slug: true,
          storage_type: true,
          generation: true,
          jedec_standard: true,
          interface: true,
          half_duplex: true,
          full_duplex: true,
          command_queue: true,
          boot_partition: true,
          rpmb: true,
          trim: true,
          secure_erase: true,
          hs200: true,
          hs400: true,
          sequential_read_mbps: true,
          sequential_write_mbps: true,
          random_read_iops: true,
          random_write_iops: true,
        },
      },
    },
    orderBy: [{ total_capacity_gb: "desc" as const }],
  },
  variant_wifi_bands: {
    select: {
      wifi_band: { select: { id: true, name: true, frequency_range: true } },
    },
  },
  variant_operating_systems: {
    select: {
      is_default: true,
      is_upgradable_to: true,
      promised_major_updates: true,
      promised_security_years: true,
      notes: true,
      os_version: {
        select: {
          id: true,
          version_name: true,
          codename: true,
          release_date: true,
          api_level: true,
          operating_system: {
            select: {
              id: true,
              name: true,
              slug: true,
              os_family: true,
              kernel_type: true,
              kernel_name: true,
              license_name: true,
              is_open_source: true,
              initial_release_date: true,
              os_type: true,
              supported_architectures: true,
            },
          },
        },
      },
      ui_layer_version: {
        select: {
          id: true,
          version_name: true,
          ui_layer: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: [{ is_default: "desc" as const }],
  },
  software_profile: {
    select: {
      security_patch_date: true,
      promised_major_updates: true,
      promised_security_years: true,
      bootloader_status: true,
      root_status: true,
      last_verified_at: true,
      notes: true,
      launch_os_version: {
        select: {
          id: true,
          version_name: true,
          codename: true,
          operating_system: {
            select: { id: true, name: true, slug: true, os_family: true },
          },
        },
      },
      current_os_version: {
        select: {
          id: true,
          version_name: true,
          codename: true,
          operating_system: {
            select: { id: true, name: true, slug: true, os_family: true },
          },
        },
      },
      highest_official_version: {
        select: {
          id: true,
          version_name: true,
          codename: true,
          operating_system: {
            select: { id: true, name: true, slug: true, os_family: true },
          },
        },
      },
      ui_layer_version: {
        select: {
          id: true,
          version_name: true,
          ui_layer: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  },
  connectivity_support: {
    select: {
      version: true,
      is_supported: true,
      notes: true,
      connectivity_feature: {
        select: {
          id: true,
          code: true,
          name: true,
          feature_category: true,
        },
      },
    },
    orderBy: [{ connectivity_feature: { feature_category: "asc" as const } }],
  },
  variant_cellular_band_support: {
    select: {
      cellular_band: {
        select: {
          id: true,
          name: true,
          band_type: true,
          frequency_range: true,
          is_mmwave: true,
        },
      },
    },
  },
} satisfies Prisma.device_variantsSelect;
