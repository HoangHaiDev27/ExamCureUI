import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { getSubject } from "@/lib/subjects";
import { getMaterials, getExamSets } from "@/lib/materials";
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
  const subject = getSubject(schoolId, subjectId);
  if (!school || !subject) notFound();

  const materials = getMaterials(subject);
  const examSets = getExamSets(subject);

  return (
    <>
      <SchoolContextBar school={school} />
      <SubjectDetail
        school={school}
        subject={subject}
        materials={materials}
        examSets={examSets}
      />
      <SiteFooter />
    </>
  );
}
