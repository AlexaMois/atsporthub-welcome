import { useLocation } from "react-router-dom";

export function useBasePath(): string {
  const { pathname } = useLocation();
  return pathname.startsWith("/portal") ? "/portal" : "/dashboard/director";
}
