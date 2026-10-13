import { apiRequest } from "./api";

export type FeedbackCategory = "bug" | "content" | "suggestion" | "other";

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: "Lỗi hệ thống",
  content: "Câu hỏi hoặc đáp án sai",
  suggestion: "Góp ý tính năng",
  other: "Khác",
};

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  message: string;
  page?: string;
}

export const submitFeedback = (input: SubmitFeedbackInput) =>
  apiRequest<{ id: string }>("/Feedback", { method: "POST", body: JSON.stringify(input) });
