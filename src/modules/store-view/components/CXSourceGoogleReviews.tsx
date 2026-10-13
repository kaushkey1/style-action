import { useQuery } from '@tanstack/react-query';
import { Star, Loader2, ExternalLink, Flag } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { googleReviewKeys, fetchGoogleReviews } from '../api/googleReviewsApi';

import type { GoogleReview } from '../types/googleReviews.types';

/**
 * Google Maps text attribution.
 *
 * Required by the Places policy whenever Places content is shown outside a
 * Google Map. The wording, casing and colour are prescribed; `translate="no"`
 * stops browsers localising it, which the policy forbids.
 */
function GoogleMapsAttribution({ className }: { className?: string }): React.ReactNode {
  return (
    <span
      translate="no"
      className={cn('text-xs text-[#5E5E5E] whitespace-nowrap', className)}
    >
      Google Maps
    </span>
  );
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }): React.ReactNode {
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(iconSize, i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-400')}
          aria-hidden
        />
      ))}
    </div>
  );
}

/**
 * One review, with the attribution Google's policy requires: the author's
 * avatar and name linked to their profile, and a link to the review on Google
 * Maps. A reporting link is included as Google recommends.
 */
function ReviewCard({ review }: { review: GoogleReview }): React.ReactNode {
  const initial = review.reviewerName.charAt(0).toUpperCase();

  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {review.authorPhotoUri ? (
            <img
              src={review.authorPhotoUri}
              alt=""
              className="h-7 w-7 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            {review.authorUri ? (
              <a
                href={review.authorUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-900 leading-tight hover:underline truncate block"
              >
                {review.reviewerName}
              </a>
            ) : (
              <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                {review.reviewerName}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-xs text-gray-400">
                {review.relativeDate || formatDate(new Date(review.date))}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {review.reviewUri ? (
            <a
              href={review.reviewUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
              title="View this review on Google Maps"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">View on Google Maps</span>
            </a>
          ) : null}
          {review.flagContentUri ? (
            <a
              href={review.flagContentUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-700"
              title="Report this review to Google"
            >
              <Flag className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Report review</span>
            </a>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
    </div>
  );
}

interface CXSourceGoogleReviewsProps {
  storeCode: string;
}

export function CXSourceGoogleReviews({ storeCode }: CXSourceGoogleReviewsProps): React.ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: googleReviewKeys.store(storeCode),
    queryFn: () => fetchGoogleReviews(storeCode),
    staleTime: 30 * 60 * 1000,
    // These are slow warehouse/Places calls; a retry doubles the wait
    // without making an empty or failing result any more likely to succeed.
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Fetching Google reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Google Reviews Unavailable"
        description="Could not load Google reviews for this store. Please try again."
      />
    );
  }

  if (!data || data.totalReviews === 0) {
    return (
      <EmptyState
        title="No Google Reviews"
        description="No matching Google listing was found for this store."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-gray-900 tabular-nums">{data.googleRating}</span>
            <div>
              <StarRating rating={Math.round(data.googleRating)} size="lg" />
              <p className="text-xs text-gray-500 mt-0.5">
                {data.totalReviews.toLocaleString()} reviews
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <GoogleMapsAttribution />
            {data.googleMapsUri ? (
              <a
                href={data.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                View listing
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        {data.matchedName ? (
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Matched to &ldquo;{data.matchedName}&rdquo;
            {typeof data.matchDistanceM === 'number' ? ` · ${data.matchDistanceM}m from store` : ''}
          </p>
        ) : null}
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Reviews</h3>
          <GoogleMapsAttribution />
        </div>

        {/* Google's policy requires stating how reviews are ordered and filtered,
            and recommends noting that Google does not verify reviews. */}
        <p className="text-xs text-gray-500 mb-4">
          Showing the {data.reviews.length} most relevant reviews from Google Maps. Reviews are
          not verified by Google, which removes fake content when identified.
        </p>

        {data.reviews.length === 0 ? (
          <EmptyState title="No reviews" description="This listing has no written reviews yet." />
        ) : (
          <div className="space-y-3">
            {data.reviews.map((review, idx) => (
              <ReviewCard key={review.reviewUri ?? `${review.reviewerName}-${review.date}-${idx}`} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
