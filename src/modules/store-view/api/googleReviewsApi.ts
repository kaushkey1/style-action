import type { GoogleReviewsStore } from '../types/googleReviews.types';
import { fetchStoreData } from './storeDataApi';

export const googleReviewKeys = {
  all: ['google-reviews'] as const,
  store: (storeCode: string) => [...googleReviewKeys.all, storeCode] as const,
};

/**
 * Fetch live Google ratings and reviews for a store, via Google Places API.
 *
 * Resolves to `null` when the store has no matching Google listing. It
 * deliberately does NOT fall back to generated data: the previous
 * implementation silently substituted mock reviews on six different failure
 * paths, so production showed fabricated ratings with no indication.
 *
 * Reviews are fetched live on every call — Google's Places terms permit caching
 * the Place ID but not the ratings or review content.
 */
export async function fetchGoogleReviews(
  storeCode: string,
): Promise<GoogleReviewsStore | null> {
  return fetchStoreData<GoogleReviewsStore>(`/store-view/store-reviews/${encodeURIComponent(storeCode)}`);
}
