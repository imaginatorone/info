import { useEffect, useState } from "react";

export function useIdleGuide(entered: boolean) {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (entered) return;

    let shown = false;
    let timer = window.setTimeout(() => {
      shown = true;
      setHint(true);
    }, 1900);

    const visibility = () => {
      window.clearTimeout(timer);
      if (shown || document.hidden) return;
      timer = window.setTimeout(() => {
        shown = true;
        setHint(true);
      }, 700);
    };

    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [entered]);

  return !entered && hint;
}
