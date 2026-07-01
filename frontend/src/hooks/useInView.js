import { useEffect, useRef, useState } from "react";

const defaultOptions = {};

export function useInView(options = defaultOptions) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -80px",
        ...options,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView];
}
