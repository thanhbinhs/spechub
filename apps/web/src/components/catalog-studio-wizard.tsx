"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AffiliateOfferPreview,
  AffiliatePartner,
  CatalogDraft,
  CreateDeviceBundleInput,
  CreateDeviceModelInput,
  CreateDeviceVariantInput,
  CreateOperatingSystemVersionInput,
  CreateOsUiLayerVersionInput,
  OperatingSystemVersionRecord,
  Organization,
  OsUiLayerVersionRecord,
  ProductFamily,
} from "@spechub/api-client";
import type { ScoringProfile } from "@spechub/scoring-core";
import {
  normalizeNumberInput,
  normalizeText,
  parseSpecificationNumber,
} from "@spechub/utils";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Building2,
  Camera,
  Check,
  ChevronDown,
  CircleAlert,
  Cpu,
  FileClock,
  FileText,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  MemoryStick,
  MonitorSmartphone,
  PackagePlus,
  Play,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { SearchableSelect as AppSearchableSelect } from "@/components/searchable-select";

type EditorialSection = {
  section_key: string;
  title: string;
  body_markdown: string;
};

type CommerceLinkInput = {
  partner_slug: string;
  product_url: string;
};

type InlineDisplayForm = {
  technology: string;
  size_inch: string;
  aspect_ratio: string;
  resolution_width: string;
  resolution_height: string;
  pixel_density_ppi: string;
  refresh_rate_hz: string;
  refresh_rate_min_hz: string;
  ltpo_version: string;
  touch_sampling_hz: string;
  brightness_typical_nits: string;
  brightness_hbm_nits: string;
  brightness_peak_nits: string;
  color_gamut: string;
  hdr_formats: string;
  protection_glass: string;
  has_always_on: string;
  has_dc_dimming: string;
  pwm_frequency_hz: string;
};

type InlineCameraForm = {
  effective_megapixel: string;
  aperture: string;
  focal_length_mm_eq: string;
  optical_zoom: string;
  field_of_view_deg: string;
  has_ois: string;
  has_eis: string;
  has_af: string;
  video_capabilities: string;
};

type InlineBatteryForm = {
  capacity_mah: string;
  energy_wh: string;
  wired_charging_w: string;
  wired_charging_protocol: string;
  wireless_charging_w: string;
  wireless_charging_protocol: string;
  removable: string;
};

type WizardPayload = {
  provenance?: Record<string, unknown>;
  general: {
    name: string;
    slug: string;
    product_family_id: string;
    release_status_id: string;
    summary: string;
  };
  model: {
    /** Legacy draft field; the stored name is now derived from market/model code. */
    variant_name: string;
    sku_code: string;
    market_name: string;
    alias: string;
    internal_codename: string;
    generation_label: string;
    announcement_date: string;
    release_date: string;
    color_name: string;
    color_hex: string;
    launch_date: string;
    launch_price: string;
    currency_id: string;
  };
  hardware: {
    chipset_id: string;
    cpu_id: string;
    gpu_id: string;
    npu_id: string;
    modem_id: string;
  };
  configuration: {
    memory_standard_id: string;
    memory_capacity_options_gb: string;
    memory_speed_mhz: string;
    storage_standard_id: string;
    storage_capacity_options_gb: string;
    storage_expandable: string;
    storage_expansion_max_gb: string;
    height_mm: string;
    width_mm: string;
    thickness_mm: string;
    weight_g: string;
    frame_material: string;
    back_material: string;
    front_glass: string;
    ingress_protection: string;
    sim_slots: string;
    sim_type: string;
    esim_supported: string;
    stereo_speakers: string;
    headphone_jack: string;
    has_microsd_slot: string;
    has_ir_blaster: string;
    cooling_type: string;
    vc_area_mm2: string;
    has_active_cooling: string;
  };
  display: InlineDisplayForm;
  camera: {
    rear_main: InlineCameraForm;
    rear_ultrawide: InlineCameraForm;
    rear_telephoto: InlineCameraForm;
    front: InlineCameraForm;
  };
  battery: InlineBatteryForm;
  software: {
    launch_os_version_id: string;
    current_os_version_id: string;
    highest_official_version_id: string;
    ui_layer_version_id: string;
    promised_major_updates: string;
    promised_security_years: string;
    security_patch_date: string;
    bootloader_status: string;
    root_status: string;
  };
  media: {
    cover_asset_id: string;
    cover_filename: string;
    cover_alt: string;
  };
  commerce: {
    links: CommerceLinkInput[];
  };
  description: {
    summary: string;
    sections: EditorialSection[];
  };
};

type SelectOption = {
  value: string;
  label: string;
  meta?: string;
};

type DeviceDuplicateCandidate = {
  id: string;
  name: string;
  slug: string;
};

type OrganizationEditorInput = {
  name: string;
  slug: string;
  short_name?: string;
  description: string;
  logo_file?: File;
};

type OrganizationSaveResult = {
  id: string;
  logoWarning: string | null;
  logoUrl: string | null;
};

type ProductFamilyEditorInput = {
  brand_org_id: string;
  device_category_id: string;
  name: string;
  slug: string;
  description: string;
};

type DeviceCategoryEditorInput = {
  name: string;
  slug: string;
  description?: string;
};

type CatalogOptionSource =
  | "organizations"
  | "product-families"
  | "device-categories"
  | "chipsets"
  | "cpus"
  | "gpus"
  | "npus"
  | "modems"
  | "memory-standards"
  | "storage-standards"
  | "displays"
  | "cameras"
  | "batteries";

const optionalBooleanOptions: SelectOption[] = [
  { value: "", label: "Chưa xác minh" },
  { value: "true", label: "Có" },
  { value: "false", label: "Không" },
];

const wizardSteps = [
  { id: "general", label: "Thông tin chung", icon: Smartphone },
  { id: "model", label: "Biến thể", icon: LayoutTemplate },
  { id: "hardware", label: "Chipset", icon: Cpu },
  { id: "configuration", label: "Cấu hình", icon: MemoryStick },
  { id: "modules", label: "Màn hình & camera", icon: MonitorSmartphone },
  { id: "software", label: "Phần mềm", icon: ShieldCheck },
  { id: "media", label: "Media", icon: ImagePlus },
  { id: "commerce", label: "Nơi bán", icon: Store },
  { id: "review", label: "Mô tả & đăng", icon: Check },
] as const;

type WizardStep = (typeof wizardSteps)[number]["id"];
type ValidationIssue = {
  message: string;
  step: WizardStep;
};

type PublishCheck = {
  label: string;
  complete: boolean;
  step: WizardStep;
};

const defaultEditorialSections: EditorialSection[] = [
  { section_key: "highlights", title: "Điểm nổi bật", body_markdown: "" },
  {
    section_key: "design",
    title: "Thiết kế và trải nghiệm",
    body_markdown: "",
  },
  {
    section_key: "performance",
    title: "Hiệu năng và phần cứng",
    body_markdown: "",
  },
  {
    section_key: "experience",
    title: "Màn hình, âm thanh và tương tác",
    body_markdown: "",
  },
  {
    section_key: "battery",
    title: "Pin và kết nối",
    body_markdown: "",
  },
  {
    section_key: "software",
    title: "Phần mềm và hệ sinh thái",
    body_markdown: "",
  },
  {
    section_key: "limits",
    title: "Hạn chế và đối tượng phù hợp",
    body_markdown: "",
  },
];

const emptyPayload: WizardPayload = {
  general: {
    name: "",
    slug: "",
    product_family_id: "",
    release_status_id: "",
    summary: "",
  },
  model: {
    variant_name: "",
    sku_code: "",
    market_name: "",
    alias: "",
    internal_codename: "",
    generation_label: "",
    announcement_date: "",
    release_date: "",
    color_name: "",
    color_hex: "",
    launch_date: "",
    launch_price: "",
    currency_id: "",
  },
  hardware: {
    chipset_id: "",
    cpu_id: "",
    gpu_id: "",
    npu_id: "",
    modem_id: "",
  },
  configuration: {
    memory_standard_id: "",
    memory_capacity_options_gb: "",
    memory_speed_mhz: "",
    storage_standard_id: "",
    storage_capacity_options_gb: "",
    storage_expandable: "",
    storage_expansion_max_gb: "",
    height_mm: "",
    width_mm: "",
    thickness_mm: "",
    weight_g: "",
    frame_material: "",
    back_material: "",
    front_glass: "",
    ingress_protection: "",
    sim_slots: "",
    sim_type: "",
    esim_supported: "",
    stereo_speakers: "",
    headphone_jack: "",
    has_microsd_slot: "",
    has_ir_blaster: "",
    cooling_type: "",
    vc_area_mm2: "",
    has_active_cooling: "",
  },
  display: {
    technology: "",
    size_inch: "",
    aspect_ratio: "",
    resolution_width: "",
    resolution_height: "",
    pixel_density_ppi: "",
    refresh_rate_hz: "",
    refresh_rate_min_hz: "",
    ltpo_version: "",
    touch_sampling_hz: "",
    brightness_typical_nits: "",
    brightness_hbm_nits: "",
    brightness_peak_nits: "",
    color_gamut: "",
    hdr_formats: "",
    protection_glass: "",
    has_always_on: "",
    has_dc_dimming: "",
    pwm_frequency_hz: "",
  },
  camera: {
    rear_main: {
      effective_megapixel: "",
      aperture: "",
      focal_length_mm_eq: "",
      optical_zoom: "",
      field_of_view_deg: "",
      has_ois: "",
      has_eis: "",
      has_af: "",
      video_capabilities: "",
    },
    rear_ultrawide: {
      effective_megapixel: "",
      aperture: "",
      focal_length_mm_eq: "",
      optical_zoom: "",
      field_of_view_deg: "",
      has_ois: "",
      has_eis: "",
      has_af: "",
      video_capabilities: "",
    },
    rear_telephoto: {
      effective_megapixel: "",
      aperture: "",
      focal_length_mm_eq: "",
      optical_zoom: "",
      field_of_view_deg: "",
      has_ois: "",
      has_eis: "",
      has_af: "",
      video_capabilities: "",
    },
    front: {
      effective_megapixel: "",
      aperture: "",
      focal_length_mm_eq: "",
      optical_zoom: "",
      field_of_view_deg: "",
      has_ois: "",
      has_eis: "",
      has_af: "",
      video_capabilities: "",
    },
  },
  battery: {
    capacity_mah: "",
    energy_wh: "",
    wired_charging_w: "",
    wired_charging_protocol: "",
    wireless_charging_w: "",
    wireless_charging_protocol: "",
    removable: "",
  },
  software: {
    launch_os_version_id: "",
    current_os_version_id: "",
    highest_official_version_id: "",
    ui_layer_version_id: "",
    promised_major_updates: "",
    promised_security_years: "",
    security_patch_date: "",
    bootloader_status: "",
    root_status: "",
  },
  media: { cover_asset_id: "", cover_filename: "", cover_alt: "" },
  commerce: { links: [] },
  description: {
    summary: "",
    sections: defaultEditorialSections,
  },
};

function responseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }
  return [];
}

export function CatalogStudioWizard({
  accessToken,
  initialDraftId,
}: {
  accessToken: string;
  initialDraftId?: string;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WizardStep>("general");
  const [payload, setPayload] = useState<WizardPayload>(emptyPayload);
  const [draft, setDraft] = useState<CatalogDraft | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [autosaveState, setAutosaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [publishState, setPublishState] = useState<
    "idle" | "publishing" | "done" | "error"
  >("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const lastLinkedChipset = useRef("");
  const creatingDraft = useRef(false);
  const resumedInitialDraftId = useRef<string | null>(null);
  const formTopRef = useRef<HTMLElement>(null);

  const families = useQuery({
    queryKey: ["catalog-studio", "families"],
    queryFn: () => api.listProductFamilies({ page: 1, pageSize: 100 }),
  });
  const organizations = useQuery({
    queryKey: ["catalog-studio", "organizations"],
    queryFn: () =>
      api.listOrganizations({
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });
  const categories = useQuery({
    queryKey: ["catalog-studio", "device-categories"],
    queryFn: () =>
      api.listDeviceCategories({
        page: 1,
        pageSize: 100,
        sortBy: "display_order",
        sortOrder: "asc",
      }),
  });
  const releaseStatuses = useQuery({
    queryKey: ["catalog-studio", "release-statuses"],
    queryFn: () => api.listReleaseStatuses(),
  });
  const chipsets = useQuery({
    queryKey: ["catalog-studio", "chipsets"],
    queryFn: () => api.listChipsets({ page: 1, pageSize: 100 }),
  });
  const cpus = useQuery({
    queryKey: ["catalog-studio", "cpus"],
    queryFn: () => api.listHardwareCpus({ page: 1, pageSize: 100 }),
  });
  const gpus = useQuery({
    queryKey: ["catalog-studio", "gpus"],
    queryFn: () => api.listHardwareGpus({ page: 1, pageSize: 100 }),
  });
  const npus = useQuery({
    queryKey: ["catalog-studio", "npus"],
    queryFn: () => api.listHardwareNpus({ page: 1, pageSize: 100 }),
  });
  const modems = useQuery({
    queryKey: ["catalog-studio", "modems"],
    queryFn: () => api.listHardwareModems({ page: 1, pageSize: 100 }),
  });
  const memoryStandards = useQuery({
    queryKey: ["catalog-studio", "memory-standards"],
    queryFn: () => api.listMemoryStandards({ page: 1, pageSize: 100 }),
  });
  const storageStandards = useQuery({
    queryKey: ["catalog-studio", "storage-standards"],
    queryFn: () => api.listStorageStandards({ page: 1, pageSize: 100 }),
  });
  const operatingSystems = useQuery({
    queryKey: ["catalog-studio", "operating-systems"],
    queryFn: () => api.listOperatingSystems({ page: 1, pageSize: 100 }),
  });
  const operatingSystemVersions = useQuery({
    queryKey: ["catalog-studio", "operating-system-versions"],
    queryFn: () => api.listOperatingSystemVersions({ page: 1, pageSize: 100 }),
  });
  const osUiLayers = useQuery({
    queryKey: ["catalog-studio", "os-ui-layers"],
    queryFn: () => api.listOsUiLayers({ page: 1, pageSize: 100 }),
  });
  const osUiLayerVersions = useQuery({
    queryKey: ["catalog-studio", "os-ui-layer-versions"],
    queryFn: () => api.listOsUiLayerVersions({ page: 1, pageSize: 100 }),
  });
  const currencies = useQuery({
    queryKey: ["catalog-studio", "currencies"],
    queryFn: () => api.listCurrencies(),
  });
  const scoringProfiles = useQuery({
    queryKey: ["catalog-studio", "automatic-scoring-profiles"],
    queryFn: () => api.listScoringProfiles<ScoringProfile>(),
  });
  const affiliatePartners = useQuery({
    queryKey: ["catalog-studio", "affiliate-partners"],
    queryFn: () => api.listAffiliatePartners().then((result) => result.data),
  });
  const drafts = useQuery({
    queryKey: ["catalog-studio", "drafts"],
    queryFn: () => api.listCatalogDrafts(accessToken),
  });
  const draftHistory = useQuery({
    queryKey: ["catalog-studio", "draft-history", draft?.id],
    queryFn: () => api.listCatalogDraftHistory(draft!.id, accessToken),
    enabled: Boolean(draft?.id),
  });
  const deviceIdentityLookup = useDeferredValue(
    payload.general.name.trim() || payload.general.slug.trim(),
  );
  const deviceIdentitySearch = useQuery({
    queryKey: ["catalog-studio", "device-identity", deviceIdentityLookup],
    queryFn: () => api.smartSearchCatalog(deviceIdentityLookup, accessToken),
    enabled: deviceIdentityLookup.length >= 2,
    staleTime: 30_000,
  });
  const chipsetBundle = useQuery({
    queryKey: ["catalog-studio", "chipset-bundle", payload.hardware.chipset_id],
    queryFn: () =>
      api.getChipsetBundle<{
        suggested_links: {
          cpus: Array<{ id: string; name: string; is_primary: boolean }>;
          gpus: Array<{ id: string; name: string; is_primary: boolean }>;
          npus: Array<{ id: string; name: string; is_primary: boolean }>;
          modems: Array<{ id: string; name: string; is_primary: boolean }>;
        };
      }>(payload.hardware.chipset_id, accessToken),
    enabled: Boolean(payload.hardware.chipset_id),
  });
  const draftItems = responseArray<CatalogDraft>(drafts.data);
  const draftHistoryItems = responseArray<{
    revision: number;
  }>(draftHistory.data);

  const fingerprint = useMemo(() => JSON.stringify(payload), [payload]);
  const normalizedDeviceName = normalizeCatalogIdentity(payload.general.name);
  const normalizedDeviceSlug = payload.general.slug.trim().toLocaleLowerCase();
  const duplicateDevice = deviceIdentitySearch.data?.data.find(
    (model) =>
      (normalizedDeviceSlug &&
        model.slug.toLocaleLowerCase() === normalizedDeviceSlug) ||
      (normalizedDeviceName &&
        normalizeCatalogIdentity(model.name) === normalizedDeviceName),
  );
  const hasStarted = Boolean(
    payload.general.name ||
      payload.general.slug ||
      payload.general.product_family_id ||
      payload.model.market_name ||
      payload.model.sku_code,
  );
  const selectedFamily = (families.data?.data ?? []).find(
    (family) => family.id === payload.general.product_family_id,
  );
  const selectedScoringProfile = scoringProfiles.data?.find(
    (profile) => profile.categorySlug === selectedFamily?.device_category?.slug,
  );

  useEffect(() => {
    if (
      !chipsetBundle.data?.data ||
      !payload.hardware.chipset_id ||
      lastLinkedChipset.current === payload.hardware.chipset_id
    ) {
      return;
    }
    lastLinkedChipset.current = payload.hardware.chipset_id;
    const suggestions = chipsetBundle.data.data.suggested_links;
    setPayload((current) => ({
      ...current,
      hardware: {
        ...current.hardware,
        cpu_id:
          suggestions.cpus.find((item) => item.is_primary)?.id ??
          suggestions.cpus[0]?.id ??
          current.hardware.cpu_id,
        gpu_id:
          suggestions.gpus.find((item) => item.is_primary)?.id ??
          suggestions.gpus[0]?.id ??
          current.hardware.gpu_id,
        npu_id:
          suggestions.npus.find((item) => item.is_primary)?.id ??
          suggestions.npus[0]?.id ??
          current.hardware.npu_id,
        modem_id:
          suggestions.modems.find((item) => item.is_primary)?.id ??
          suggestions.modems[0]?.id ??
          current.hardware.modem_id,
      },
    }));
  }, [chipsetBundle.data, payload.hardware.chipset_id]);

  useEffect(() => {
    if (!hasStarted) return;
    if (draft && JSON.stringify(draft.payload) === fingerprint) return;
    const timer = window.setTimeout(async () => {
      try {
        setAutosaveState("saving");
        if (!draft) {
          if (creatingDraft.current) return;
          creatingDraft.current = true;
          const created = await api.createCatalogDraft(
            {
              draft_type: "device",
              title: payload.general.name || "Thiết bị chưa đặt tên",
              step_key: step,
              payload: payload as unknown as Record<string, unknown>,
            },
            accessToken,
          );
          setDraft(created);
          creatingDraft.current = false;
        } else {
          const saved = await api.updateCatalogDraft(
            draft.id,
            {
              expected_revision: draft.revision,
              title: payload.general.name || draft.title,
              step_key: step,
              payload: payload as unknown as Record<string, unknown>,
            },
            accessToken,
          );
          setDraft(saved);
        }
        setAutosaveState("saved");
        void queryClient.invalidateQueries({
          queryKey: ["catalog-studio", "drafts"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["catalog-studio", "draft-history", draft?.id],
        });
      } catch {
        creatingDraft.current = false;
        setAutosaveState("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [accessToken, draft, fingerprint, hasStarted, payload, queryClient, step]);

  const osVersionOptions = useMemo(() => {
    return (operatingSystemVersions.data?.data ?? []).map((version) => {
      const osName = version.operating_system.name.trim();
      const versionName = version.version_name.trim();
      const label = osName
        .toLocaleLowerCase()
        .endsWith(versionName.toLocaleLowerCase())
        ? osName
        : `${osName} ${versionName}`;
      return {
        value: version.id,
        label,
        meta: version.codename ?? undefined,
      };
    });
  }, [operatingSystemVersions.data]);
  const uiLayerOptions = useMemo(() => {
    return (osUiLayerVersions.data?.data ?? []).map((version) => ({
      value: version.id,
      label: `${version.ui_layer.name} ${version.version_name}`,
      meta: version.base_os_version
        ? `${version.base_os_version.operating_system.name} ${version.base_os_version.version_name}`
        : undefined,
    }));
  }, [osUiLayerVersions.data]);

  const currentStepIndex = wizardSteps.findIndex((item) => item.id === step);
  const localErrors = validateForPublish(payload, duplicateDevice);
  const publishChecks = getPublishChecks(payload);
  const completedPublishChecks = publishChecks.filter(
    (item) => item.complete,
  ).length;
  const stepCompletion = getWizardStepCompletion(payload, mediaFiles);

  const goToStep = (nextStep: WizardStep) => {
    setStep(nextStep);
    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const resumeDraft = (item: CatalogDraft) => {
    setDraft(item);
    setPayload(mergeDraftPayload(item.payload));
    const legacyStep =
      item.step_key === "display" ||
      item.step_key === "camera" ||
      item.step_key === "battery"
        ? "modules"
        : item.step_key;
    setStep(
      wizardSteps.some((candidate) => candidate.id === legacyStep)
        ? (legacyStep as WizardStep)
        : "general",
    );
    setPublishState("idle");
    setPublishMessage("");
  };

  const startFresh = () => {
    setDraft(null);
    setPayload(emptyPayload);
    setStep("general");
    setMediaFiles([]);
    setAutosaveState("idle");
    setPublishState("idle");
    setPublishMessage("");
  };

  useEffect(() => {
    if (!initialDraftId || resumedInitialDraftId.current === initialDraftId) {
      return;
    }
    const initialDraft = draftItems.find((item) => item.id === initialDraftId);
    if (!initialDraft || initialDraft.draft_type !== "device") return;
    resumedInitialDraftId.current = initialDraftId;
    resumeDraft(initialDraft);
  }, [draftItems, initialDraftId]);

  const restorePreviousRevision = async () => {
    if (!draft || !draftHistoryItems.length) return;
    const previous = draftHistoryItems.find(
      (item) => item.revision < draft.revision,
    );
    if (!previous) return;
    const restored = await api.restoreCatalogDraft(
      draft.id,
      draft.revision,
      previous.revision,
      accessToken,
    );
    setDraft(restored);
    setPayload(mergeDraftPayload(restored.payload));
    void draftHistory.refetch();
  };

  const uploadOrganizationLogo = async (
    organizationId: string,
    organizationName: string,
    logoFile: File,
  ) => {
    const upload = await api.createMediaUpload(
      {
        filename: logoFile.name,
        mime_type: logoFile.type,
        asset_type: "image",
        file_size_bytes: logoFile.size,
        entity_table: "organizations",
        entity_id: organizationId,
        role: "logo",
        alt_text: `Logo ${organizationName}`,
        is_primary: true,
      },
      accessToken,
    );
    const uploaded = await fetch(upload.data.upload_url, {
      method: "PUT",
      body: logoFile,
      headers: { "Content-Type": logoFile.type },
    });
    if (!uploaded.ok) {
      throw new Error(`Kho ảnh trả về mã ${uploaded.status}.`);
    }
    await api.completeMediaUpload(upload.data.id, undefined, accessToken);
    if (!upload.data.public_url) {
      throw new Error("Kho ảnh chưa có địa chỉ công khai để hiển thị logo.");
    }
    await api.updateOrganization(
      organizationId,
      { logo_url: upload.data.public_url },
      accessToken,
    );
    return upload.data.public_url;
  };

  const refreshOrganizations = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "organizations"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "families"],
      }),
    ]);

  const createOrganization = async (
    input: OrganizationEditorInput,
  ): Promise<OrganizationSaveResult> => {
    const { logo_file, ...organizationInput } = input;
    const created = await api.createOrganization(
      {
        ...organizationInput,
        is_active: true,
      },
      accessToken,
    );
    let logoWarning: string | null = null;
    let logoUrl = created.data.logo_url ?? null;
    if (logo_file) {
      try {
        logoUrl = await uploadOrganizationLogo(
          created.data.id,
          created.data.name,
          logo_file,
        );
      } catch (error) {
        logoWarning = readableError(error);
      }
    }
    await refreshOrganizations();
    return { id: created.data.id, logoWarning, logoUrl };
  };

  const updateOrganization = async (
    id: string,
    input: OrganizationEditorInput,
  ): Promise<OrganizationSaveResult> => {
    const { logo_file, ...organizationInput } = input;
    const updated = await api.updateOrganization(
      id,
      organizationInput,
      accessToken,
    );
    let logoWarning: string | null = null;
    let logoUrl = updated.data.logo_url ?? null;
    if (logo_file) {
      try {
        logoUrl = await uploadOrganizationLogo(
          id,
          updated.data.name,
          logo_file,
        );
      } catch (error) {
        logoWarning = readableError(error);
      }
    }
    await refreshOrganizations();
    return { id, logoWarning, logoUrl };
  };

  const deleteOrganization = async (id: string) => {
    await api.deleteOrganization(id, accessToken);
    await refreshOrganizations();
  };

  const createDeviceCategory = async (input: DeviceCategoryEditorInput) => {
    const created = await api.createDeviceCategory(
      {
        ...input,
        is_active: true,
      },
      accessToken,
    );
    await queryClient.invalidateQueries({
      queryKey: ["catalog-studio", "device-categories"],
    });
    return created.data.id;
  };

  const createProductFamily = async (input: ProductFamilyEditorInput) => {
    const created = await api.createProductFamily(
      {
        ...input,
        is_active: true,
      },
      accessToken,
    );
    setPayload((current) => ({
      ...current,
      general: {
        ...current.general,
        product_family_id: created.data.id,
      },
    }));
    await queryClient.invalidateQueries({
      queryKey: ["catalog-studio", "families"],
    });
    return created.data.id;
  };

  const updateProductFamily = async (
    id: string,
    input: ProductFamilyEditorInput,
  ) => {
    const updated = await api.updateProductFamily(id, input, accessToken);
    await queryClient.invalidateQueries({
      queryKey: ["catalog-studio", "families"],
    });
    return updated.data.id;
  };

  const deleteProductFamily = async (id: string) => {
    await api.deleteProductFamily(id, accessToken);
    setPayload((current) => ({
      ...current,
      general: {
        ...current.general,
        product_family_id:
          current.general.product_family_id === id
            ? ""
            : current.general.product_family_id,
      },
    }));
    await queryClient.invalidateQueries({
      queryKey: ["catalog-studio", "families"],
    });
  };

  const createOperatingSystemVersion = async (
    input: CreateOperatingSystemVersionInput,
  ): Promise<OperatingSystemVersionRecord> => {
    const created = await api.createOperatingSystemVersion(input, accessToken);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "operating-systems"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "operating-system-versions"],
      }),
    ]);
    setPayload((current) => ({
      ...current,
      software: {
        ...current.software,
        launch_os_version_id:
          current.software.launch_os_version_id || created.id,
        current_os_version_id:
          current.software.current_os_version_id || created.id,
        highest_official_version_id:
          current.software.highest_official_version_id || created.id,
      },
    }));
    return created;
  };

  const createOsUiLayerVersion = async (
    input: CreateOsUiLayerVersionInput,
  ): Promise<OsUiLayerVersionRecord> => {
    const created = await api.createOsUiLayerVersion(input, accessToken);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "os-ui-layers"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["catalog-studio", "os-ui-layer-versions"],
      }),
    ]);
    setPayload((current) => ({
      ...current,
      software: {
        ...current.software,
        ui_layer_version_id: created.id,
      },
    }));
    return created;
  };

  const publish = async () => {
    if (localErrors.length) {
      setPublishState("error");
      setPublishMessage(localErrors[0].message);
      return;
    }
    if (draft) {
      try {
        const evidence = await api.getCatalogEvidenceCoverage(
          { catalog_draft_id: draft.id },
          accessToken,
        );
        if (evidence.summary.conflicts) {
          setPublishState("error");
          setPublishMessage(
            `Còn ${evidence.summary.conflicts} claim xung đột. Hãy xử lý trong mục Bằng chứng trước khi xuất bản.`,
          );
          return;
        }
      } catch (error) {
        setPublishState("error");
        setPublishMessage(
          error instanceof Error
            ? error.message
            : "Không thể kiểm tra bằng chứng trước khi xuất bản.",
        );
        return;
      }
    }
    setPublishState("publishing");
    setPublishMessage("");
    try {
      const modelInput: CreateDeviceModelInput = {
        product_family_id: payload.general.product_family_id,
        name: payload.general.name.trim(),
        slug: payload.general.slug.trim(),
        release_status_id: Number(payload.general.release_status_id),
        internal_codename: optional(payload.model.internal_codename),
        generation_label: optional(payload.model.generation_label),
        announcement_date: optional(payload.model.announcement_date),
        release_date: optional(payload.model.release_date),
        summary:
          payload.description.summary.trim() || payload.general.summary.trim(),
        description: payload.description.sections
          .filter((section) => section.body_markdown.trim())
          .map(
            (section) =>
              `## ${section.title}\n\n${section.body_markdown.trim()}`,
          )
          .join("\n\n"),
        aliases: payload.model.alias.trim()
          ? [{ alias: payload.model.alias.trim(), alias_type: "marketing" }]
          : undefined,
        editorial_sections: payload.description.sections
          .filter((section) => section.body_markdown.trim())
          .map((section, index) => ({
            ...section,
            display_order: index,
            is_published: true,
          })),
      };
      const bundle = chipsetBundle.data?.data.suggested_links;
      const usesChipset = Boolean(payload.hardware.chipset_id);
      const variantName = hardwareVariantName(payload.model);
      const memoryCapacities = parseCapacityOptions(
        payload.configuration.memory_capacity_options_gb,
      );
      const storageCapacities = parseCapacityOptions(
        payload.configuration.storage_capacity_options_gb,
      );
      const variantInput: CreateDeviceBundleInput["variant"] = {
        variant_name: variantName,
        sku_code: optional(payload.model.sku_code),
        market_name: optional(payload.model.market_name),
        launch_date: optional(payload.model.launch_date),
        launch_price: optionalNumber(payload.model.launch_price),
        currency_id: optionalNumber(payload.model.currency_id),
        release_status_id: Number(payload.general.release_status_id),
        is_default: true,
        physical_specs: buildPhysicalSpecs(payload),
        io_specs: buildIoSpecs(payload),
        thermal_specs: buildThermalSpecs(payload),
        hardware_components: {
          chipsets: payload.hardware.chipset_id
            ? [{ module_id: payload.hardware.chipset_id }]
            : undefined,
          cpus:
            !usesChipset && payload.hardware.cpu_id
              ? [{ module_id: payload.hardware.cpu_id }]
              : !usesChipset && bundle?.cpus[0]
                ? [{ module_id: bundle.cpus[0].id }]
                : undefined,
          gpus:
            !usesChipset && payload.hardware.gpu_id
              ? [{ module_id: payload.hardware.gpu_id }]
              : undefined,
          npus:
            !usesChipset && payload.hardware.npu_id
              ? [{ module_id: payload.hardware.npu_id }]
              : undefined,
          modems:
            !usesChipset && payload.hardware.modem_id
              ? [{ module_id: payload.hardware.modem_id }]
              : undefined,
          memory:
            payload.configuration.memory_standard_id && memoryCapacities.length
              ? memoryCapacities.map((capacity_gb, index) => ({
                  memory_standard_id: payload.configuration.memory_standard_id,
                  capacity_gb,
                  is_primary: index === 0,
                }))
              : undefined,
          storage:
            payload.configuration.storage_standard_id &&
            storageCapacities.length
              ? storageCapacities.map((total_capacity_gb) => ({
                  storage_standard_id:
                    payload.configuration.storage_standard_id,
                  total_capacity_gb,
                  is_expandable: optionalBoolean(
                    payload.configuration.storage_expandable,
                  ),
                  expansion_max_gb: optionalNumber(
                    payload.configuration.storage_expansion_max_gb,
                  ),
                }))
              : undefined,
        },
        inline_modules: buildInlineHardwareModules(payload),
        software_profile: hasSoftwareData(payload)
          ? {
              launch_os_version_id: optional(
                payload.software.launch_os_version_id,
              ),
              current_os_version_id: optional(
                payload.software.current_os_version_id,
              ),
              highest_official_version_id: optional(
                payload.software.highest_official_version_id,
              ),
              ui_layer_version_id: optional(
                payload.software.ui_layer_version_id,
              ),
              security_patch_date: optional(
                payload.software.security_patch_date,
              ),
              promised_major_updates: optionalNumber(
                payload.software.promised_major_updates,
              ),
              promised_security_years: optionalNumber(
                payload.software.promised_security_years,
              ),
              bootloader_status: optional(
                payload.software.bootloader_status,
              ) as "locked" | "unlockable" | "unlocked" | undefined,
              root_status: optional(payload.software.root_status) as
                | "unknown"
                | "rootable"
                | "rooted"
                | undefined,
            }
          : undefined,
      };
      const created = await api.createDeviceBundle(
        { model: modelInput, variant: variantInput },
        accessToken,
      );
      const model = created.data.model;
      const variant = created.data.variant;

      const commerceFailures: string[] = [];
      for (const commerceLink of payload.commerce.links.filter((item) =>
        item.product_url.trim(),
      )) {
        const partner = affiliatePartners.data?.find(
          (item) => item.slug === commerceLink.partner_slug,
        );
        if (!partner) {
          commerceFailures.push(commerceLink.partner_slug);
          continue;
        }
        try {
          await api.createAffiliateLink(
            {
              partner_id: partner.id,
              device_variant_id: variant.id,
              product_url: commerceLink.product_url.trim(),
              region_code: "VN",
              currency_code: "VND",
            },
            accessToken,
          );
        } catch {
          commerceFailures.push(partner.name);
        }
      }

      const mediaFailures: string[] = [];
      let imageIndex = 0;
      let videoIndex = 0;
      for (const file of mediaFiles) {
        const isVideo = file.type.startsWith("video/");
        const role = isVideo
          ? videoIndex === 0
            ? "review"
            : "video"
          : imageIndex === 0
            ? "cover"
            : "gallery";
        try {
          const upload = await api.createMediaUpload(
            {
              filename: file.name,
              mime_type: file.type,
              asset_type: isVideo ? "video" : "image",
              file_size_bytes: file.size,
              entity_table: "device_models",
              entity_id: model.id,
              role,
              alt_text:
                !isVideo && imageIndex === 0
                  ? payload.media.cover_alt.trim() ||
                    payload.general.name.trim()
                  : undefined,
              is_primary: !isVideo && imageIndex === 0,
            },
            accessToken,
          );
          const uploaded = await fetch(upload.data.upload_url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (!uploaded.ok)
            throw new Error(`Storage trả về ${uploaded.status}`);
          await api.completeMediaUpload(upload.data.id, undefined, accessToken);
        } catch {
          mediaFailures.push(file.name);
        }
        if (isVideo) videoIndex += 1;
        else imageIndex += 1;
      }
      if (draft) {
        const completed = await api.completeCatalogDraft(
          draft.id,
          "device_models",
          model.id,
          accessToken,
        );
        setDraft(completed);
      }

      setPublishState("done");
      const warnings = [
        mediaFailures.length
          ? `${mediaFailures.length} tệp chưa upload được: ${mediaFailures.join(", ")}`
          : "",
        commerceFailures.length
          ? `chưa tạo được liên kết: ${commerceFailures.join(", ")}`
          : "",
      ].filter(Boolean);
      setPublishMessage(
        warnings.length
          ? `Đã xuất bản ${model.name}; ${warnings.join("; ")}.`
          : `Đã xuất bản ${model.name}, biến thể ${variantName}${variant.variant_scorecards?.[0] ? ` · score tự động ${Number(variant.variant_scorecards[0].overall_score).toFixed(1)}/100` : ""} và các liên kết nơi bán.`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "affiliate-links"],
      });
    } catch (error) {
      setPublishState("error");
      setPublishMessage(
        error instanceof Error
          ? error.message
          : "Không thể xuất bản thiết bị. Dữ liệu draft vẫn được giữ nguyên.",
      );
    }
  };
  const coverPreviewFile = mediaFiles.find((file) =>
    file.type.startsWith("image/"),
  );
  const intakeSource = quickIntakeSource(payload.provenance);

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Tạo thiết bị
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {currentStepIndex + 1}/{wizardSteps.length}
            </span>
            <AutosaveBadge state={autosaveState} revision={draft?.revision} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void restorePreviousRevision()}
              disabled={
                !draftHistoryItems.some(
                  (item) => item.revision < (draft?.revision ?? 0),
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={15} />
              Hoàn tác
            </button>
            <button
              type="button"
              onClick={startFresh}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white"
            >
              <FileText size={15} />
              Tạo mới
            </button>
          </div>
        </div>
        {intakeSource ? (
          <div className="border-t border-blue-100 bg-blue-50 px-4 py-2.5 text-xs leading-5 text-blue-900 sm:px-5">
            Nhập nhanh từ{" "}
            {intakeSource.url ? (
              <a
                href={intakeSource.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                {intakeSource.label}
              </a>
            ) : (
              <span className="font-semibold">{intakeSource.label}</span>
            )}
            . Kiểm tra lại các trường có nhãn “Cần kiểm tra” trước khi xuất bản.
          </div>
        ) : null}
        <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2.5">
          <div className="flex gap-1.5 overflow-x-auto">
            {wizardSteps.map((item) => {
              const Icon = item.icon;
              const active = item.id === step;
              const complete = stepCompletion[item.id];
              const hasIssue = localErrors.some(
                (issue) => issue.step === item.id,
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToStep(item.id)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex h-10 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-left transition ${
                    active
                      ? "border-blue-200 bg-white text-blue-700 shadow-sm"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-md ${
                      active
                        ? "bg-blue-600 text-white"
                        : complete
                          ? "bg-emerald-100 text-emerald-700"
                          : hasIssue
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200/70 text-slate-500"
                    }`}
                  >
                    {complete ? (
                      <Check size={13} />
                    ) : hasIssue ? (
                      <CircleAlert size={13} />
                    ) : (
                      <Icon size={13} />
                    )}
                  </span>
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main
          ref={formTopRef}
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {step === "general" ? (
            <GeneralStep
              payload={payload}
              onChange={setPayload}
              families={(families.data?.data ?? []).map((family) => ({
                value: family.id,
                label: family.name,
                meta: [family.brand_org?.name, family.device_category?.name]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              familyRecords={families.data?.data ?? []}
              organizations={(organizations.data?.data ?? []).map(
                (organization) => ({
                  value: organization.id,
                  label: organization.name,
                  meta: organization.short_name ?? organization.slug,
                }),
              )}
              organizationRecords={organizations.data?.data ?? []}
              categories={(categories.data?.data ?? []).map((category) => ({
                value: category.id,
                label: category.name,
                meta: category.slug,
              }))}
              statuses={(releaseStatuses.data ?? []).map((status) => ({
                value: String(status.id),
                label: status.name,
                meta: status.code,
              }))}
              onCreateOrganization={createOrganization}
              onUpdateOrganization={updateOrganization}
              onDeleteOrganization={deleteOrganization}
              onCreateCategory={createDeviceCategory}
              onCreateFamily={createProductFamily}
              onUpdateFamily={updateProductFamily}
              onDeleteFamily={deleteProductFamily}
              duplicateDevice={duplicateDevice}
              checkingIdentity={deviceIdentitySearch.isFetching}
            />
          ) : null}
          {step === "model" ? (
            <ModelStep
              payload={payload}
              onChange={setPayload}
              currencies={(currencies.data ?? []).map((currency) => ({
                value: String(currency.id),
                label: currency.code,
                meta: currency.symbol ?? undefined,
              }))}
            />
          ) : null}
          {step === "hardware" ? (
            <HardwareStep
              payload={payload}
              onChange={setPayload}
              chipsets={(chipsets.data?.data ?? []).map((chipset) => ({
                value: chipset.id,
                label: chipset.name,
                meta: [chipset.manufacturer?.name, chipset.process_node?.name]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              bundle={chipsetBundle.data?.data.suggested_links}
              loadingBundle={chipsetBundle.isLoading}
              componentOptions={{
                cpus: (cpus.data?.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  meta: item.manufacturer?.name,
                })),
                gpus: (gpus.data?.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  meta: item.manufacturer?.name,
                })),
                npus: (npus.data?.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  meta: item.manufacturer?.name,
                })),
                modems: (modems.data?.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  meta: item.manufacturer?.name,
                })),
              }}
            />
          ) : null}
          {step === "configuration" ? (
            <ConfigurationStep
              payload={payload}
              onChange={setPayload}
              memoryOptions={(memoryStandards.data?.data ?? []).map((item) => ({
                value: item.id,
                label: item.name,
                meta: [item.memory_type, item.generation]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              storageOptions={(storageStandards.data?.data ?? []).map(
                (item) => ({
                  value: item.id,
                  label: item.name,
                  meta: [item.storage_type, item.generation]
                    .filter(Boolean)
                    .join(" · "),
                }),
              )}
            />
          ) : null}
          {step === "modules" ? (
            <DeviceModulesStep payload={payload} onChange={setPayload} />
          ) : null}
          {step === "software" ? (
            <SoftwareStep
              payload={payload}
              onChange={setPayload}
              osVersions={osVersionOptions}
              uiLayers={uiLayerOptions}
              operatingSystems={(operatingSystems.data?.data ?? []).map(
                (item) => ({
                  value: item.id,
                  label: item.name,
                  meta: item.os_family,
                }),
              )}
              uiLayerDefinitions={(osUiLayers.data?.data ?? []).map((item) => ({
                value: item.id,
                label: item.name,
                meta: item.base_os?.name ?? item.slug,
              }))}
              onCreateOperatingSystemVersion={createOperatingSystemVersion}
              onCreateUiLayerVersion={createOsUiLayerVersion}
              loading={
                operatingSystems.isLoading ||
                operatingSystemVersions.isLoading ||
                osUiLayers.isLoading ||
                osUiLayerVersions.isLoading
              }
              error={
                operatingSystems.isError ||
                operatingSystemVersions.isError ||
                osUiLayers.isError ||
                osUiLayerVersions.isError
              }
            />
          ) : null}
          {step === "media" ? (
            <MediaStep
              payload={payload}
              onChange={setPayload}
              files={mediaFiles}
              onFiles={setMediaFiles}
            />
          ) : null}
          {step === "commerce" ? (
            <CommerceStep
              payload={payload}
              onChange={setPayload}
              partners={(affiliatePartners.data ?? []).filter(
                (partner) => partner.is_active && partner.is_trusted,
              )}
              accessToken={accessToken}
            />
          ) : null}
          {step === "review" ? (
            <ReviewStep
              payload={payload}
              onChange={setPayload}
              scoringProfile={selectedScoringProfile}
              errors={localErrors}
              publishState={publishState}
              publishMessage={publishMessage}
              onPublish={() => void publish()}
              onEditIssue={goToStep}
            />
          ) : null}

          <footer className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={() =>
                goToStep(wizardSteps[Math.max(0, currentStepIndex - 1)].id)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              <ArrowLeft size={15} />
              Quay lại
            </button>
            {step !== "review" ? (
              <button
                type="button"
                onClick={() =>
                  goToStep(
                    wizardSteps[
                      Math.min(wizardSteps.length - 1, currentStepIndex + 1)
                    ].id,
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {step !== "general" && step !== "model" && !stepCompletion[step]
                  ? "Bỏ qua: "
                  : "Tiếp tục: "}
                {wizardSteps[currentStepIndex + 1]?.label}
                <ArrowRight size={15} />
              </button>
            ) : null}
          </footer>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">
                Mức hoàn thiện
              </h3>
              <span className="text-xs font-semibold text-blue-700">
                {completedPublishChecks}/{publishChecks.length} điều kiện
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${(completedPublishChecks / publishChecks.length) * 100}%`,
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {publishChecks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => goToStep(item.step)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-0.5 text-left text-xs outline-none transition hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="text-slate-500">{item.label}</span>
                  <span
                    className={
                      item.complete ? "text-emerald-600" : "text-amber-600"
                    }
                  >
                    {item.complete ? (
                      <Check size={14} />
                    ) : (
                      <CircleAlert size={14} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {coverPreviewFile ? (
              <MediaFilePreview file={coverPreviewFile} />
            ) : (
              <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-slate-950 via-slate-800 to-blue-900 text-white">
                <div className="text-center">
                  <Smartphone className="mx-auto opacity-80" size={30} />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                    Xem trước
                  </p>
                </div>
              </div>
            )}
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-blue-600">
                {payload.model.market_name || "Thiết bị mới"}
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-950">
                {payload.general.name || "Tên thiết bị"}
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {hardwareVariantName(payload.model)}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-600">
                {payload.general.summary || "Chưa có tóm tắt."}
              </p>
            </div>
          </section>

          <DraftsPanel
            drafts={draftItems}
            activeId={draft?.id}
            onResume={resumeDraft}
          />
        </aside>
      </div>
    </div>
  );
}

function GeneralStep({
  payload,
  onChange,
  families,
  familyRecords,
  organizations,
  organizationRecords,
  categories,
  statuses,
  onCreateOrganization,
  onUpdateOrganization,
  onDeleteOrganization,
  onCreateCategory,
  onCreateFamily,
  onUpdateFamily,
  onDeleteFamily,
  duplicateDevice,
  checkingIdentity,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  families: SelectOption[];
  familyRecords: ProductFamily[];
  organizations: SelectOption[];
  organizationRecords: Organization[];
  categories: SelectOption[];
  statuses: SelectOption[];
  onCreateOrganization: (
    input: OrganizationEditorInput,
  ) => Promise<OrganizationSaveResult>;
  onUpdateOrganization: (
    id: string,
    input: OrganizationEditorInput,
  ) => Promise<OrganizationSaveResult>;
  onDeleteOrganization: (id: string) => Promise<void>;
  onCreateCategory: (input: DeviceCategoryEditorInput) => Promise<string>;
  onCreateFamily: (input: ProductFamilyEditorInput) => Promise<string>;
  onUpdateFamily: (
    id: string,
    input: ProductFamilyEditorInput,
  ) => Promise<string>;
  onDeleteFamily: (id: string) => Promise<void>;
  duplicateDevice?: DeviceDuplicateCandidate;
  checkingIdentity: boolean;
}) {
  const update = (key: keyof WizardPayload["general"], value: string) =>
    onChange((current) => ({
      ...current,
      general: { ...current.general, [key]: value },
      ...(key === "name"
        ? {
            media: {
              ...current.media,
              cover_alt: current.media.cover_alt
                ? current.media.cover_alt
                : value,
            },
          }
        : {}),
      ...(key === "summary"
        ? {
            description: {
              ...current.description,
              summary: value,
            },
          }
        : {}),
    }));
  return (
    <StepShell
      eyebrow="Bước 1"
      title="Thông tin chung"
      description="Xác định thiết bị duy nhất trước khi gắn phiên bản và module."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Tên thiết bị"
          required
          value={payload.general.name}
          onChange={(value) => {
            update("name", value);
            if (!payload.general.slug) {
              update("slug", slugify(value));
            }
          }}
          placeholder="Galaxy S26 Ultra"
        />
        <Field
          label="Slug"
          required
          value={payload.general.slug}
          onChange={(value) => update("slug", slugify(value))}
          placeholder="galaxy-s26-ultra"
        />
        <SearchSelect
          label="Dòng sản phẩm"
          source="product-families"
          required
          value={payload.general.product_family_id}
          onChange={(value) => update("product_family_id", value)}
          options={families}
          placeholder="Tìm hãng hoặc dòng sản phẩm"
        />
        <SearchSelect
          label="Trạng thái phát hành"
          required
          value={payload.general.release_status_id}
          onChange={(value) => update("release_status_id", value)}
          options={statuses}
          placeholder="Chọn trạng thái"
        />
      </div>
      {duplicateDevice ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div>
            <p className="text-sm font-semibold text-amber-950">
              “{duplicateDevice.name}” đã tồn tại
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Tên hoặc slug đang trùng với thiết bị trong catalog. Hãy mở bản
              hiện có để thêm phiên bản, hoặc đổi định danh cho thiết bị mới.
            </p>
          </div>
          <a
            href={`/devices/${duplicateDevice.slug}`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Mở thiết bị đã có
          </a>
        </div>
      ) : checkingIdentity && payload.general.name.trim().length >= 2 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Đang kiểm tra thiết bị trùng tên hoặc slug…
        </p>
      ) : null}
      <QuickCatalogSetup
        selectedFamilyId={payload.general.product_family_id}
        families={families}
        familyRecords={familyRecords}
        organizations={organizations}
        organizationRecords={organizationRecords}
        categories={categories}
        onCreateOrganization={onCreateOrganization}
        onUpdateOrganization={onUpdateOrganization}
        onDeleteOrganization={onDeleteOrganization}
        onCreateCategory={onCreateCategory}
        onCreateFamily={onCreateFamily}
        onUpdateFamily={onUpdateFamily}
        onDeleteFamily={onDeleteFamily}
        onFamilySelected={(familyId) => update("product_family_id", familyId)}
      />
      <TextArea
        label="Tóm tắt cho card"
        value={payload.general.summary}
        onChange={(value) => update("summary", value)}
        maxLength={600}
        minLength={80}
        rows={4}
        hint={`${payload.general.summary.trim().length}/80–600 ký tự`}
        required
      />
    </StepShell>
  );
}

function QuickCatalogSetup({
  selectedFamilyId,
  families,
  familyRecords,
  organizations,
  organizationRecords,
  categories,
  onCreateOrganization,
  onUpdateOrganization,
  onDeleteOrganization,
  onCreateCategory,
  onCreateFamily,
  onUpdateFamily,
  onDeleteFamily,
  onFamilySelected,
}: {
  selectedFamilyId: string;
  families: SelectOption[];
  familyRecords: ProductFamily[];
  organizations: SelectOption[];
  organizationRecords: Organization[];
  categories: SelectOption[];
  onCreateOrganization: (
    input: OrganizationEditorInput,
  ) => Promise<OrganizationSaveResult>;
  onUpdateOrganization: (
    id: string,
    input: OrganizationEditorInput,
  ) => Promise<OrganizationSaveResult>;
  onDeleteOrganization: (id: string) => Promise<void>;
  onCreateCategory: (input: DeviceCategoryEditorInput) => Promise<string>;
  onCreateFamily: (input: ProductFamilyEditorInput) => Promise<string>;
  onUpdateFamily: (
    id: string,
    input: ProductFamilyEditorInput,
  ) => Promise<string>;
  onDeleteFamily: (id: string) => Promise<void>;
  onFamilySelected: (familyId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [editingOrganizationId, setEditingOrganizationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [organizationShortName, setOrganizationShortName] = useState("");
  const [organizationDescription, setOrganizationDescription] = useState("");
  const [organizationLogoFile, setOrganizationLogoFile] = useState<File | null>(
    null,
  );
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState("");
  const [editingFamilyId, setEditingFamilyId] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [familySlug, setFamilySlug] = useState("");
  const [familyDescription, setFamilyDescription] = useState("");
  const [categoryCreatorOpen, setCategoryCreatorOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [saving, setSaving] = useState<
    | "organization"
    | "organization-delete"
    | "category"
    | "family"
    | "family-delete"
    | null
  >(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<
    "organization" | "family" | null
  >(null);
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const resetOrganizationForm = () => {
    setEditingOrganizationId("");
    setOrganizationId("");
    setOrganizationName("");
    setOrganizationSlug("");
    setOrganizationShortName("");
    setOrganizationDescription("");
    setOrganizationLogoFile(null);
    setOrganizationLogoUrl("");
    setDeleteConfirmation(null);
  };

  const populateOrganizationForm = (organization: Organization) => {
    setOrganizationId(organization.id);
    setEditingOrganizationId(organization.id);
    setOrganizationName(organization.name);
    setOrganizationSlug(organization.slug);
    setOrganizationShortName(organization.short_name ?? "");
    setOrganizationDescription(organization.description ?? "");
    setOrganizationLogoFile(null);
    setOrganizationLogoUrl(organization.logo_url ?? "");
  };

  const selectOrganization = async (id: string) => {
    setOrganizationId(id);
    setDeleteConfirmation(null);
    if (!id) {
      setEditingOrganizationId("");
      setOrganizationName("");
      setOrganizationSlug("");
      setOrganizationShortName("");
      setOrganizationDescription("");
      setOrganizationLogoFile(null);
      setOrganizationLogoUrl("");
      return;
    }
    setMessage(null);
    try {
      const organization =
        organizationRecords.find((item) => item.id === id) ??
        (await api.getOrganizationById(id)).data;
      populateOrganizationForm(organization);
    } catch (error) {
      setEditingOrganizationId("");
      setOrganizationId("");
      setMessage({ tone: "error", text: readableError(error) });
    }
  };

  const resetFamilyForm = () => {
    setEditingFamilyId("");
    setFamilyName("");
    setFamilySlug("");
    setFamilyDescription("");
    setCategoryId("");
    setDeleteConfirmation(null);
    onFamilySelected("");
  };

  const selectFamily = async (id: string) => {
    setDeleteConfirmation(null);
    if (!id) {
      resetFamilyForm();
      return;
    }
    setMessage(null);
    try {
      const family =
        familyRecords.find((item) => item.id === id) ??
        (await api.getProductFamilyById(id)).data;
      setEditingFamilyId(family.id);
      setFamilyName(family.name);
      setFamilySlug(family.slug);
      setFamilyDescription(family.description ?? "");
      setCategoryId(family.device_category_id ?? "");
      await selectOrganization(family.brand_org_id ?? "");
      onFamilySelected(family.id);
    } catch (error) {
      resetFamilyForm();
      setMessage({ tone: "error", text: readableError(error) });
    }
  };

  useEffect(() => {
    if (!selectedFamilyId || editingFamilyId === selectedFamilyId) return;
    let cancelled = false;
    void (async () => {
      try {
        const family =
          familyRecords.find((item) => item.id === selectedFamilyId) ??
          (await api.getProductFamilyById(selectedFamilyId)).data;
        const organization = family.brand_org_id
          ? (organizationRecords.find(
              (item) => item.id === family.brand_org_id,
            ) ?? (await api.getOrganizationById(family.brand_org_id)).data)
          : null;
        if (cancelled) return;
        setEditingFamilyId(family.id);
        setFamilyName(family.name);
        setFamilySlug(family.slug);
        setFamilyDescription(family.description ?? "");
        setCategoryId(family.device_category_id ?? "");
        setOrganizationId(family.brand_org_id ?? "");
        if (organization) {
          setEditingOrganizationId(organization.id);
          setOrganizationName(organization.name);
          setOrganizationSlug(organization.slug);
          setOrganizationShortName(organization.short_name ?? "");
          setOrganizationDescription(organization.description ?? "");
          setOrganizationLogoFile(null);
          setOrganizationLogoUrl(organization.logo_url ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({ tone: "error", text: readableError(error) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingFamilyId, familyRecords, organizationRecords, selectedFamilyId]);

  const createOrganizationInline = async () => {
    if (
      !organizationName.trim() ||
      !organizationSlug.trim() ||
      organizationDescription.trim().length < 80
    ) {
      return;
    }
    setSaving("organization");
    setMessage(null);
    try {
      const input = {
        name: organizationName.trim(),
        slug: slugify(organizationSlug),
        short_name: optional(organizationShortName),
        description: organizationDescription.trim(),
        logo_file: organizationLogoFile ?? undefined,
      };
      const wasEditing = Boolean(editingOrganizationId);
      const result = editingOrganizationId
        ? await onUpdateOrganization(editingOrganizationId, input)
        : await onCreateOrganization(input);
      setOrganizationId(result.id);
      setEditingOrganizationId(result.id);
      setOrganizationLogoFile(null);
      setOrganizationLogoUrl(result.logoUrl ?? organizationLogoUrl);
      setMessage({
        tone: result.logoWarning ? "warning" : "success",
        text: result.logoWarning
          ? `Đã ${wasEditing ? "cập nhật" : "tạo"} tổ chức, nhưng logo mới chưa được lưu. ${result.logoWarning}`
          : wasEditing
            ? "Đã lưu thay đổi của tổ chức."
            : `Đã tạo tổ chức${organizationLogoFile ? " và tải logo" : ""}; tổ chức này đã được chọn làm thương hiệu.`,
      });
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  const deleteOrganizationInline = async () => {
    if (!editingOrganizationId) return;
    setSaving("organization-delete");
    setMessage(null);
    try {
      await onDeleteOrganization(editingOrganizationId);
      resetOrganizationForm();
      setMessage({
        tone: "success",
        text: "Đã xóa tổ chức khỏi danh mục.",
      });
    } catch (error) {
      setDeleteConfirmation(null);
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  const createCategoryInline = async () => {
    const name = categoryName.trim();
    const slug = slugify(categorySlug);
    if (!name || !slug) return;

    const normalizedName = name.toLocaleLowerCase("vi");
    const duplicate = categories.find(
      (category) =>
        category.label.trim().toLocaleLowerCase("vi") === normalizedName ||
        category.meta === slug,
    );
    if (duplicate) {
      setCategoryId(duplicate.value);
      setCategoryName("");
      setCategorySlug("");
      setCategoryDescription("");
      setCategoryCreatorOpen(false);
      setMessage({
        tone: "warning",
        text: `Danh mục “${duplicate.label}” đã tồn tại và đã được chọn.`,
      });
      return;
    }

    setSaving("category");
    setMessage(null);
    try {
      const id = await onCreateCategory({
        name,
        slug,
        description: optional(categoryDescription),
      });
      setCategoryId(id);
      setCategoryName("");
      setCategorySlug("");
      setCategoryDescription("");
      setCategoryCreatorOpen(false);
      setMessage({
        tone: "success",
        text: `Đã tạo danh mục “${name}” và tự động chọn cho dòng sản phẩm.`,
      });
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  const createFamilyInline = async () => {
    if (
      !organizationId ||
      !categoryId ||
      !familyName.trim() ||
      !familySlug.trim() ||
      familyDescription.trim().length < 80
    ) {
      return;
    }
    setSaving("family");
    setMessage(null);
    try {
      const input = {
        brand_org_id: organizationId,
        device_category_id: categoryId,
        name: familyName.trim(),
        slug: slugify(familySlug),
        description: familyDescription.trim(),
      };
      const wasEditing = Boolean(editingFamilyId);
      const id = editingFamilyId
        ? await onUpdateFamily(editingFamilyId, input)
        : await onCreateFamily(input);
      setEditingFamilyId(id);
      onFamilySelected(id);
      setMessage({
        tone: "success",
        text: wasEditing
          ? "Đã lưu thay đổi của dòng sản phẩm."
          : "Đã tạo dòng sản phẩm và tự động chọn cho thiết bị.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  const deleteFamilyInline = async () => {
    if (!editingFamilyId) return;
    setSaving("family-delete");
    setMessage(null);
    try {
      await onDeleteFamily(editingFamilyId);
      resetFamilyForm();
      setMessage({
        tone: "success",
        text: "Đã xóa dòng sản phẩm khỏi danh mục.",
      });
    } catch (error) {
      setDeleteConfirmation(null);
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-dashed border-blue-200 bg-blue-50/40">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
            <PackagePlus size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Chưa có hãng hoặc dòng sản phẩm?
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Tạo ngay tại đây, không cần rời khỏi thiết bị đang nhập.
            </span>
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="grid gap-4 border-t border-blue-100 bg-white p-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Building2 size={17} className="text-blue-600" />
              <div>
                <h4 className="text-sm font-semibold text-slate-950">
                  1. Tổ chức / thương hiệu
                </h4>
                <p className="text-xs text-slate-500">
                  Chọn hãng đã có hoặc tạo một hãng mới.
                </p>
              </div>
            </div>
            <SearchSelect
              label="Tổ chức đã có"
              source="organizations"
              value={organizationId}
              onChange={(id) => void selectOrganization(id)}
              options={organizations}
              placeholder="Tìm tên hãng..."
            />
            {editingOrganizationId ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs font-semibold text-blue-800">
                  Đang sửa: {organizationName}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={resetOrganizationForm}
                    className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-white disabled:opacity-50"
                  >
                    Tạo mới
                  </button>
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => setDeleteConfirmation("organization")}
                    className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : null}
            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              {editingOrganizationId ? "Chỉnh sửa thông tin" : "Hoặc tạo mới"}
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid gap-3">
              <Field
                label="Tên tổ chức"
                value={organizationName}
                onChange={(value) => {
                  setOrganizationName(value);
                  if (!organizationSlug) setOrganizationSlug(slugify(value));
                }}
                placeholder="Samsung Electronics"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Tên ngắn"
                  value={organizationShortName}
                  onChange={setOrganizationShortName}
                  placeholder="Samsung"
                />
                <Field
                  label="Slug"
                  value={organizationSlug}
                  onChange={(value) => setOrganizationSlug(slugify(value))}
                  placeholder="samsung"
                />
              </div>
              <OrganizationLogoPicker
                file={organizationLogoFile}
                currentUrl={organizationLogoUrl}
                disabled={saving !== null}
                onChange={setOrganizationLogoFile}
              />
              <TextArea
                label="Mô tả tổ chức"
                value={organizationDescription}
                onChange={setOrganizationDescription}
                minLength={80}
                rows={4}
                hint={`${organizationDescription.trim().length}/80 ký tự tối thiểu · Lĩnh vực, vai trò, sản phẩm và công nghệ nổi bật.`}
                required
              />
              <button
                type="button"
                onClick={() => void createOrganizationInline()}
                disabled={
                  saving !== null ||
                  !organizationName.trim() ||
                  !organizationSlug.trim() ||
                  organizationDescription.trim().length < 80
                }
                className="app-button-secondary"
              >
                {saving === "organization" ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Building2 size={16} />
                )}
                {editingOrganizationId ? "Lưu thay đổi" : "Tạo tổ chức"}
              </button>
              {deleteConfirmation === "organization" ? (
                <DeleteConfirmation
                  title={`Xóa tổ chức “${organizationName}”?`}
                  description="Tổ chức sẽ ngừng hiển thị. Hệ thống sẽ từ chối nếu tổ chức vẫn đang được dùng bởi dòng sản phẩm."
                  pending={saving === "organization-delete"}
                  onCancel={() => setDeleteConfirmation(null)}
                  onConfirm={() => void deleteOrganizationInline()}
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <LayoutTemplate size={17} className="text-blue-600" />
              <div>
                <h4 className="text-sm font-semibold text-slate-950">
                  2. Dòng sản phẩm
                </h4>
                <p className="text-xs text-slate-500">
                  Gắn thương hiệu, danh mục và tên dòng máy.
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              <SearchSelect
                label="Dòng sản phẩm đã có"
                source="product-families"
                value={editingFamilyId}
                onChange={(id) => void selectFamily(id)}
                options={families}
                placeholder="Tìm hãng hoặc dòng sản phẩm..."
              />
              {editingFamilyId ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-xs font-semibold text-blue-800">
                    Đang sửa: {familyName}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={saving !== null}
                      onClick={resetFamilyForm}
                      className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-white disabled:opacity-50"
                    >
                      Tạo mới
                    </button>
                    <button
                      type="button"
                      disabled={saving !== null}
                      onClick={() => setDeleteConfirmation("family")}
                      className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : null}
              <SearchSelect
                label="Danh mục thiết bị"
                source="device-categories"
                value={categoryId}
                onChange={(id) => {
                  setCategoryId(id);
                  if (id) setCategoryCreatorOpen(false);
                }}
                options={categories}
                placeholder="Điện thoại, laptop, tablet..."
                required
              />
              <div className="-mt-1">
                <button
                  type="button"
                  aria-expanded={categoryCreatorOpen}
                  onClick={() => setCategoryCreatorOpen((current) => !current)}
                  disabled={saving !== null}
                  className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50"
                >
                  <Tag size={14} />
                  {categoryCreatorOpen
                    ? "Đóng phần tạo danh mục"
                    : "Tạo danh mục thiết bị mới"}
                </button>
              </div>
              {categoryCreatorOpen ? (
                <div className="grid gap-3 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Danh mục thiết bị mới
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Ví dụ: Điện thoại, Máy tính bảng, Laptop hoặc Đồng hồ
                      thông minh.
                    </p>
                  </div>
                  <Field
                    label="Tên danh mục"
                    value={categoryName}
                    onChange={(value) => {
                      setCategoryName(value);
                      if (!categorySlug) setCategorySlug(slugify(value));
                    }}
                    placeholder="Máy tính bảng"
                    required
                  />
                  <Field
                    label="Slug danh mục"
                    value={categorySlug}
                    onChange={(value) => setCategorySlug(slugify(value))}
                    placeholder="may-tinh-bang"
                    required
                  />
                  <TextArea
                    label="Mô tả danh mục"
                    value={categoryDescription}
                    onChange={setCategoryDescription}
                    rows={3}
                    hint="Không bắt buộc · Mô tả ngắn phạm vi thiết bị trong danh mục."
                  />
                  <button
                    type="button"
                    onClick={() => void createCategoryInline()}
                    disabled={
                      saving !== null ||
                      !categoryName.trim() ||
                      !categorySlug.trim()
                    }
                    className="app-button-secondary"
                  >
                    {saving === "category" ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <Tag size={16} />
                    )}
                    Tạo và chọn danh mục
                  </button>
                </div>
              ) : null}
              <Field
                label="Tên dòng sản phẩm"
                value={familyName}
                onChange={(value) => {
                  setFamilyName(value);
                  if (!familySlug) setFamilySlug(slugify(value));
                }}
                placeholder="Galaxy S Series"
                required
              />
              <Field
                label="Slug dòng sản phẩm"
                value={familySlug}
                onChange={(value) => setFamilySlug(slugify(value))}
                placeholder="galaxy-s-series"
                required
              />
              <TextArea
                label="Mô tả dòng sản phẩm"
                value={familyDescription}
                onChange={setFamilyDescription}
                minLength={80}
                rows={4}
                hint={`${familyDescription.trim().length}/80 ký tự tối thiểu · Định vị, người dùng, đặc điểm và phạm vi thế hệ.`}
                required
              />
              <button
                type="button"
                onClick={() => void createFamilyInline()}
                disabled={
                  saving !== null ||
                  !organizationId ||
                  !categoryId ||
                  !familyName.trim() ||
                  !familySlug.trim() ||
                  familyDescription.trim().length < 80
                }
                className="app-button-primary"
              >
                {saving === "family" ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <PackagePlus size={16} />
                )}
                {editingFamilyId
                  ? "Lưu thay đổi dòng sản phẩm"
                  : "Tạo và chọn dòng sản phẩm"}
              </button>
              {deleteConfirmation === "family" ? (
                <DeleteConfirmation
                  title={`Xóa dòng sản phẩm “${familyName}”?`}
                  description="Dòng sản phẩm sẽ ngừng hiển thị. Hệ thống sẽ từ chối nếu vẫn còn thiết bị thuộc dòng này."
                  pending={saving === "family-delete"}
                  onCancel={() => setDeleteConfirmation(null)}
                  onConfirm={() => void deleteFamilyInline()}
                />
              ) : null}
            </div>
          </div>

          {message ? (
            <p
              role="status"
              className={`rounded-lg px-3 py-2 text-sm lg:col-span-2 ${
                message.tone === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : message.tone === "warning"
                    ? "bg-amber-50 text-amber-900"
                    : "bg-rose-50 text-rose-800"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DeleteConfirmation({
  title,
  description,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-rose-200 bg-rose-50 p-3"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <CircleAlert size={16} className="mt-0.5 shrink-0 text-rose-700" />
        <div>
          <p className="text-sm font-semibold text-rose-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-rose-800">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          Xác nhận xóa
        </button>
      </div>
    </div>
  );
}

function ModelStep({
  payload,
  onChange,
  currencies,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  currencies: SelectOption[];
}) {
  const vndCurrencyId = currencies.find(
    (currency) => currency.label.toUpperCase() === "VND",
  )?.value;
  const update = (key: keyof WizardPayload["model"], value: string) =>
    onChange((current) => ({
      ...current,
      model: { ...current.model, [key]: value },
    }));
  return (
    <StepShell
      eyebrow="Bước 2"
      title="Biến thể phần cứng theo thị trường"
      description="Một thiết bị giữ nguyên tên model. Chỉ tạo biến thể mới khi mã máy, thị trường hoặc mô-đun phần cứng thực sự khác; RAM, bộ nhớ và màu sắc không tạo thêm biến thể."
    >
      <ModuleGroup title="Định danh biến thể phần cứng">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Thị trường / khu vực"
            value={payload.model.market_name}
            onChange={(value) => update("market_name", value)}
            placeholder="Hàn Quốc, Hoa Kỳ, Toàn cầu..."
            hint="Dùng tên thị trường phân phối phần cứng, không dùng marketing name."
          />
          <Field
            label="Mã model phần cứng"
            value={payload.model.sku_code}
            onChange={(value) => update("sku_code", value)}
            placeholder="SM-S931N"
            hint="Model number gốc của hãng; có thể dùng để phân biệt phần cứng theo thị trường."
          />
        </div>
        <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
            Tên biến thể được tạo tự động
          </p>
          <p className="mt-1 text-base font-semibold text-slate-950">
            {hardwareVariantName(payload.model)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ví dụ: Hàn Quốc · SM-S931N. Dung lượng RAM/bộ nhớ sẽ là các lựa chọn
            bên trong biến thể này, không nằm trong tên.
          </p>
        </div>
      </ModuleGroup>

      <ModuleGroup title="Thông tin chung của model">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Alias"
            value={payload.model.alias}
            onChange={(value) => update("alias", value)}
            placeholder="S26 Ultra 5G"
          />
          <Field
            label="Tên mã nội bộ"
            value={payload.model.internal_codename}
            onChange={(value) => update("internal_codename", value)}
            placeholder="Paradigm"
          />
          <Field
            label="Nhãn thế hệ"
            value={payload.model.generation_label}
            onChange={(value) => update("generation_label", value)}
            placeholder="2026 · Gen 8"
          />
          <Field
            label="Ngày công bố"
            type="date"
            value={payload.model.announcement_date}
            onChange={(value) => update("announcement_date", value)}
          />
          <Field
            label="Ngày phát hành"
            type="date"
            value={payload.model.release_date}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                model: {
                  ...current.model,
                  release_date: value,
                  launch_date: current.model.launch_date
                    ? current.model.launch_date
                    : value,
                },
              }))
            }
          />
        </div>
      </ModuleGroup>

      <ModuleGroup title="Mốc bán theo thị trường">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Ngày mở bán"
            type="date"
            value={payload.model.launch_date}
            onChange={(value) => update("launch_date", value)}
          />
          <Field
            label="Giá ra mắt"
            type="number"
            min="0"
            value={payload.model.launch_price}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                model: {
                  ...current.model,
                  launch_price: value,
                  currency_id:
                    value && !current.model.currency_id && vndCurrencyId
                      ? vndCurrencyId
                      : current.model.currency_id,
                },
              }))
            }
            placeholder="29990000"
          />
          <SearchSelect
            label="Đơn vị tiền tệ"
            value={payload.model.currency_id}
            onChange={(value) => update("currency_id", value)}
            options={currencies}
            placeholder="Tìm VND, USD..."
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Màu sắc và từng mức dung lượng là tùy chọn thương mại, không phải một
          biến thể phần cứng mới.
        </p>
      </ModuleGroup>
    </StepShell>
  );
}

function HardwareStep({
  payload,
  onChange,
  chipsets,
  bundle,
  loadingBundle,
  componentOptions,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  chipsets: SelectOption[];
  bundle?: {
    cpus: Array<{ id: string; name: string }>;
    gpus: Array<{ id: string; name: string }>;
    npus: Array<{ id: string; name: string }>;
    modems: Array<{ id: string; name: string }>;
  };
  loadingBundle: boolean;
  componentOptions: {
    cpus: SelectOption[];
    gpus: SelectOption[];
    npus: SelectOption[];
    modems: SelectOption[];
  };
}) {
  const update = (key: keyof WizardPayload["hardware"], value: string) =>
    onChange((current) => ({
      ...current,
      hardware: { ...current.hardware, [key]: value },
    }));
  return (
    <StepShell
      eyebrow="Bước 3"
      title="Chipset và smart linking"
      description="Chọn SoC một lần; CPU, GPU, NPU và modem đã có sẽ được nối tự động."
    >
      <SearchSelect
        label="Chipset / SoC"
        source="chipsets"
        value={payload.hardware.chipset_id}
        onChange={(value) => {
          lastSelectionReset(onChange, value);
        }}
        options={chipsets}
        placeholder="Tìm Snapdragon, Apple, MediaTek..."
      />
      {loadingBundle ? (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
          <LoaderCircle className="animate-spin" size={16} />
          Đang tìm thành phần liên quan…
        </div>
      ) : bundle ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <Sparkles size={14} />
          CPU, GPU, NPU và modem sẽ được kế thừa từ quan hệ của chipset.
        </p>
      ) : null}
      {!payload.hardware.chipset_id ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchSelect
              label="CPU"
              source="cpus"
              value={payload.hardware.cpu_id}
              onChange={(value) => update("cpu_id", value)}
              options={componentOptions.cpus}
              placeholder="Tìm CPU..."
            />
            <SearchSelect
              label="GPU"
              source="gpus"
              value={payload.hardware.gpu_id}
              onChange={(value) => update("gpu_id", value)}
              options={componentOptions.gpus}
              placeholder="Tìm GPU..."
            />
            <SearchSelect
              label="NPU / AI accelerator"
              source="npus"
              value={payload.hardware.npu_id}
              onChange={(value) => update("npu_id", value)}
              options={componentOptions.npus}
              placeholder="Tìm NPU..."
            />
            <SearchSelect
              label="Modem"
              source="modems"
              value={payload.hardware.modem_id}
              onChange={(value) => update("modem_id", value)}
              options={componentOptions.modems}
              placeholder="Tìm modem..."
            />
          </div>
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs leading-5 text-slate-500">
            Gán trực tiếp CPU, GPU, NPU và modem chỉ khi thiết bị không dùng một
            SoC đã có trong catalog.
          </p>
        </>
      ) : null}
    </StepShell>
  );
}

function ConfigurationStep({
  payload,
  onChange,
  memoryOptions,
  storageOptions,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  memoryOptions: SelectOption[];
  storageOptions: SelectOption[];
}) {
  const update = (key: keyof WizardPayload["configuration"], value: string) =>
    onChange((current) => ({
      ...current,
      configuration: { ...current.configuration, [key]: value },
    }));

  return (
    <StepShell
      eyebrow="Bước 4"
      title="Cấu hình, thân máy và kết nối"
      description="Các nhóm thường bị thiếu đã được gom vào một bước; chỉ nhập phần bạn có dữ liệu xác minh."
    >
      <ModuleGroup title="Chuẩn và các tùy chọn dung lượng">
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
          Nhập tất cả mức dung lượng dùng chung một cấu hình phần cứng. Hệ thống
          sẽ lưu thành nhiều tùy chọn trong cùng biến thể, không tạo thêm thiết
          bị hay biến thể chỉ vì khác RAM/bộ nhớ.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SearchSelect
            label="Chuẩn RAM"
            source="memory-standards"
            value={payload.configuration.memory_standard_id}
            onChange={(value) => update("memory_standard_id", value)}
            options={memoryOptions}
            placeholder="Tìm LPDDR5X, DDR5..."
          />
          <Field
            label="Các mức RAM (GB)"
            value={payload.configuration.memory_capacity_options_gb}
            onChange={(value) => update("memory_capacity_options_gb", value)}
            placeholder="8, 12, 16"
            hint="Phân tách bằng dấu phẩy; hệ thống tự loại trùng và sắp xếp."
          />
          <SearchSelect
            label="Chuẩn bộ nhớ trong"
            source="storage-standards"
            value={payload.configuration.storage_standard_id}
            onChange={(value) => update("storage_standard_id", value)}
            options={storageOptions}
            placeholder="Tìm UFS 4.0, NVMe..."
          />
          <Field
            label="Các mức lưu trữ (GB)"
            value={payload.configuration.storage_capacity_options_gb}
            onChange={(value) => update("storage_capacity_options_gb", value)}
            placeholder="128, 256, 512"
            hint="Đây là danh sách tùy chọn, không dùng để đặt tên biến thể."
          />
          <NativeSelect
            label="Có thể mở rộng bộ nhớ"
            value={payload.configuration.storage_expandable}
            onChange={(value) => update("storage_expandable", value)}
            options={optionalBooleanOptions}
          />
          {payload.configuration.storage_expandable === "true" ? (
            <Field
              label="Dung lượng mở rộng tối đa (GB)"
              type="number"
              min="1"
              value={payload.configuration.storage_expansion_max_gb}
              onChange={(value) => update("storage_expansion_max_gb", value)}
              placeholder="2048"
            />
          ) : null}
        </div>
      </ModuleGroup>

      <ModuleGroup title="Kích thước và vật liệu">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field
            label="Cao (mm)"
            type="number"
            min="0"
            value={payload.configuration.height_mm}
            onChange={(value) => update("height_mm", value)}
          />
          <Field
            label="Rộng (mm)"
            type="number"
            min="0"
            value={payload.configuration.width_mm}
            onChange={(value) => update("width_mm", value)}
          />
          <Field
            label="Dày (mm)"
            type="number"
            min="0"
            value={payload.configuration.thickness_mm}
            onChange={(value) => update("thickness_mm", value)}
          />
          <Field
            label="Khối lượng (g)"
            type="number"
            min="0"
            value={payload.configuration.weight_g}
            onChange={(value) => update("weight_g", value)}
          />
          <Field
            label="Vật liệu khung"
            value={payload.configuration.frame_material}
            onChange={(value) => update("frame_material", value)}
            placeholder="Titanium"
          />
          <Field
            label="Vật liệu mặt lưng"
            value={payload.configuration.back_material}
            onChange={(value) => update("back_material", value)}
            placeholder="Kính mờ"
          />
          <Field
            label="Kính mặt trước"
            value={payload.configuration.front_glass}
            onChange={(value) => update("front_glass", value)}
            placeholder="Gorilla Armor 2"
          />
          <Field
            label="Kháng nước / bụi"
            value={payload.configuration.ingress_protection}
            onChange={(value) => update("ingress_protection", value)}
            placeholder="IP68"
          />
        </div>
      </ModuleGroup>

      <ModuleGroup title="SIM, âm thanh và tản nhiệt">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Số khe SIM"
            type="number"
            min="0"
            value={payload.configuration.sim_slots}
            onChange={(value) => update("sim_slots", value)}
            placeholder="2"
          />
          <Field
            label="Loại SIM"
            value={payload.configuration.sim_type}
            onChange={(value) => update("sim_type", value)}
            placeholder="Nano-SIM"
          />
          <NativeSelect
            label="Hỗ trợ eSIM"
            value={payload.configuration.esim_supported}
            onChange={(value) => update("esim_supported", value)}
            options={optionalBooleanOptions}
          />
          <NativeSelect
            label="Loa stereo"
            value={payload.configuration.stereo_speakers}
            onChange={(value) => update("stereo_speakers", value)}
            options={optionalBooleanOptions}
          />
          <NativeSelect
            label="Jack tai nghe"
            value={payload.configuration.headphone_jack}
            onChange={(value) => update("headphone_jack", value)}
            options={optionalBooleanOptions}
          />
          <NativeSelect
            label="Khe thẻ nhớ"
            value={payload.configuration.has_microsd_slot}
            onChange={(value) => update("has_microsd_slot", value)}
            options={optionalBooleanOptions}
          />
          <NativeSelect
            label="Cổng hồng ngoại"
            value={payload.configuration.has_ir_blaster}
            onChange={(value) => update("has_ir_blaster", value)}
            options={optionalBooleanOptions}
          />
          <Field
            label="Kiểu tản nhiệt"
            value={payload.configuration.cooling_type}
            onChange={(value) => update("cooling_type", value)}
            placeholder="Vapor chamber"
          />
          <Field
            label="Diện tích buồng hơi (mm²)"
            type="number"
            min="0"
            value={payload.configuration.vc_area_mm2}
            onChange={(value) => update("vc_area_mm2", value)}
          />
          <NativeSelect
            label="Tản nhiệt chủ động"
            value={payload.configuration.has_active_cooling}
            onChange={(value) => update("has_active_cooling", value)}
            options={optionalBooleanOptions}
          />
        </div>
      </ModuleGroup>
    </StepShell>
  );
}

function DeviceModulesStep({
  payload,
  onChange,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
}) {
  const updateDisplay = (key: keyof InlineDisplayForm, value: string) =>
    onChange((current) => ({
      ...current,
      display: { ...current.display, [key]: value },
    }));
  const updateCamera = (
    cameraKey: keyof WizardPayload["camera"],
    field: keyof InlineCameraForm,
    value: string,
  ) =>
    onChange((current) => ({
      ...current,
      camera: {
        ...current.camera,
        [cameraKey]: { ...current.camera[cameraKey], [field]: value },
      },
    }));
  const updateBattery = (key: keyof InlineBatteryForm, value: string) =>
    onChange((current) => ({
      ...current,
      battery: { ...current.battery, [key]: value },
    }));
  return (
    <StepShell
      eyebrow="Bước 5"
      title="Màn hình, camera và pin"
      description="Nhập thông số trực tiếp cho thiết bị. Khi đăng, hệ thống tự tạo và liên kết các module chuẩn hóa ở phía sau."
    >
      <div className="space-y-5">
        <ModuleGroup title="Màn hình chính">
          <div className="mb-3 flex items-center gap-2 text-xs leading-5 text-slate-500">
            <MonitorSmartphone size={15} className="text-blue-600" />
            Điền những thông số đã xác minh; chỉ công nghệ màn hình là bắt buộc
            khi nhóm này có dữ liệu.
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Công nghệ màn hình"
              required={Object.values(payload.display).some(Boolean)}
              value={payload.display.technology}
              onChange={(value) => updateDisplay("technology", value)}
              placeholder="LTPO OLED, AMOLED, IPS LCD…"
            />
            <Field
              label="Kích thước (inch)"
              type="number"
              min="0"
              value={payload.display.size_inch}
              onChange={(value) => updateDisplay("size_inch", value)}
              placeholder="6.7"
            />
            <Field
              label="Tỷ lệ khung hình"
              value={payload.display.aspect_ratio}
              onChange={(value) => updateDisplay("aspect_ratio", value)}
              placeholder="19.5:9"
            />
            <Field
              label="Độ phân giải ngang (px)"
              type="number"
              min="0"
              value={payload.display.resolution_width}
              onChange={(value) => updateDisplay("resolution_width", value)}
              placeholder="1440"
            />
            <Field
              label="Độ phân giải dọc (px)"
              type="number"
              min="0"
              value={payload.display.resolution_height}
              onChange={(value) => updateDisplay("resolution_height", value)}
              placeholder="3120"
            />
            <Field
              label="Mật độ điểm ảnh (ppi)"
              type="number"
              min="0"
              value={payload.display.pixel_density_ppi}
              onChange={(value) => updateDisplay("pixel_density_ppi", value)}
            />
            <Field
              label="Tần số quét tối đa (Hz)"
              type="number"
              min="0"
              value={payload.display.refresh_rate_hz}
              onChange={(value) => updateDisplay("refresh_rate_hz", value)}
              placeholder="120"
            />
            <Field
              label="Tần số quét tối thiểu (Hz)"
              type="number"
              min="0"
              value={payload.display.refresh_rate_min_hz}
              onChange={(value) => updateDisplay("refresh_rate_min_hz", value)}
              placeholder="1"
            />
            <Field
              label="Tần số cảm ứng (Hz)"
              type="number"
              min="0"
              value={payload.display.touch_sampling_hz}
              onChange={(value) => updateDisplay("touch_sampling_hz", value)}
            />
            <Field
              label="Độ sáng thường (nit)"
              type="number"
              min="0"
              value={payload.display.brightness_typical_nits}
              onChange={(value) =>
                updateDisplay("brightness_typical_nits", value)
              }
            />
            <Field
              label="Độ sáng HBM (nit)"
              type="number"
              min="0"
              value={payload.display.brightness_hbm_nits}
              onChange={(value) => updateDisplay("brightness_hbm_nits", value)}
            />
            <Field
              label="Độ sáng đỉnh (nit)"
              type="number"
              min="0"
              value={payload.display.brightness_peak_nits}
              onChange={(value) => updateDisplay("brightness_peak_nits", value)}
            />
            <Field
              label="Phiên bản LTPO"
              value={payload.display.ltpo_version}
              onChange={(value) => updateDisplay("ltpo_version", value)}
              placeholder="LTPO 3.0"
            />
            <Field
              label="Chuẩn HDR"
              value={payload.display.hdr_formats}
              onChange={(value) => updateDisplay("hdr_formats", value)}
              placeholder="HDR10+, Dolby Vision"
            />
            <Field
              label="Dải màu"
              value={payload.display.color_gamut}
              onChange={(value) => updateDisplay("color_gamut", value)}
              placeholder="DCI-P3"
            />
            <Field
              label="Tần số PWM (Hz)"
              type="number"
              min="0"
              value={payload.display.pwm_frequency_hz}
              onChange={(value) => updateDisplay("pwm_frequency_hz", value)}
            />
            <Field
              label="Kính bảo vệ"
              value={payload.display.protection_glass}
              onChange={(value) => updateDisplay("protection_glass", value)}
              placeholder="Gorilla Glass Victus 2"
            />
            <NativeSelect
              label="Always-on display"
              value={payload.display.has_always_on}
              onChange={(value) => updateDisplay("has_always_on", value)}
              options={optionalBooleanOptions}
            />
            <NativeSelect
              label="DC dimming"
              value={payload.display.has_dc_dimming}
              onChange={(value) => updateDisplay("has_dc_dimming", value)}
              options={optionalBooleanOptions}
            />
          </div>
        </ModuleGroup>

        <ModuleGroup title="Hệ thống camera">
          <div className="mb-3 flex items-center gap-2 text-xs leading-5 text-slate-500">
            <Camera size={15} className="text-blue-600" />
            Mỗi camera là một nhóm thông số riêng; có thể bỏ trống vai trò không
            được trang bị.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CameraInlineEditor
              title="Camera sau chính"
              value={payload.camera.rear_main}
              onChange={(field, value) =>
                updateCamera("rear_main", field, value)
              }
            />
            <CameraInlineEditor
              title="Camera góc siêu rộng"
              value={payload.camera.rear_ultrawide}
              onChange={(field, value) =>
                updateCamera("rear_ultrawide", field, value)
              }
            />
            <CameraInlineEditor
              title="Camera tele / tiềm vọng"
              value={payload.camera.rear_telephoto}
              onChange={(field, value) =>
                updateCamera("rear_telephoto", field, value)
              }
            />
            <CameraInlineEditor
              title="Camera trước"
              value={payload.camera.front}
              onChange={(field, value) => updateCamera("front", field, value)}
            />
          </div>
        </ModuleGroup>

        <ModuleGroup title="Pin và sạc">
          <div className="mb-3 flex items-center gap-2 text-xs leading-5 text-slate-500">
            <BatteryCharging size={15} className="text-blue-600" />
            Nhập dung lượng và công suất sạc trực tiếp cho phiên bản này.
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Dung lượng pin (mAh)"
              required={Object.values(payload.battery).some(Boolean)}
              type="number"
              min="1"
              value={payload.battery.capacity_mah}
              onChange={(value) => updateBattery("capacity_mah", value)}
              placeholder="5000"
            />
            <Field
              label="Năng lượng (Wh)"
              type="number"
              min="0"
              value={payload.battery.energy_wh}
              onChange={(value) => updateBattery("energy_wh", value)}
            />
            <Field
              label="Sạc có dây (W)"
              type="number"
              min="0"
              value={payload.battery.wired_charging_w}
              onChange={(value) => updateBattery("wired_charging_w", value)}
            />
            <Field
              label="Chuẩn sạc có dây"
              value={payload.battery.wired_charging_protocol}
              onChange={(value) =>
                updateBattery("wired_charging_protocol", value)
              }
              placeholder="USB PD PPS"
            />
            <Field
              label="Sạc không dây (W)"
              type="number"
              min="0"
              value={payload.battery.wireless_charging_w}
              onChange={(value) => updateBattery("wireless_charging_w", value)}
            />
            <Field
              label="Chuẩn sạc không dây"
              value={payload.battery.wireless_charging_protocol}
              onChange={(value) =>
                updateBattery("wireless_charging_protocol", value)
              }
              placeholder="Qi2"
            />
            <NativeSelect
              label="Pin tháo rời"
              value={payload.battery.removable}
              onChange={(value) => updateBattery("removable", value)}
              options={optionalBooleanOptions}
            />
          </div>
        </ModuleGroup>
      </div>
    </StepShell>
  );
}

function CameraInlineEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: InlineCameraForm;
  onChange: (field: keyof InlineCameraForm, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h4 className="mb-4 text-sm font-semibold text-slate-950">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Độ phân giải (MP)"
          type="number"
          min="0"
          value={value.effective_megapixel}
          onChange={(next) => onChange("effective_megapixel", next)}
          placeholder="50"
        />
        <Field
          label="Khẩu độ"
          value={value.aperture}
          onChange={(next) => onChange("aperture", next)}
          placeholder="f/1.8"
        />
        <Field
          label="Tiêu cự quy đổi (mm)"
          type="number"
          min="0"
          value={value.focal_length_mm_eq}
          onChange={(next) => onChange("focal_length_mm_eq", next)}
          placeholder="24"
        />
        <Field
          label="Zoom quang học (x)"
          type="number"
          min="0"
          value={value.optical_zoom}
          onChange={(next) => onChange("optical_zoom", next)}
        />
        <Field
          label="Góc nhìn (độ)"
          type="number"
          min="0"
          value={value.field_of_view_deg}
          onChange={(next) => onChange("field_of_view_deg", next)}
        />
        <Field
          label="Khả năng quay video"
          value={value.video_capabilities}
          onChange={(next) => onChange("video_capabilities", next)}
          placeholder="4K 60fps, 8K 30fps"
        />
        <NativeSelect
          label="OIS"
          value={value.has_ois}
          onChange={(next) => onChange("has_ois", next)}
          options={optionalBooleanOptions}
        />
        <NativeSelect
          label="EIS"
          value={value.has_eis}
          onChange={(next) => onChange("has_eis", next)}
          options={optionalBooleanOptions}
        />
        <NativeSelect
          label="Tự động lấy nét"
          value={value.has_af}
          onChange={(next) => onChange("has_af", next)}
          options={optionalBooleanOptions}
        />
      </div>
    </div>
  );
}

function SoftwareStep({
  payload,
  onChange,
  osVersions,
  uiLayers,
  operatingSystems,
  uiLayerDefinitions,
  onCreateOperatingSystemVersion,
  onCreateUiLayerVersion,
  loading,
  error,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  osVersions: SelectOption[];
  uiLayers: SelectOption[];
  operatingSystems: SelectOption[];
  uiLayerDefinitions: SelectOption[];
  onCreateOperatingSystemVersion: (
    input: CreateOperatingSystemVersionInput,
  ) => Promise<OperatingSystemVersionRecord>;
  onCreateUiLayerVersion: (
    input: CreateOsUiLayerVersionInput,
  ) => Promise<OsUiLayerVersionRecord>;
  loading: boolean;
  error: boolean;
}) {
  const [catalogCreatorOpen, setCatalogCreatorOpen] = useState(false);
  const update = (key: keyof WizardPayload["software"], value: string) =>
    onChange((current) => ({
      ...current,
      software: { ...current.software, [key]: value },
    }));
  return (
    <StepShell
      eyebrow="Bước 6"
      title="Phần mềm và chính sách cập nhật"
      description="Tách rõ phiên bản lúc bán, hiện tại và mức nâng cấp chính thức cao nhất."
    >
      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <LoaderCircle size={16} className="animate-spin" />
          Đang tải phiên bản hệ điều hành và giao diện…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <CircleAlert size={16} />
          Không thể tải dữ liệu phần mềm. Hãy tải lại trang hoặc kiểm tra kết
          nối API.
        </div>
      ) : osVersions.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <CircleAlert size={16} />
            Chưa có phiên bản hệ điều hành cụ thể để lựa chọn.
          </span>
          <button
            type="button"
            onClick={() => setCatalogCreatorOpen(true)}
            className="h-9 shrink-0 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Tạo phiên bản đầu tiên
          </button>
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Danh mục hệ điều hành
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Tạo Android, iOS và các phiên bản giao diện ngay trong luồng nhập
              thiết bị.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCatalogCreatorOpen((current) => !current)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
            aria-expanded={catalogCreatorOpen}
          >
            <PackagePlus size={15} />
            {catalogCreatorOpen ? "Đóng phần tạo" : "Tạo mục hệ điều hành"}
          </button>
        </div>
        {catalogCreatorOpen ? (
          <SoftwareCatalogCreator
            operatingSystems={operatingSystems}
            osVersions={osVersions}
            uiLayerDefinitions={uiLayerDefinitions}
            onCreateOperatingSystemVersion={onCreateOperatingSystemVersion}
            onCreateUiLayerVersion={onCreateUiLayerVersion}
          />
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SearchSelect
          label="Hệ điều hành khi ra mắt"
          value={payload.software.launch_os_version_id}
          onChange={(value) => update("launch_os_version_id", value)}
          options={osVersions}
          placeholder="Chọn phiên bản hệ điều hành"
        />
        <SearchSelect
          label="Hệ điều hành hiện tại"
          value={payload.software.current_os_version_id}
          onChange={(value) => update("current_os_version_id", value)}
          options={osVersions}
          placeholder="Chọn phiên bản hiện tại"
        />
        <SearchSelect
          label="Phiên bản chính thức cao nhất"
          value={payload.software.highest_official_version_id}
          onChange={(value) => update("highest_official_version_id", value)}
          options={osVersions}
          placeholder="Chọn mức hỗ trợ cao nhất"
        />
        <SearchSelect
          label="Giao diện / UI layer"
          value={payload.software.ui_layer_version_id}
          onChange={(value) => update("ui_layer_version_id", value)}
          options={uiLayers}
          placeholder="Tìm One UI, HyperOS, ColorOS…"
        />
        <NativeSelect
          label="Bootloader"
          value={payload.software.bootloader_status}
          onChange={(value) => update("bootloader_status", value)}
          options={[
            { value: "", label: "Chưa xác minh" },
            { value: "locked", label: "Locked" },
            { value: "unlockable", label: "Unlockable" },
            { value: "unlocked", label: "Unlocked" },
          ]}
        />
        <NativeSelect
          label="Root"
          value={payload.software.root_status}
          onChange={(value) => update("root_status", value)}
          options={[
            { value: "", label: "Chưa xác minh" },
            { value: "unknown", label: "Không rõ" },
            { value: "rootable", label: "Có thể root" },
            { value: "rooted", label: "Đã root" },
          ]}
        />
        <Field
          label="Số bản nâng cấp OS"
          type="number"
          min="0"
          value={payload.software.promised_major_updates}
          onChange={(value) => update("promised_major_updates", value)}
        />
        <Field
          label="Số năm cập nhật bảo mật"
          type="number"
          min="0"
          value={payload.software.promised_security_years}
          onChange={(value) => update("promised_security_years", value)}
        />
        <Field
          label="Bản vá bảo mật gần nhất"
          type="date"
          value={payload.software.security_patch_date}
          onChange={(value) => update("security_patch_date", value)}
        />
      </div>
    </StepShell>
  );
}

function SoftwareCatalogCreator({
  operatingSystems,
  osVersions,
  uiLayerDefinitions,
  onCreateOperatingSystemVersion,
  onCreateUiLayerVersion,
}: {
  operatingSystems: SelectOption[];
  osVersions: SelectOption[];
  uiLayerDefinitions: SelectOption[];
  onCreateOperatingSystemVersion: (
    input: CreateOperatingSystemVersionInput,
  ) => Promise<OperatingSystemVersionRecord>;
  onCreateUiLayerVersion: (
    input: CreateOsUiLayerVersionInput,
  ) => Promise<OsUiLayerVersionRecord>;
}) {
  const [catalogKind, setCatalogKind] = useState<"os" | "ui">("os");
  const [saving, setSaving] = useState<"os" | "ui" | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [osForm, setOsForm] = useState({
    operating_system_id: "",
    name: "",
    slug: "",
    os_family: "",
    version_name: "",
    codename: "",
    release_date: "",
    api_level: "",
  });
  const [uiForm, setUiForm] = useState({
    ui_layer_id: "",
    name: "",
    slug: "",
    base_os_id: "",
    version_name: "",
    base_os_version_id: "",
    release_date: "",
  });

  const canSaveOs = Boolean(
    osForm.version_name.trim() &&
      (osForm.operating_system_id ||
        (osForm.name.trim() && osForm.slug.trim() && osForm.os_family.trim())),
  );
  const canSaveUi = Boolean(
    uiForm.version_name.trim() &&
      (uiForm.ui_layer_id || (uiForm.name.trim() && uiForm.slug.trim())),
  );

  const saveOperatingSystemVersion = async () => {
    if (!canSaveOs) return;
    setSaving("os");
    setMessage(null);
    try {
      const created = await onCreateOperatingSystemVersion({
        operating_system_id: optional(osForm.operating_system_id),
        operating_system: osForm.operating_system_id
          ? undefined
          : {
              name: osForm.name.trim(),
              slug: osForm.slug.trim(),
              os_family: osForm.os_family.trim(),
            },
        version_name: osForm.version_name.trim(),
        codename: optional(osForm.codename),
        release_date: optional(osForm.release_date),
        api_level: optionalNumber(osForm.api_level),
      });
      setOsForm((current) => ({
        ...current,
        operating_system_id: created.operating_system.id,
        name: "",
        slug: "",
        os_family: "",
        version_name: "",
        codename: "",
        release_date: "",
        api_level: "",
      }));
      setMessage({
        tone: "success",
        text: `Đã tạo ${created.operating_system.name} ${created.version_name} và tự động chọn cho các mốc OS còn trống.`,
      });
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  const saveUiLayerVersion = async () => {
    if (!canSaveUi) return;
    setSaving("ui");
    setMessage(null);
    try {
      const created = await onCreateUiLayerVersion({
        ui_layer_id: optional(uiForm.ui_layer_id),
        ui_layer: uiForm.ui_layer_id
          ? undefined
          : {
              name: uiForm.name.trim(),
              slug: uiForm.slug.trim(),
              base_os_id: optional(uiForm.base_os_id),
            },
        version_name: uiForm.version_name.trim(),
        base_os_version_id: optional(uiForm.base_os_version_id),
        release_date: optional(uiForm.release_date),
      });
      setUiForm((current) => ({
        ...current,
        ui_layer_id: created.ui_layer.id,
        name: "",
        slug: "",
        version_name: "",
        base_os_version_id: "",
        release_date: "",
      }));
      setMessage({
        tone: "success",
        text: `Đã tạo ${created.ui_layer.name} ${created.version_name} và tự động chọn cho thiết bị.`,
      });
    } catch (error) {
      setMessage({ tone: "error", text: readableError(error) });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setCatalogKind("os");
            setMessage(null);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            catalogKind === "os"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Phiên bản hệ điều hành
        </button>
        <button
          type="button"
          onClick={() => {
            setCatalogKind("ui");
            setMessage(null);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            catalogKind === "ui"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Phiên bản giao diện
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {catalogKind === "os" ? (
          <>
            <div>
              <h4 className="text-sm font-semibold text-slate-950">
                Tạo bản phát hành OS
              </h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Chọn Android, iOS đã có. Nếu chưa có, để trống và nhập hệ điều
                hành gốc mới bên dưới.
              </p>
            </div>
            <SearchSelect
              label="Hệ điều hành gốc đã có"
              value={osForm.operating_system_id}
              onChange={(operating_system_id) =>
                setOsForm((current) => ({
                  ...current,
                  operating_system_id,
                }))
              }
              options={operatingSystems}
              placeholder="Tìm Android, iOS, Windows…"
            />
            {!osForm.operating_system_id ? (
              <div className="grid gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 md:grid-cols-3">
                <Field
                  label="Tên hệ điều hành gốc"
                  required
                  value={osForm.name}
                  onChange={(name) =>
                    setOsForm((current) => ({
                      ...current,
                      name,
                      slug:
                        !current.slug || current.slug === slugify(current.name)
                          ? slugify(name)
                          : current.slug,
                    }))
                  }
                  placeholder="Android"
                />
                <Field
                  label="Slug"
                  required
                  value={osForm.slug}
                  onChange={(slug) =>
                    setOsForm((current) => ({
                      ...current,
                      slug: slugify(slug),
                    }))
                  }
                  placeholder="android"
                />
                <Field
                  label="Họ hệ điều hành"
                  required
                  value={osForm.os_family}
                  onChange={(os_family) =>
                    setOsForm((current) => ({ ...current, os_family }))
                  }
                  placeholder="android"
                />
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Tên phiên bản"
                required
                value={osForm.version_name}
                onChange={(version_name) =>
                  setOsForm((current) => ({ ...current, version_name }))
                }
                placeholder="16"
              />
              <Field
                label="Codename"
                value={osForm.codename}
                onChange={(codename) =>
                  setOsForm((current) => ({ ...current, codename }))
                }
                placeholder="Baklava"
              />
              <Field
                label="Ngày phát hành"
                type="date"
                value={osForm.release_date}
                onChange={(release_date) =>
                  setOsForm((current) => ({ ...current, release_date }))
                }
              />
              <Field
                label="API level"
                type="number"
                min="1"
                value={osForm.api_level}
                onChange={(api_level) =>
                  setOsForm((current) => ({ ...current, api_level }))
                }
                placeholder="36"
              />
            </div>
            <button
              type="button"
              onClick={() => void saveOperatingSystemVersion()}
              disabled={!canSaveOs || saving !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving === "os" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving === "os" ? "Đang tạo phiên bản…" : "Tạo phiên bản OS"}
            </button>
          </>
        ) : (
          <>
            <div>
              <h4 className="text-sm font-semibold text-slate-950">
                Tạo bản phát hành giao diện
              </h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Chọn One UI, HyperOS, ColorOS đã có hoặc tạo dòng giao diện mới.
              </p>
            </div>
            <SearchSelect
              label="Dòng giao diện đã có"
              value={uiForm.ui_layer_id}
              onChange={(ui_layer_id) =>
                setUiForm((current) => ({ ...current, ui_layer_id }))
              }
              options={uiLayerDefinitions}
              placeholder="Tìm One UI, HyperOS, ColorOS…"
            />
            {!uiForm.ui_layer_id ? (
              <div className="grid gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 md:grid-cols-3">
                <Field
                  label="Tên dòng giao diện"
                  required
                  value={uiForm.name}
                  onChange={(name) =>
                    setUiForm((current) => ({
                      ...current,
                      name,
                      slug:
                        !current.slug || current.slug === slugify(current.name)
                          ? slugify(name)
                          : current.slug,
                    }))
                  }
                  placeholder="One UI"
                />
                <Field
                  label="Slug"
                  required
                  value={uiForm.slug}
                  onChange={(slug) =>
                    setUiForm((current) => ({
                      ...current,
                      slug: slugify(slug),
                    }))
                  }
                  placeholder="one-ui"
                />
                <SearchSelect
                  label="Hệ điều hành nền"
                  value={uiForm.base_os_id}
                  onChange={(base_os_id) =>
                    setUiForm((current) => ({ ...current, base_os_id }))
                  }
                  options={operatingSystems}
                  placeholder="Android, nếu có"
                />
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="Tên phiên bản giao diện"
                required
                value={uiForm.version_name}
                onChange={(version_name) =>
                  setUiForm((current) => ({ ...current, version_name }))
                }
                placeholder="8.0"
              />
              <SearchSelect
                label="Phiên bản OS nền"
                value={uiForm.base_os_version_id}
                onChange={(base_os_version_id) =>
                  setUiForm((current) => ({
                    ...current,
                    base_os_version_id,
                  }))
                }
                options={osVersions}
                placeholder="Android 16, nếu có"
              />
              <Field
                label="Ngày phát hành"
                type="date"
                value={uiForm.release_date}
                onChange={(release_date) =>
                  setUiForm((current) => ({ ...current, release_date }))
                }
              />
            </div>
            <button
              type="button"
              onClick={() => void saveUiLayerVersion()}
              disabled={!canSaveUi || saving !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving === "ui" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving === "ui"
                ? "Đang tạo giao diện…"
                : "Tạo phiên bản giao diện"}
            </button>
          </>
        )}

        {message ? (
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              message.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MediaStep({
  payload,
  onChange,
  files,
  onFiles,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const imageCount = files.filter((file) =>
    file.type.startsWith("image/"),
  ).length;
  const videoCount = files.filter((file) =>
    file.type.startsWith("video/"),
  ).length;

  const syncFiles = (next: File[]) => {
    onFiles(next);
    const cover = next.find((file) => file.type.startsWith("image/"));
    onChange((current) => ({
      ...current,
      media: {
        ...current.media,
        cover_filename: cover?.name ?? "",
      },
    }));
  };

  const addFiles = (selected: File[]) => {
    const accepted: File[] = [];
    const rejected: string[] = [];
    const knownFiles = new Set(
      files.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
    );
    for (const file of selected) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const tooLarge =
        (isImage && file.size > 25 * 1024 * 1024) ||
        (isVideo && file.size > 2 * 1024 * 1024 * 1024);
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if ((!isImage && !isVideo) || tooLarge) {
        rejected.push(file.name);
      } else if (!knownFiles.has(key)) {
        knownFiles.add(key);
        accepted.push(file);
      }
    }
    if (accepted.length) syncFiles([...files, ...accepted]);
    setValidationMessage(
      rejected.length
        ? `Không thể thêm ${rejected.join(", ")}. Kiểm tra định dạng hoặc dung lượng tệp.`
        : "",
    );
  };

  const makeCover = (fileIndex: number) => {
    const target = files[fileIndex];
    if (!target?.type.startsWith("image/")) return;
    const next = files.filter((_, index) => index !== fileIndex);
    const firstImageIndex = next.findIndex((file) =>
      file.type.startsWith("image/"),
    );
    next.splice(
      firstImageIndex >= 0 ? firstImageIndex : next.length,
      0,
      target,
    );
    syncFiles(next);
  };

  return (
    <StepShell
      eyebrow="Bước 7"
      title="Ảnh và video thiết bị"
      description="Xem trước ngay trước khi xuất bản. Ảnh đầu tiên là cover; video đầu tiên là video review."
    >
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
        className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50"
        }`}
      >
        <span className="grid size-12 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
          <UploadCloud size={22} />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-950">
          Kéo thả ảnh hoặc video vào đây
        </p>
        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
          Ảnh JPG, PNG, WebP tối đa 25 MB. Video MP4, WebM hoặc định dạng được
          trình duyệt hỗ trợ tối đa 2 GB.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <label className="app-button-secondary cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <ImagePlus size={16} />
            Thêm ảnh
          </label>
          <label className="app-button-primary cursor-pointer">
            <input
              type="file"
              accept="video/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <Play size={16} />
            Upload video
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
          {imageCount} ảnh
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
          {videoCount} video
        </span>
        {imageCount ? (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
            Cover: {payload.media.cover_filename}
          </span>
        ) : null}
      </div>

      {validationMessage ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {validationMessage}
        </p>
      ) : null}

      {files.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file, index) => {
            const isVideo = file.type.startsWith("video/");
            const imagePosition = files
              .slice(0, index + 1)
              .filter((item) => item.type.startsWith("image/")).length;
            const role = isVideo
              ? files
                  .slice(0, index + 1)
                  .filter((item) => item.type.startsWith("video/")).length === 1
                ? "Video review"
                : "Video"
              : imagePosition === 1
                ? "Cover"
                : "Gallery";
            return (
              <article
                key={`${file.name}-${file.lastModified}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <MediaFilePreview file={file} />
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {role} · {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!isVideo && imagePosition !== 1 ? (
                      <button
                        type="button"
                        aria-label={`Đặt ${file.name} làm ảnh bìa`}
                        title="Đặt làm ảnh bìa"
                        onClick={() => makeCover(index)}
                        className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <BadgeCheck size={16} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Bỏ ${file.name}`}
                      onClick={() =>
                        syncFiles(
                          files.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      <Field
        label="Alt text"
        value={payload.media.cover_alt}
        onChange={(cover_alt) =>
          onChange((current) => ({
            ...current,
            media: { ...current.media, cover_alt },
          }))
        }
        placeholder="Mô tả hình ảnh để hỗ trợ accessibility"
      />
    </StepShell>
  );
}

function MediaFilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  if (!url) {
    return <div className="aspect-video animate-pulse bg-slate-100" />;
  }
  if (file.type.startsWith("video/")) {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-slate-950 object-contain"
      />
    );
  }
  return (
    // Blob previews are local-only and intentionally bypass Next image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="aspect-video w-full bg-slate-100 object-contain"
    />
  );
}

const ORGANIZATION_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const ORGANIZATION_LOGO_MAX_BYTES = 8 * 1024 * 1024;

function OrganizationLogoPicker({
  file,
  currentUrl,
  disabled,
  onChange,
}: {
  file: File | null;
  currentUrl?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const displayUrl = previewUrl || currentUrl || "";

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
          {displayUrl ? (
            // Preview URLs can be local blobs or administrator-managed storage URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt="Xem trước logo tổ chức"
              className="size-full object-contain p-2"
            />
          ) : (
            <Building2 size={22} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Ảnh đại diện / logo
          </p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            JPG, PNG, WebP hoặc SVG · tối đa 8 MB
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label
              className={`app-button-secondary ${
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              <ImagePlus size={15} />
              {file ? "Đổi ảnh" : "Chọn ảnh"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                className="sr-only"
                disabled={disabled}
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (!selected) return;
                  if (!ORGANIZATION_LOGO_TYPES.has(selected.type)) {
                    setValidationMessage(
                      "Hãy chọn ảnh JPG, PNG, WebP hoặc SVG.",
                    );
                    return;
                  }
                  if (selected.size > ORGANIZATION_LOGO_MAX_BYTES) {
                    setValidationMessage(
                      "Ảnh vượt quá dung lượng tối đa 8 MB.",
                    );
                    return;
                  }
                  setValidationMessage("");
                  onChange(selected);
                }}
              />
            </label>
            {file ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setValidationMessage("");
                  onChange(null);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Bỏ ảnh
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {file ? (
        <p className="mt-2 truncate text-xs text-slate-600">
          {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      ) : currentUrl ? (
        <p className="mt-2 truncate text-xs text-slate-600">
          Đang dùng logo đã lưu. Chọn ảnh mới để thay thế.
        </p>
      ) : null}
      {validationMessage ? (
        <p className="mt-2 text-xs text-rose-700" role="alert">
          {validationMessage}
        </p>
      ) : null}
    </div>
  );
}

function CommerceStep({
  payload,
  onChange,
  partners,
  accessToken,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  partners: AffiliatePartner[];
  accessToken: string;
}) {
  const [previews, setPreviews] = useState<
    Record<
      string,
      {
        state: "checking" | "ready" | "error";
        data?: AffiliateOfferPreview;
        message?: string;
      }
    >
  >({});

  const updatePartnerLink = (partnerSlug: string, productUrl: string) => {
    onChange((current) => {
      const remaining = current.commerce.links.filter(
        (item) => item.partner_slug !== partnerSlug,
      );
      return {
        ...current,
        commerce: {
          links: productUrl
            ? [
                ...remaining,
                { partner_slug: partnerSlug, product_url: productUrl },
              ]
            : remaining,
        },
      };
    });
    setPreviews((current) => {
      const next = { ...current };
      delete next[partnerSlug];
      return next;
    });
  };

  const inspectPartnerLink = async (partner: AffiliatePartner) => {
    const productUrl =
      payload.commerce.links.find((item) => item.partner_slug === partner.slug)
        ?.product_url ?? "";
    setPreviews((current) => ({
      ...current,
      [partner.slug]: { state: "checking" },
    }));
    try {
      const result = await api.inspectAffiliateOffer(
        { partner_id: partner.id, product_url: productUrl.trim() },
        accessToken,
      );
      setPreviews((current) => ({
        ...current,
        [partner.slug]: { state: "ready", data: result.data },
      }));
    } catch (error) {
      setPreviews((current) => ({
        ...current,
        [partner.slug]: {
          state: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể đọc dữ liệu từ liên kết này.",
        },
      }));
    }
  };

  return (
    <StepShell
      eyebrow="Bước 8"
      title="Liên kết từ đối tác uy tín"
      description="Dán trang sản phẩm của từng nơi bán. SpecHub sẽ đọc ảnh, giá, giá gốc, mức giảm và tình trạng hàng; liên kết này không bắt buộc để xuất bản thiết bị."
    >
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-950">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm">
            <BadgeCheck size={16} />
          </span>
          <div>
            <p className="font-semibold">Cách đồng bộ an toàn</p>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              Dữ liệu được đọc khi kiểm tra hoặc xuất bản rồi lưu lại. Trang
              thiết bị sử dụng bản chụp gần nhất, không gọi website đối tác mỗi
              lần khách truy cập.
            </p>
          </div>
        </div>
      </div>

      {partners.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {partners.map((partner) => {
            const productUrl =
              payload.commerce.links.find(
                (item) => item.partner_slug === partner.slug,
              )?.product_url ?? "";
            const validDomain = matchesPartnerDomain(
              productUrl,
              partner.base_url,
            );
            const preview = previews[partner.slug];
            const offer = preview?.data?.offer;
            return (
              <article
                key={partner.id}
                className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                      <Store size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold text-slate-950">
                          {partner.name}
                        </h4>
                        <BadgeCheck
                          aria-label="Đối tác uy tín"
                          className="shrink-0 text-blue-600"
                          size={15}
                        />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {partner.description ?? partner.base_url}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                    Đã xác minh
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <Field
                    label="Link bán sản phẩm"
                    type="url"
                    value={productUrl}
                    onChange={(value) =>
                      updatePartnerLink(partner.slug, value.trim())
                    }
                    placeholder={`${partner.base_url}/...`}
                  />
                  {productUrl && !validDomain ? (
                    <p className="text-xs leading-5 text-rose-700">
                      Liên kết phải thuộc tên miền {partner.base_url}.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void inspectPartnerLink(partner)}
                    disabled={
                      !productUrl ||
                      !validDomain ||
                      preview?.state === "checking"
                    }
                    className="app-button-secondary h-10 w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {preview?.state === "checking" ? (
                      <LoaderCircle className="animate-spin" size={15} />
                    ) : (
                      <Search size={15} />
                    )}
                    {preview?.state === "checking"
                      ? "Đang đọc ảnh và giá…"
                      : "Kiểm tra liên kết"}
                  </button>

                  {preview?.state === "error" ? (
                    <p
                      role="alert"
                      className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
                    >
                      {preview.message} Bạn vẫn có thể lưu liên kết và đồng bộ
                      lại sau.
                    </p>
                  ) : null}

                  {preview?.state === "ready" && offer ? (
                    <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                      <div className="grid h-[72px] place-items-center overflow-hidden rounded-lg bg-white">
                        {offer.imageUrl ? (
                          // Product images come from the verified partner URL.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={offer.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="size-full object-contain"
                          />
                        ) : (
                          <Store size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-900">
                          {offer.productTitle ?? "Sản phẩm đã nhận diện"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <strong className="text-sm text-rose-600">
                            {formatCommercePrice(offer.price, offer.currency)}
                          </strong>
                          {offer.originalPrice &&
                          offer.originalPrice > offer.price ? (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCommercePrice(
                                offer.originalPrice,
                                offer.currency,
                              )}
                            </span>
                          ) : null}
                          {offer.discountPercent ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                              <Tag size={9} />-
                              {Math.round(offer.discountPercent)}%
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[10px] text-emerald-700">
                          {offer.availabilityLabel ??
                            (offer.inStock ? "Còn hàng" : "Hết hàng")}{" "}
                          · Đã đọc thành công
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm leading-6 text-slate-600">
          Chưa tải được danh sách đối tác uy tín. Hãy áp dụng migration mới hoặc
          mở mục “Đối tác” để kiểm tra CellphoneS và FPT Shop.
        </div>
      )}
    </StepShell>
  );
}

function ReviewStep({
  payload,
  onChange,
  scoringProfile,
  errors,
  publishState,
  publishMessage,
  onPublish,
  onEditIssue,
}: {
  payload: WizardPayload;
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>;
  scoringProfile?: ScoringProfile;
  errors: ValidationIssue[];
  publishState: "idle" | "publishing" | "done" | "error";
  publishMessage: string;
  onPublish: () => void;
  onEditIssue: (step: WizardStep) => void;
}) {
  const completedSectionCount = payload.description.sections.filter((section) =>
    section.body_markdown.trim(),
  ).length;

  return (
    <StepShell
      eyebrow="Bước 9"
      title="Nội dung, preview và publish"
      description="Viết bài đầy đủ; card chỉ lấy phần tóm tắt ở trên."
    >
      <TextArea
        label="Tóm tắt"
        value={payload.description.summary}
        onChange={(summary) =>
          onChange((current) => ({
            ...current,
            general: { ...current.general, summary },
            description: { ...current.description, summary },
          }))
        }
        rows={4}
        minLength={80}
        maxLength={600}
        hint={`${payload.description.summary.trim().length}/80–600 ký tự · Chỉ phần này xuất hiện trên card.`}
        required
      />
      <div className="mt-5 space-y-3">
        {payload.description.sections.map((section, index) => (
          <details
            key={section.section_key}
            className="group rounded-xl border border-slate-200 bg-slate-50/70"
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-900">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] ${
                    section.body_markdown.trim()
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {section.body_markdown.trim() ? (
                    <Check size={13} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="truncate">{section.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">
                  {section.body_markdown.trim().length} ký tự
                </span>
                <ChevronDown
                  size={16}
                  className="text-slate-400 transition group-open:rotate-180"
                />
              </span>
            </summary>
            <div className="border-t border-slate-200 p-4">
              <TextArea
                label={`Nội dung ${section.title}`}
                value={section.body_markdown}
                onChange={(body_markdown) =>
                  onChange((current) => ({
                    ...current,
                    description: {
                      ...current.description,
                      sections: current.description.sections.map(
                        (item, sectionIndex) =>
                          sectionIndex === index
                            ? { ...item, body_markdown }
                            : item,
                      ),
                    },
                  }))
                }
                rows={6}
                placeholder={`Nêu thông tin nổi bật, bằng chứng và lưu ý thực tế về ${section.title.toLowerCase()}…`}
                hint={`${section.body_markdown.trim().length} ký tự · Hỗ trợ Markdown.`}
              />
            </div>
          </details>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Đã hoàn thành {completedSectionCount}/
        {payload.description.sections.length} mục. Cần tối thiểu 3 mục và 240 ký
        tự để xuất bản.
      </p>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-950">
              Score được khởi tạo tự động
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              Sau khi liên kết xong module, hệ thống ưu tiên benchmark đã xác
              minh, sau đó dùng thông số phần cứng và đặc tính thiết bị để tính
              điểm. Không có ô nhập điểm 0–100 trong quy trình tạo thiết bị.
            </p>
            {scoringProfile ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {scoringProfile.modules.map((module) => (
                  <span
                    key={module.key}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800 ring-1 ring-blue-100"
                  >
                    {module.label} {module.weight}%
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-blue-700">
                Hồ sơ trọng số sẽ được chọn tự động theo loại thiết bị.
              </p>
            )}
          </div>
        </div>
      </div>

      {payload.commerce.links.some((link) => link.product_url.trim()) ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Store size={16} className="text-blue-600" />
            Liên kết nơi bán sẽ được đồng bộ
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {payload.commerce.links
              .filter((link) => link.product_url.trim())
              .map((link) => (
                <span
                  key={link.partner_slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  <BadgeCheck size={12} className="text-blue-600" />
                  {link.partner_slug === "cellphones"
                    ? "CellphoneS"
                    : link.partner_slug === "fpt-shop"
                      ? "FPT Shop"
                      : link.partner_slug}
                </span>
              ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          {errors.length ? (
            <CircleAlert className="mt-0.5 text-amber-600" size={18} />
          ) : (
            <ShieldCheck className="mt-0.5 text-emerald-600" size={18} />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {errors.length
                ? `Còn ${errors.length} lỗi cần sửa`
                : "Đã đủ dữ liệu bắt buộc"}
            </p>
            {errors.length ? (
              <div className="mt-2 space-y-1">
                {errors.map((error) => (
                  <button
                    key={`${error.step}-${error.message}`}
                    type="button"
                    onClick={() => onEditIssue(error.step)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs text-amber-800 transition hover:bg-amber-100"
                  >
                    <span>• {error.message}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                      Sửa
                      <ArrowRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Hệ thống sẽ tạo model, biến thể phần cứng, liên kết module, tính
                score tự động và upload media theo thứ tự an toàn.
              </p>
            )}
          </div>
        </div>
      </div>

      {publishMessage ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            publishState === "done"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
          role="status"
        >
          {publishMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onPublish}
        disabled={Boolean(errors.length) || publishState === "publishing"}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {publishState === "publishing" ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <ShieldCheck size={17} />
        )}
        {publishState === "publishing"
          ? "Đang tạo và liên kết dữ liệu…"
          : "Publish thiết bị"}
      </button>
    </StepShell>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
        {eyebrow}
      </p>
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  min,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  min?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        type={type}
        min={min}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => {
          if (type === "date") return;
          const normalized =
            type === "number"
              ? normalizeNumberInput(event.currentTarget.value)
              : normalizeText(event.currentTarget.value);
          if (normalized !== event.currentTarget.value) onChange(normalized);
        }}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  hint,
  placeholder,
  minLength,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  hint?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <textarea
        rows={rows}
        value={value}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function NativeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <AppSearchableSelect
      label={label}
      labelClassName="text-sm font-semibold text-slate-800"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={`Chọn ${label.toLocaleLowerCase("vi-VN")}`}
      clearable={false}
    />
  );
}

function SearchSelect({
  label,
  source,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  source?: CatalogOptionSource;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
}) {
  const optionFromList = options.find((option) => option.value === value);
  const [selectedCache, setSelectedCache] = useState<SelectOption | null>(
    optionFromList ?? null,
  );
  const selected =
    optionFromList ??
    (selectedCache?.value === value ? selectedCache : undefined);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteOptions, setRemoteOptions] = useState<SelectOption[] | null>(
    null,
  );
  const [remoteState, setRemoteState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const instanceId = useId();
  const inputId = `catalog-combobox-${instanceId}`;
  const listboxId = `${inputId}-options`;
  const normalizedQuery = normalizeSuggestion(query);
  const searchableOptions = remoteOptions ?? options;
  const matchingOptions = useMemo(() => {
    const ranked = searchableOptions
      .map((option, index) => {
        const label = normalizeSuggestion(option.label);
        const meta = normalizeSuggestion(option.meta ?? "");
        const score = !normalizedQuery
          ? 2
          : label === normalizedQuery
            ? 0
            : label.startsWith(normalizedQuery)
              ? 1
              : label.includes(normalizedQuery)
                ? 2
                : meta.startsWith(normalizedQuery)
                  ? 3
                  : meta.includes(normalizedQuery)
                    ? 4
                    : -1;
        return { option, index, score };
      })
      .filter((item) => item.score >= 0)
      .sort(
        (left, right) => left.score - right.score || left.index - right.index,
      )
      .slice(0, 12)
      .map((item) => item.option);
    return ranked;
  }, [normalizedQuery, searchableOptions]);

  useEffect(() => {
    if (optionFromList) {
      setSelectedCache(optionFromList);
    } else if (!value) {
      setSelectedCache(null);
    }
  }, [optionFromList, value]);

  useEffect(() => {
    const rawQuery = query.trim();
    if (
      !open ||
      !source ||
      (rawQuery.length < 2 && options.length > 0) ||
      rawQuery === selected?.label
    ) {
      setRemoteOptions(null);
      setRemoteState("idle");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setRemoteState("loading");
      try {
        const results = await searchCatalogOptions(source, rawQuery);
        if (cancelled) return;
        setRemoteOptions(results);
        setRemoteState("idle");
        setActiveIndex(0);
      } catch {
        if (cancelled) return;
        setRemoteOptions([]);
        setRemoteState("error");
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, options.length, query, selected?.label, source]);

  useEffect(() => {
    if (!open) setQuery(selected?.label ?? "");
  }, [open, selected?.label]);

  useEffect(() => {
    setActiveIndex((current) =>
      matchingOptions.length
        ? Math.min(Math.max(0, current), matchingOptions.length - 1)
        : 0,
    );
  }, [matchingOptions.length]);

  const choose = (option: SelectOption) => {
    setSelectedCache(option);
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(0);
  };

  const closeAndRestore = () => {
    setOpen(false);
    setQuery(selected?.label ?? "");
    setActiveIndex(0);
  };

  return (
    <div
      ref={rootRef}
      className="relative block"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          closeAndRestore();
        }
      }}
    >
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-semibold text-slate-800"
      >
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && matchingOptions[activeIndex]
              ? `${listboxId}-${activeIndex}`
              : undefined
          }
          required={required}
          value={query}
          onFocus={(event) => {
            setOpen(true);
            setActiveIndex(0);
            event.currentTarget.select();
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            setActiveIndex(0);
            if (value && nextQuery !== selected?.label) onChange("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) =>
                matchingOptions.length
                  ? Math.min(current + 1, matchingOptions.length - 1)
                  : 0,
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => Math.max(0, current - 1));
            } else if (
              event.key === "Enter" &&
              open &&
              matchingOptions[activeIndex]
            ) {
              event.preventDefault();
              choose(matchingOptions[activeIndex]);
            } else if (event.key === "Escape") {
              event.preventDefault();
              closeAndRestore();
            } else if (event.key === "Tab") {
              closeAndRestore();
            }
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-20 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {query || value ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSelectedCache(null);
              onChange("");
              setQuery("");
              setOpen(true);
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            className="absolute right-9 top-1.5 grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Xóa lựa chọn ${label}`}
          >
            <X size={14} />
          </button>
        ) : null}
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setOpen((current) => !current);
            inputRef.current?.focus();
          }}
          className="absolute right-1 top-1.5 grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={open ? "Đóng danh sách gợi ý" : "Mở danh sách gợi ý"}
        >
          <ChevronDown
            size={15}
            className={`transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10"
        >
          {remoteState === "loading" ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700">
              <LoaderCircle size={14} className="animate-spin" />
              Đang tìm trong toàn bộ catalog…
            </div>
          ) : null}
          {matchingOptions.length ? (
            matchingOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <button
                  key={option.value}
                  id={`${listboxId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    isActive
                      ? "bg-blue-50 text-blue-950"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {option.label}
                    </span>
                    {option.meta ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {option.meta}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check size={16} className="shrink-0 text-blue-600" />
                  ) : null}
                </button>
              );
            })
          ) : remoteState === "loading" ? null : (
            <div className="px-3 py-5 text-center">
              <p className="text-sm font-semibold text-slate-700">
                {remoteState === "error"
                  ? "Không thể tải dữ liệu gợi ý"
                  : "Không tìm thấy dữ liệu phù hợp"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {remoteState === "error"
                  ? "Vui lòng thử lại sau ít giây."
                  : "Thử từ khóa khác hoặc tạo dữ liệu mới ở phần tương ứng."}
              </p>
            </div>
          )}
        </div>
      ) : null}
      {query && !value && !open ? (
        <p className="mt-1.5 text-xs text-amber-700">
          Hãy chọn một gợi ý để liên kết đúng dữ liệu có sẵn.
        </p>
      ) : null}
    </div>
  );
}

function ModuleGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <h4 className="mb-4 text-sm font-semibold text-slate-950">{title}</h4>
      {children}
    </section>
  );
}

function DraftsPanel({
  drafts,
  activeId,
  onResume,
}: {
  drafts: CatalogDraft[];
  activeId?: string;
  onResume: (draft: CatalogDraft) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <FileClock size={16} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-950">
          Bản nháp gần đây
        </h3>
      </div>
      <div className="mt-3 space-y-2">
        {drafts.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onResume(item)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              item.id === activeId
                ? "border-blue-200 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="block truncate text-xs font-semibold text-slate-900">
              {item.title}
            </span>
            <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Bản sửa {item.revision}</span>
              <span>{formatRelative(item.updated_at)}</span>
            </span>
          </button>
        ))}
        {!drafts.length ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
            Chưa có bản nháp.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AutosaveBadge({
  state,
  revision,
}: {
  state: "idle" | "saving" | "saved" | "error";
  revision?: number;
}) {
  const content = {
    idle: {
      label: "Chưa có thay đổi",
      className: "bg-slate-100 text-slate-600",
    },
    saving: {
      label: "Đang tự động lưu…",
      className: "bg-amber-50 text-amber-700",
    },
    saved: {
      label: `Đã lưu${revision ? ` · r${revision}` : ""}`,
      className: "bg-emerald-50 text-emerald-700",
    },
    error: {
      label: "Lưu thất bại · thử lại tự động",
      className: "bg-rose-50 text-rose-700",
    },
  }[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${content.className}`}
    >
      {state === "saving" ? (
        <LoaderCircle className="animate-spin" size={12} />
      ) : (
        <Save size={12} />
      )}
      {content.label}
    </span>
  );
}

function mergeDraftPayload(value: Record<string, unknown>): WizardPayload {
  const source = value as Partial<WizardPayload>;
  const legacyConfiguration = source.configuration as
    | (Partial<WizardPayload["configuration"]> & {
        memory_capacity_gb?: string;
        storage_capacity_gb?: string;
      })
    | undefined;
  const incomingSections = Array.isArray(source.description?.sections)
    ? source.description.sections.filter(
        (section): section is EditorialSection =>
          Boolean(
            section &&
              typeof section.section_key === "string" &&
              typeof section.title === "string" &&
              typeof section.body_markdown === "string",
          ),
      )
    : [];
  return {
    general: { ...emptyPayload.general, ...source.general },
    model: { ...emptyPayload.model, ...source.model },
    hardware: { ...emptyPayload.hardware, ...source.hardware },
    configuration: {
      ...emptyPayload.configuration,
      ...legacyConfiguration,
      memory_capacity_options_gb:
        legacyConfiguration?.memory_capacity_options_gb ??
        legacyConfiguration?.memory_capacity_gb ??
        "",
      storage_capacity_options_gb:
        legacyConfiguration?.storage_capacity_options_gb ??
        legacyConfiguration?.storage_capacity_gb ??
        "",
    },
    display: { ...emptyPayload.display, ...source.display },
    camera: {
      rear_main: {
        ...emptyPayload.camera.rear_main,
        ...source.camera?.rear_main,
      },
      rear_ultrawide: {
        ...emptyPayload.camera.rear_ultrawide,
        ...source.camera?.rear_ultrawide,
      },
      rear_telephoto: {
        ...emptyPayload.camera.rear_telephoto,
        ...source.camera?.rear_telephoto,
      },
      front: { ...emptyPayload.camera.front, ...source.camera?.front },
    },
    battery: { ...emptyPayload.battery, ...source.battery },
    software: { ...emptyPayload.software, ...source.software },
    media: { ...emptyPayload.media, ...source.media },
    commerce: {
      ...emptyPayload.commerce,
      ...source.commerce,
      links: Array.isArray(source.commerce?.links) ? source.commerce.links : [],
    },
    description: {
      ...emptyPayload.description,
      ...source.description,
      sections: incomingSections.length
        ? incomingSections
        : defaultEditorialSections.map((section) => ({ ...section })),
    },
    provenance: source.provenance,
  };
}

function quickIntakeSource(
  value: unknown,
): { label: string; url?: string } | null {
  if (!value || typeof value !== "object") return null;
  const source = (value as Record<string, unknown>).source;
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;
  if (typeof record.label !== "string" || !record.label.trim()) return null;
  return {
    label: record.label,
    url: typeof record.url === "string" ? record.url : undefined,
  };
}

function getPublishChecks(payload: WizardPayload): PublishCheck[] {
  const summary =
    payload.description.summary.trim() || payload.general.summary.trim();
  const completedSections = payload.description.sections.filter((section) =>
    section.body_markdown.trim(),
  );
  const detailedDescription = completedSections
    .map((section) => `## ${section.title}\n\n${section.body_markdown.trim()}`)
    .join("\n\n");

  return [
    {
      label: "Tên thiết bị",
      complete: Boolean(payload.general.name.trim()),
      step: "general",
    },
    {
      label: "Slug chuẩn",
      complete:
        Boolean(payload.general.slug.trim()) &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.general.slug),
      step: "general",
    },
    {
      label: "Dòng sản phẩm",
      complete: Boolean(payload.general.product_family_id),
      step: "general",
    },
    {
      label: "Trạng thái phát hành",
      complete: Boolean(payload.general.release_status_id),
      step: "general",
    },
    {
      label: "Định danh biến thể phần cứng",
      complete: Boolean(
        payload.model.market_name.trim() || payload.model.sku_code.trim(),
      ),
      step: "model",
    },
    {
      label: "Tóm tắt từ 80 ký tự",
      complete: summary.length >= 80,
      step: "general",
    },
    {
      label: "Ít nhất 3 mục mô tả",
      complete: completedSections.length >= 3,
      step: "review",
    },
    {
      label: "Mô tả từ 240 ký tự",
      complete: detailedDescription.length >= 240,
      step: "review",
    },
  ];
}

function getWizardStepCompletion(
  payload: WizardPayload,
  mediaFiles: File[],
): Record<WizardStep, boolean> {
  const checks = getPublishChecks(payload);
  const requiredComplete = (step: WizardStep) =>
    checks.filter((item) => item.step === step).every((item) => item.complete);
  const configurationValues = Object.values(payload.configuration);
  const softwareValues = Object.values(payload.software);
  const cameraValues = Object.values(payload.camera).flatMap((camera) =>
    Object.values(camera),
  );

  return {
    general: requiredComplete("general"),
    model:
      requiredComplete("model") &&
      (!payload.model.launch_price || Boolean(payload.model.currency_id)),
    hardware: Object.values(payload.hardware).some(Boolean),
    configuration: configurationValues.some(Boolean),
    modules: Boolean(
      Object.values(payload.display).some(Boolean) ||
        Object.values(payload.battery).some(Boolean) ||
        cameraValues.some(Boolean),
    ),
    software: softwareValues.some(Boolean),
    media: mediaFiles.length > 0,
    commerce: payload.commerce.links.some((link) =>
      Boolean(link.product_url.trim()),
    ),
    review: requiredComplete("review"),
  };
}

function validateForPublish(
  payload: WizardPayload,
  duplicateDevice?: DeviceDuplicateCandidate,
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!payload.general.name.trim()) {
    errors.push({ message: "Thiếu tên thiết bị.", step: "general" });
  }
  if (!payload.general.slug.trim()) {
    errors.push({ message: "Thiếu slug.", step: "general" });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.general.slug)) {
    errors.push({
      message: "Slug chỉ gồm chữ thường, số và dấu gạch ngang.",
      step: "general",
    });
  }
  if (duplicateDevice) {
    errors.push({
      message: `Thiết bị “${duplicateDevice.name}” đã tồn tại. Hãy thêm phiên bản vào thiết bị đó hoặc đổi tên/slug.`,
      step: "general",
    });
  }
  if (!payload.general.product_family_id) {
    errors.push({ message: "Thiếu dòng sản phẩm.", step: "general" });
  }
  if (!payload.general.release_status_id) {
    errors.push({ message: "Thiếu trạng thái.", step: "general" });
  }
  if (!payload.model.market_name.trim() && !payload.model.sku_code.trim()) {
    errors.push({
      message:
        "Cần nhập thị trường hoặc mã model để định danh biến thể phần cứng.",
      step: "model",
    });
  }
  const summary =
    payload.description.summary.trim() || payload.general.summary.trim();
  if (summary.length < 80) {
    errors.push({
      message: "Tóm tắt thiết bị cần ít nhất 80 ký tự.",
      step: "general",
    });
  }
  const completedSections = payload.description.sections.filter((section) =>
    section.body_markdown.trim(),
  );
  const detailedDescription = completedSections
    .map((section) => `## ${section.title}\n\n${section.body_markdown.trim()}`)
    .join("\n\n");
  if (completedSections.length < 3) {
    errors.push({
      message: "Mô tả chi tiết cần hoàn thành ít nhất 3 mục nội dung.",
      step: "review",
    });
  }
  if (detailedDescription.length < 240) {
    errors.push({
      message: "Mô tả chi tiết thiết bị cần ít nhất 240 ký tự.",
      step: "review",
    });
  }
  if (payload.model.launch_price && !payload.model.currency_id) {
    errors.push({
      message: "Giá ra mắt cần đi kèm đơn vị tiền tệ.",
      step: "model",
    });
  }
  for (const link of payload.commerce.links) {
    if (!link.product_url.trim()) continue;
    try {
      const url = new URL(link.product_url);
      if (url.protocol !== "https:") {
        errors.push({
          message: `Link ${link.partner_slug} cần sử dụng HTTPS.`,
          step: "commerce",
        });
      }
      const trustedBaseUrl =
        link.partner_slug === "cellphones"
          ? "https://cellphones.com.vn"
          : link.partner_slug === "fpt-shop"
            ? "https://fptshop.com.vn"
            : undefined;
      if (
        trustedBaseUrl &&
        !matchesPartnerDomain(link.product_url, trustedBaseUrl)
      ) {
        errors.push({
          message: `Link ${link.partner_slug} không thuộc đúng đối tác.`,
          step: "commerce",
        });
      }
    } catch {
      errors.push({
        message: `Link ${link.partner_slug} chưa đúng định dạng URL.`,
        step: "commerce",
      });
    }
  }
  if (
    Boolean(payload.configuration.memory_standard_id) !==
    Boolean(
      parseCapacityOptions(payload.configuration.memory_capacity_options_gb)
        .length,
    )
  ) {
    errors.push({
      message: "Cấu hình RAM cần cả chuẩn RAM và ít nhất một mức dung lượng.",
      step: "configuration",
    });
  }
  if (
    payload.configuration.memory_capacity_options_gb &&
    !capacityOptionsAreValid(payload.configuration.memory_capacity_options_gb)
  ) {
    errors.push({
      message: "Các mức RAM phải là số GB dương, phân tách bằng dấu phẩy.",
      step: "configuration",
    });
  }
  if (
    Boolean(payload.configuration.storage_standard_id) !==
    Boolean(
      parseCapacityOptions(payload.configuration.storage_capacity_options_gb)
        .length,
    )
  ) {
    errors.push({
      message: "Cấu hình lưu trữ cần cả chuẩn và ít nhất một mức dung lượng.",
      step: "configuration",
    });
  }
  if (
    payload.configuration.storage_capacity_options_gb &&
    !capacityOptionsAreValid(payload.configuration.storage_capacity_options_gb)
  ) {
    errors.push({
      message: "Các mức lưu trữ phải là số GB dương, phân tách bằng dấu phẩy.",
      step: "configuration",
    });
  }
  if (
    Object.entries(payload.display).some(
      ([key, value]) => key !== "technology" && Boolean(value),
    ) &&
    !payload.display.technology.trim()
  ) {
    errors.push({
      message: "Thông số màn hình cần có công nghệ màn hình.",
      step: "modules",
    });
  }
  if (
    Object.entries(payload.battery).some(
      ([key, value]) => key !== "capacity_mah" && Boolean(value),
    ) &&
    !payload.battery.capacity_mah
  ) {
    errors.push({
      message: "Thông số pin cần có dung lượng mAh.",
      step: "modules",
    });
  }
  return errors;
}

function matchesPartnerDomain(productUrl: string, partnerBaseUrl: string) {
  if (!productUrl.trim()) return false;
  try {
    const product = new URL(productUrl);
    const partner = new URL(partnerBaseUrl);
    return (
      product.protocol === "https:" &&
      (product.hostname === partner.hostname ||
        product.hostname.endsWith(`.${partner.hostname}`) ||
        partner.hostname.endsWith(`.${product.hostname}`))
    );
  } catch {
    return false;
  }
}

function formatCommercePrice(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

function buildInlineHardwareModules(
  payload: WizardPayload,
): CreateDeviceVariantInput["inline_modules"] {
  const display = payload.display.technology.trim()
    ? {
        technology: payload.display.technology.trim(),
        size_inch: optionalNumber(payload.display.size_inch),
        aspect_ratio: optional(payload.display.aspect_ratio),
        resolution_width: optionalNumber(payload.display.resolution_width),
        resolution_height: optionalNumber(payload.display.resolution_height),
        pixel_density_ppi: optionalNumber(payload.display.pixel_density_ppi),
        refresh_rate_hz: optionalNumber(payload.display.refresh_rate_hz),
        refresh_rate_min_hz: optionalNumber(
          payload.display.refresh_rate_min_hz,
        ),
        ltpo_version: optional(payload.display.ltpo_version),
        touch_sampling_hz: optionalNumber(payload.display.touch_sampling_hz),
        brightness_typical_nits: optionalNumber(
          payload.display.brightness_typical_nits,
        ),
        brightness_hbm_nits: optionalNumber(
          payload.display.brightness_hbm_nits,
        ),
        brightness_peak_nits: optionalNumber(
          payload.display.brightness_peak_nits,
        ),
        color_gamut: optional(payload.display.color_gamut),
        hdr_formats: optional(payload.display.hdr_formats),
        protection_glass: optional(payload.display.protection_glass),
        has_always_on: optionalBoolean(payload.display.has_always_on),
        has_dc_dimming: optionalBoolean(payload.display.has_dc_dimming),
        pwm_frequency_hz: optionalNumber(payload.display.pwm_frequency_hz),
      }
    : undefined;
  const cameraForms: Array<
    ["main" | "ultrawide" | "telephoto" | "selfie", InlineCameraForm]
  > = [
    ["main", payload.camera.rear_main],
    ["ultrawide", payload.camera.rear_ultrawide],
    ["telephoto", payload.camera.rear_telephoto],
    ["selfie", payload.camera.front],
  ];
  const cameras = cameraForms
    .filter(([, camera]) => Object.values(camera).some(Boolean))
    .map(([role, camera]) => ({
      role,
      effective_megapixel: optionalNumber(camera.effective_megapixel),
      aperture: optional(camera.aperture),
      focal_length_mm_eq: optionalNumber(camera.focal_length_mm_eq),
      optical_zoom: optionalNumber(camera.optical_zoom),
      field_of_view_deg: optionalNumber(camera.field_of_view_deg),
      has_ois: optionalBoolean(camera.has_ois),
      has_eis: optionalBoolean(camera.has_eis),
      has_af: optionalBoolean(camera.has_af),
      video_capabilities: optional(camera.video_capabilities),
    }));
  const batteryCapacity = optionalNumber(payload.battery.capacity_mah);
  const battery =
    batteryCapacity !== undefined
      ? {
          capacity_mah: batteryCapacity,
          energy_wh: optionalNumber(payload.battery.energy_wh),
          wired_charging_w: optionalNumber(payload.battery.wired_charging_w),
          wired_charging_protocol: optional(
            payload.battery.wired_charging_protocol,
          ),
          wireless_charging_w: optionalNumber(
            payload.battery.wireless_charging_w,
          ),
          wireless_charging_protocol: optional(
            payload.battery.wireless_charging_protocol,
          ),
          removable: optionalBoolean(payload.battery.removable),
        }
      : undefined;
  return display || cameras.length || battery
    ? { display, cameras: cameras.length ? cameras : undefined, battery }
    : undefined;
}

function hasSoftwareData(payload: WizardPayload) {
  return Object.values(payload.software).some(Boolean);
}

function buildPhysicalSpecs(
  payload: WizardPayload,
): CreateDeviceVariantInput["physical_specs"] {
  const configuration = payload.configuration;
  const result = {
    height_mm: optionalNumber(configuration.height_mm),
    width_mm: optionalNumber(configuration.width_mm),
    thickness_mm: optionalNumber(configuration.thickness_mm),
    weight_g: optionalNumber(configuration.weight_g),
    frame_material: optional(configuration.frame_material),
    back_material: optional(configuration.back_material),
    front_glass: optional(configuration.front_glass),
    ingress_protection: optional(configuration.ingress_protection),
  };
  return Object.values(result).some((value) => value !== undefined)
    ? result
    : undefined;
}

function buildIoSpecs(
  payload: WizardPayload,
): CreateDeviceVariantInput["io_specs"] {
  const configuration = payload.configuration;
  const result = {
    sim_slots: optionalNumber(configuration.sim_slots),
    sim_type: optional(configuration.sim_type),
    esim_supported: optionalBoolean(configuration.esim_supported),
    stereo_speakers: optionalBoolean(configuration.stereo_speakers),
    headphone_jack: optionalBoolean(configuration.headphone_jack),
    has_microsd_slot: optionalBoolean(configuration.has_microsd_slot),
    has_ir_blaster: optionalBoolean(configuration.has_ir_blaster),
  };
  return Object.values(result).some((value) => value !== undefined)
    ? result
    : undefined;
}

function buildThermalSpecs(
  payload: WizardPayload,
): CreateDeviceVariantInput["thermal_specs"] {
  const configuration = payload.configuration;
  const result = {
    cooling_type: optional(configuration.cooling_type),
    vc_area_mm2: optionalNumber(configuration.vc_area_mm2),
    has_active_cooling: optionalBoolean(configuration.has_active_cooling),
  };
  return Object.values(result).some((value) => value !== undefined)
    ? result
    : undefined;
}

function lastSelectionReset(
  onChange: React.Dispatch<React.SetStateAction<WizardPayload>>,
  chipsetId: string,
) {
  onChange((current) => ({
    ...current,
    hardware: {
      chipset_id: chipsetId,
      cpu_id: "",
      gpu_id: "",
      npu_id: "",
      modem_id: "",
    },
  }));
}

function optional(value: string) {
  return value.trim() || undefined;
}

function optionalNumber(value: string) {
  return value.trim() ? parseSpecificationNumber(value) : undefined;
}

function optionalBoolean(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function hardwareVariantName(
  model: Pick<WizardPayload["model"], "market_name" | "sku_code">,
) {
  const market = model.market_name.trim();
  const modelCode = model.sku_code.trim().toUpperCase();
  return (
    [market, modelCode].filter(Boolean).join(" · ") || "Cấu hình tiêu chuẩn"
  );
}

function parseCapacityOptions(value: string) {
  return [
    ...new Set(
      value
        .split(/[,;\n/]+/)
        .map((item) => parseSpecificationNumber(item.replace(/\s*gb\s*$/i, "")))
        .filter(
          (item): item is number =>
            item !== undefined && Number.isInteger(item) && item > 0,
        ),
    ),
  ].sort((left, right) => left - right);
}

function capacityOptionsAreValid(value: string) {
  const tokens = value
    .split(/[,;\n/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return (
    tokens.length > 0 &&
    tokens.every((token) => {
      const parsed = parseSpecificationNumber(token.replace(/\s*gb\s*$/i, ""));
      return parsed !== undefined && Number.isInteger(parsed) && parsed > 0;
    })
  );
}

function readableError(error: unknown) {
  if (!(error instanceof Error)) return "Không thể lưu dữ liệu lúc này.";
  return error.message || "Không thể lưu dữ liệu lúc này.";
}

async function searchCatalogOptions(
  source: CatalogOptionSource,
  query: string,
): Promise<SelectOption[]> {
  const params = {
    page: 1,
    pageSize: 50,
    q: query,
    sortBy: "name",
    sortOrder: "asc" as const,
  };
  switch (source) {
    case "organizations": {
      const result = await api.listOrganizations(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: item.short_name ?? item.slug,
      }));
    }
    case "product-families": {
      const result = await api.listProductFamilies(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: [item.brand_org?.name, item.device_category?.name]
          .filter(Boolean)
          .join(" · "),
      }));
    }
    case "device-categories": {
      const result = await api.listDeviceCategories(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: item.slug,
      }));
    }
    case "chipsets": {
      const result = await api.listChipsets(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: [item.manufacturer?.name, item.process_node?.name]
          .filter(Boolean)
          .join(" · "),
      }));
    }
    case "cpus": {
      const result = await api.listHardwareCpus(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: item.manufacturer?.name,
      }));
    }
    case "gpus": {
      const result = await api.listHardwareGpus(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: item.manufacturer?.name,
      }));
    }
    case "npus": {
      const result = await api.listHardwareNpus(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: item.manufacturer?.name,
      }));
    }
    case "modems": {
      const result = await api.listHardwareModems(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: item.manufacturer?.name,
      }));
    }
    case "memory-standards": {
      const result = await api.listMemoryStandards(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: [item.memory_type, item.generation].filter(Boolean).join(" · "),
      }));
    }
    case "storage-standards": {
      const result = await api.listStorageStandards(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name,
        meta: [item.storage_type, item.generation].filter(Boolean).join(" · "),
      }));
    }
    case "displays": {
      const result = await api.listDisplayUnits(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name || item.slug || "Display chưa đặt tên",
        meta: [
          item.size_inch ? `${item.size_inch}"` : "",
          item.refresh_rate_hz ? `${item.refresh_rate_hz} Hz` : "",
          item.brightness_peak_nits ? `${item.brightness_peak_nits} nit` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      }));
    }
    case "cameras": {
      const result = await api.listCameraModules(params);
      return result.data.map((item) => ({
        value: item.id,
        label:
          item.name ||
          `${item.effective_megapixel ?? "?"} MP ${item.camera_role?.name ?? ""}`,
        meta: [item.camera_role?.name, item.aperture, item.has_ois ? "OIS" : ""]
          .filter(Boolean)
          .join(" · "),
      }));
    }
    case "batteries": {
      const result = await api.listBatteryUnits(params);
      return result.data.map((item) => ({
        value: item.id,
        label: item.name || `${item.capacity_mah.toLocaleString("vi-VN")} mAh`,
        meta: [
          item.wired_charging_w ? `${item.wired_charging_w} W có dây` : "",
          item.wireless_charging_w
            ? `${item.wireless_charging_w} W không dây`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      }));
    }
  }
}

function normalizeSuggestion(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi")
    .trim();
}

function normalizeCatalogIdentity(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatRelative(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}
