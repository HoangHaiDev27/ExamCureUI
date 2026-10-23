import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { SchoolContextBar } from "@/components/SchoolContextBar";
import { SubjectDetail } from "@/components/SubjectDetail";
import { SiteFooter } from "@/components/SiteFooter";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string; subjectId: string }>;
}) {
  const { schoolId, subjectId } = await params;
  const school = getSchool(schoolId);
  if (!school) notFound();

  return (
    <>
      <SchoolContextBar school={school} />
      <SubjectDetail school={school} routeId={subjectId} />
      <SiteFooter />
    </>
  );
}
