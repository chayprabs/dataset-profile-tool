import { DatasetWorkspace } from "../../components/dataset-workspace";
import { SeoStrip } from "../../components/seo-strip";

export default function DriftPage() {
  return (
    <>
      <SeoStrip />
      <main className="site-main">
        <DatasetWorkspace defaultMode="drift" />
      </main>
    </>
  );
}
