import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { ExamLoader } from "@/components/exam/ExamLoader";

export default async function ExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string; subjectId: string }>;
  searchParams: Promise<{ exam?: string | string[] }>;
}) {
  const { schoolId, subjectId } = await params;
  const { exam } = await searchParams;
  const school = getSchool(schoolId);
  if (!school) notFound();

  return <ExamLoader school={school} routeId={subjectId} examId={typeof exam === "string" ? exam : undefined} />;
}
