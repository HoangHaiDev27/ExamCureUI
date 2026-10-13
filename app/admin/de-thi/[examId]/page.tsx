import { ExamDetailView } from "@/components/admin/views/ExamDetailView";

export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <ExamDetailView examId={examId} />;
}
