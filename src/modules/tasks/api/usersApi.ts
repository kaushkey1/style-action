import { ApiService, IMPETUS_BASE, getImpetusHeaders } from '@/lib/api';
import type { User } from '../types/task.types';

const URL = `${IMPETUS_BASE}/users`;

export interface ListUsersParams {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

interface ApiUser {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  active: boolean;
}

function unwrap<T>(resData: unknown): T {
  if (resData && typeof resData === 'object' && 'data' in resData) {
    return (resData as { data: T }).data;
  }
  return resData as T;
}

function toInitials(first: string | null, last: string | null, email: string): string {
  const a = (first ?? '').trim()[0] ?? '';
  const b = (last ?? '').trim()[0] ?? '';
  const initials = (a + b).toUpperCase();
  if (initials) return initials;
  return (email[0] ?? '?').toUpperCase();
}

function toDisplayName(first: string | null, last: string | null, email: string): string {
  const joined = `${first ?? ''} ${last ?? ''}`.trim();
  return joined || email;
}

function fromApiUser(api: ApiUser): User {
  return {
    id: api.id,
    email: api.email,
    name: toDisplayName(api.first_name, api.last_name, api.email),
    initials: toInitials(api.first_name, api.last_name, api.email),
    username: api.username,
    active: api.active,
  };
}

export async function listUsers(params: ListUsersParams = {}): Promise<User[]> {
  const { search, activeOnly = true, limit = 50, offset = 0 } = params;
  const query: Record<string, string> = {
    active_only: String(activeOnly),
    limit: String(limit),
    offset: String(offset),
  };
  if (search && search.trim()) query.search = search.trim();

  const res = await ApiService.get(URL, {
    headers: getImpetusHeaders(),
    params: query,
  });
  const apiUsers = unwrap<ApiUser[]>(res.data) ?? [];
  return apiUsers.map(fromApiUser);
}
