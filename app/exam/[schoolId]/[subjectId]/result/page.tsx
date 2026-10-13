import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { ResultLoader } from "@/components/exam/ResultLoader";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string; subjectId: string }>;
  searchParams: Promise<{ attempt?: string | string[] }>;
}) {
  const { schoolId } = await params;
  const { attempt } = await searchParams;
  const school = getSchool(schoolId);
  if (!school) notFound();

  return <ResultLoader school={school} attemptId={typeof attempt === "string" ? attempt : undefined} />;
}
