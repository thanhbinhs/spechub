import { DeviceRecommender } from "@/components/device-recommender";
import { PageHeader } from "@/components/page-header";
import { api, categoryTreeData } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function RecommendPage() {
  const categoryResult = await api.getDeviceCategoryTree();

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader title="Chọn máy theo nhu cầu" />
      <DeviceRecommender categories={categoryTreeData(categoryResult)} />
    </div>
  );
}
