import { useLocation } from 'react-router-dom';
import environment from '@/environment';

/** Old /designs bookmarks retain their deep link. Opening requires a click so
 * browsers do not block the new tab as a popup. */
export default function OpenDesignApp() {
  const location = useLocation();
  if (!environment.DESIGN_APP_URL) return <p>Design is not configured for this environment yet.</p>;
  const destination = new URL(environment.DESIGN_APP_URL, window.location.origin);
  destination.pathname = destination.pathname.replace(/\/$/, '') + location.pathname.slice('/designs'.length);
  destination.search = location.search;
  destination.searchParams.delete('embedded');
  destination.hash = location.hash;
  return <section className="space-y-4">
    <h1 className="text-2xl font-semibold">Design</h1>
    <p>Open Design collections in a new tab.</p>
    <a className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-white"
      href={destination.href} target="_blank" rel="noopener noreferrer">Open Design ↗</a>
  </section>;
}
