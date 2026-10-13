/**
 * Client-side route prefix for AOP pages.
 * Command sidebar uses `/command/aop`; Plan uses `/aop`. Backend API paths stay `/aop/...`.
 */
export function getAopAppBasePath(pathname: string): "/command/aop" | "/aop" {
  return pathname.startsWith("/command/aop") ? "/command/aop" : "/aop";
}
