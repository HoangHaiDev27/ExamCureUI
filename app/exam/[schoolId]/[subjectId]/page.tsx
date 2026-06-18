import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools";
import { getSubject } from "@/lib/subjects";
import { getExam } from "@/lib/questions";
import { ExamRoom } from "@/components/exam/ExamRoom";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ schoolId: string; subjectId: string }>;
}) {
  const { schoolId, subjectId } = await params;
  const school = getSchool(schoolId);
  const subject = getSubject(schoolId, subjectId);
  if (!school || !subject) notFound();

  const questions = getExam(subject);

  return <ExamRoom school={school} subject={subject} questions={questions} />;
}
