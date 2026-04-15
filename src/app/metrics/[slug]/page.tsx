import { metricCatalog } from "@/lib/metrics";
import MetricPageClient from "./MetricPageClient";

export function generateStaticParams() {
  return metricCatalog.map((m) => ({
    slug: m.key.replace(/_/g, "-"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = slug.replace(/-/g, "_");
  const meta = metricCatalog.find((m) => m.key === key);
  return {
    title: meta ? `${meta.label} — OnChainLab` : "Metric — OnChainLab",
    description: meta?.description ?? "Bitcoin on-chain metric",
  };
}

export default async function MetricPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = slug.replace(/-/g, "_");
  return <MetricPageClient metricKey={key} />;
}
