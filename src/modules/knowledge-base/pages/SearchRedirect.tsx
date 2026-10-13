import { Navigate, useSearchParams } from 'react-router-dom';

/** The standalone Search page is dissolved — old links land on the Knowledge
    Base page, whose bar runs the same deep search (?q= auto-runs it). */
export function SearchRedirect(): React.ReactNode {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  return <Navigate to={`/knowledge-base/wiki${query ? `?${query}` : ''}`} replace />;
}
