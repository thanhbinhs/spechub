import { Prisma } from "@spechub/database";

export const DEVICE_VARIANT_COMPONENT_SELECT = {
  variant_physical_specs: true,
  variant_io_specs: true,
  variant_thermal_specs: true,
  device_variant_benchmarks: {
    select: {
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
    },
    orderBy: [{ benchmark: { name: "asc" as const } }],
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
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
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
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
          architecture: {
            select: { id: true, name: true, slug: true },
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
          tops_int4: true,
          tops_fp16: true,
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
          architecture: {
            select: { id: true, name: true, slug: true },
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
          hdr_formats: true,
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
          removable: true,
          battery_chemistry: { select: { id: true, name: true, slug: true } },
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
              has_af: true,
              video_capabilities: true,
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
          bandwidth_gbps: true,
          channel_width_bits: true,
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
          sequential_read_mbps: true,
          sequential_write_mbps: true,
        },
      },
    },
    orderBy: [{ total_capacity_gb: "desc" as const }],
  },
  variant_ports: {
    select: {
      port_count: true,
      notes: true,
      port_standard: {
        select: {
          id: true,
          name: true,
          slug: true,
          port_type: true,
          data_speed_gbps: true,
          power_delivery_w: true,
          alt_modes: true,
        },
      },
    },
    orderBy: [{ port_standard: { name: "asc" as const } }],
  },
  variant_wireless_support: {
    select: {
      notes: true,
      wireless_standard: {
        select: {
          id: true,
          name: true,
          slug: true,
          wireless_type: true,
          max_speed_mbps: true,
        },
      },
    },
    orderBy: [{ wireless_standard: { wireless_type: "asc" as const } }],
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
  variant_hardware_sensors: {
    select: {
      notes: true,
      hardware_sensor: {
        select: {
          id: true,
          name: true,
          slug: true,
          sensor_category: true,
          description: true,
          manufacturer: {
            select: { id: true, name: true, slug: true, short_name: true },
          },
        },
      },
    },
    orderBy: [{ hardware_sensor: { sensor_category: "asc" as const } }],
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
