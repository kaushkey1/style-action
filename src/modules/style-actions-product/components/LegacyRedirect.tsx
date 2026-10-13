import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import { legacyHref } from './display';

type LegacyRoute = Parameters<typeof legacyHref>[0];

/** The earlier tab routes land in the workspace with the matching drawer, store or segment open. */
export function LegacyRedirect({ route }: { readonly route: LegacyRoute }): React.ReactNode {
  const [search] = useSearchParams();
  const { storeCode, optionCode } = useParams();
  const href = legacyHref(route, { store: storeCode ?? search.get('store'), cohort: search.get('cohort'), option: optionCode });
  return <Navigate to={href} replace />;
}
