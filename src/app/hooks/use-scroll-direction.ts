"use client";

import { useEffect, useRef, useState } from "react";

interface UseScrollDirectionOptions {
  topThreshold?: number;
  delta?: number;
}

/**
 * Indica se o header deve ficar escondido: esconde ao rolar para baixo,
 * reaparece ao rolar para cima, nunca esconde perto do topo da página.
 */
export function useScrollDirection({
  topThreshold = 80,
  delta = 5,
}: UseScrollDirectionOptions = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY < topThreshold) {
          setHidden(false);
        } else if (Math.abs(currentY - lastY.current) > delta) {
          setHidden(currentY > lastY.current);
        }

        lastY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [topThreshold, delta]);

  return hidden;
}
