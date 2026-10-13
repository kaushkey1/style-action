import { ApiService, IMPETUS_APP_BASE, getImpetusHeaders } from '@/lib/api';

const BASE = `${IMPETUS_APP_BASE}/insights/feedback`;

export interface InsightFeedbackItem {
  user_email: string;
  insight_id: string;
  feedback: string;
  created_at: string;
  marked_helpful: boolean;
}

interface FeedbackListResponse {
  total: number;
  feedbacks: InsightFeedbackItem[];
}

interface SubmitFeedbackResponse {
  message: string;
}

function buildHeaders(userEmail: string): Record<string, string> {
  return {
    ...getImpetusHeaders(),
    'x-user-data': JSON.stringify({ email: userEmail }),
  };
}

export async function fetchAllInsightFeedback(
  userEmail: string,
): Promise<InsightFeedbackItem[]> {
  const res = await ApiService.get(BASE, {
    headers: buildHeaders(userEmail),
  });
  const data: FeedbackListResponse = res.data?.data ?? res.data;
  return data.feedbacks ?? [];
}

export interface SubmitFeedbackPayload {
  insight_id: string;
  feedback: string;
  marked_helpful: boolean;
  userEmail: string;
}

export async function submitInsightFeedback(
  payload: SubmitFeedbackPayload,
): Promise<SubmitFeedbackResponse> {
  const { userEmail, ...body } = payload;
  const res = await ApiService.post(BASE, {
    data: body,
    headers: buildHeaders(userEmail),
  });
  return res.data?.data ?? res.data;
}
