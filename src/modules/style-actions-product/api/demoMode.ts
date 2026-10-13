/** Explicit local preview opt-in; never replaces the API in production or tests. */
export const STYLE_ACTIONS_DEMO = import.meta.env.DEV
  && import.meta.env.MODE !== 'test'
  && import.meta.env.VITE_STYLE_ACTIONS_DEMO === 'true';
