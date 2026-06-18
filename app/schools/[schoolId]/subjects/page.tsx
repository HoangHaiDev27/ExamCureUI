import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { getSubjects } from "@/lib/subjects";
import { SchoolContextBar } from "@/components/SchoolContextBar";
import { SubjectBrowser } from "@/components/SubjectBrowser";
import { SiteFooter } from "@/components/SiteFooter";

export default async function SubjectsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const school = getSchool(schoolId);
  if (!school) notFound();

  const subjects = getSubjects(schoolId);

  return (
    <>
      <SchoolContextBar school={school} />
      <SubjectBrowser school={school} subjects={subjects} />
      <SiteFooter />
    </>
  );
}
