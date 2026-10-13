import { ApiService, IMPETUS_APP_BASE, getImpetusHeaders } from '@/lib/api';

const ROLE = 'ceo';
const BASE = `${IMPETUS_APP_BASE}/command-center-dashboard/${ROLE}/exception-feedback`;

export interface ExceptionFeedbackItem {
  user_email: string;
  exception_id: string;
  feedback: string;
  created_at: string;
  marked_helpful: boolean;
}

interface FeedbackListResponse {
  total: number;
  feedbacks: ExceptionFeedbackItem[];
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

export async function fetchExceptionFeedback(
  exceptionId: string,
  userEmail: string,
): Promise<ExceptionFeedbackItem | null> {
  const res = await ApiService.get(BASE, {
    params: { exception_id: exceptionId },
    headers: buildHeaders(userEmail),
  });
  const data: FeedbackListResponse = res.data?.data ?? res.data;
  return data.feedbacks?.[0] ?? null;
}

export interface SubmitFeedbackPayload {
  exception_id: string;
  feedback: string;
  marked_helpful: boolean;
  userEmail: string;
}

export async function submitExceptionFeedback(
  payload: SubmitFeedbackPayload,
): Promise<SubmitFeedbackResponse> {
  const { userEmail, ...body } = payload;
  const res = await ApiService.post(BASE, {
    data: body,
    headers: buildHeaders(userEmail),
  });
  return res.data?.data ?? res.data;
}
