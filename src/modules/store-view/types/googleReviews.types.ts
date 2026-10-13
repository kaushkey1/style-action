/**
 * Google reviews, sourced live from the Google Places API (New).
 *
 * Two former fields are gone because Places does not expose them:
 * - `topics[]` — the "People often mention" pills are a Maps-UI feature.
 * - `distribution` — there is no star histogram; the old one was fabricated
 *   from the rating by both the mock and the scraper.
 *
 * Google's Places policy requires that review content carry author attribution
 * and a link back to the source, which is what the `author*`/`reviewUri` fields
 * are for. They are optional because Google may omit them for some reviews.
 */

export interface GoogleReview {
  reviewerName: string;
  rating: number;
  /** YYYY-MM-DD, derived from the API's RFC 3339 publishTime. */
  date: string;
  text: string;
  /** Always null — Places API (New) exposes no owner-reply field. */
  ownerResponse: string | null;
  /** e.g. "a month ago". Displaying this is recommended by Google's policy. */
  relativeDate?: string;
  authorPhotoUri?: string | null;
  authorUri?: string | null;
  /** This review on Google Maps. Required by policy when showing review text. */
  reviewUri?: string | null;
  /** Report this review to Google. */
  flagContentUri?: string | null;
}

export interface GoogleReviewsStore {
  storeCode: string;
  placeId: string;
  googleRating: number;
  totalReviews: number;
  googleMapsUri?: string | null;
  /** Place name Google matched, for transparency about the match. */
  matchedName?: string;
  /** Metres between the store's recorded geo and the matched place. */
  matchDistanceM?: number | null;
  /** Places returns at most five reviews, ordered by relevance. */
  reviewOrdering?: 'most_relevant';
  reviews: GoogleReview[];
}
