import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function NextRouterSync() {
  const location = useLocation();
  const nextRouter = useRouter();
  const nextPathname = usePathname();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (location.pathname !== nextPathname) {
      nextRouter.push(location.pathname + location.search + location.hash);
    }
  }, [location, nextRouter, nextPathname]);

  return null;
}
