import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { SchoolContextBar } from "@/components/SchoolContextBar";
import { UploadedMaterialViewer } from "@/components/UploadedMaterialViewer";
import { SiteFooter } from "@/components/SiteFooter";
import { materialRouteSubject } from "@/lib/route-ids";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ schoolId: string; subjectId: string; materialId: string }>;
}) {
  const { schoolId, subjectId, materialId } = await params;
  const school = getSchool(schoolId);
  if (!school) notFound();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(materialId)) notFound();

  return (
    <>
      <SchoolContextBar school={school} />
      <UploadedMaterialViewer school={school} subject={materialRouteSubject(schoolId, subjectId, null)} versionId={materialId} />
      <SiteFooter />
    </>
  );
}
