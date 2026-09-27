import { Suspense } from "react";
import { QuestionsPanel } from "@/components/admin/QuestionsPanel";
import { Spinner } from "@/components/admin/ui";

// QuestionsPanel đọc ?subjectId= bằng useSearchParams → cần Suspense boundary.
export default function AdminQuestionsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <QuestionsPanel />
    </Suspense>
  );
}
