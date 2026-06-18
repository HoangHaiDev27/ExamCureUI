import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { getSubject } from "@/lib/subjects";
import { getMaterial } from "@/lib/materials";
import { getExam } from "@/lib/questions";
import { SchoolContextBar } from "@/components/SchoolContextBar";
import { MaterialViewer } from "@/components/MaterialViewer";
import { SiteFooter } from "@/components/SiteFooter";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ schoolId: string; subjectId: string; materialId: string }>;
}) {
  const { schoolId, subjectId, materialId } = await params;
  const school = getSchool(schoolId);
  const subject = getSubject(schoolId, subjectId);
  if (!school || !subject) notFound();

  const material = getMaterial(subject, materialId);
  if (!material) notFound();

  const questions = getExam(subject);

  return (
    <>
      <SchoolContextBar school={school} />
      <MaterialViewer
        school={school}
        subject={subject}
        material={material}
        questions={questions}
      />
      <SiteFooter />
    </>
  );
}
