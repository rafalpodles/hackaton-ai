"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface GeocitiesContextValue {
  enabled: boolean;
  toggle: () => void;
}

const GeocitiesContext = createContext<GeocitiesContextValue>({
  enabled: false,
  toggle: () => {},
});

export function useGeocities() {
  return useContext(GeocitiesContext);
}

export function GeocitiesProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("geocities-mode");
    if (stored === "true") {
      setEnabled(true);
      document.documentElement.classList.add("geocities");
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("geocities-mode", String(next));
      if (next) {
        document.documentElement.classList.add("geocities");
      } else {
        document.documentElement.classList.remove("geocities");
      }
      return next;
    });
  }, []);

  return (
    <GeocitiesContext.Provider value={{ enabled, toggle }}>
      {children}
    </GeocitiesContext.Provider>
  );
}
