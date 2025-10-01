"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface LayoutContextType {
  sidePanelOpen: boolean;
  setSidePanelOpen: (open: boolean) => void;
  toggleSidePanel: () => void;
  isSignIn: boolean;
  isAuthenticated: boolean;
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const updateAuth = () => {
      const path = window.location.pathname.toLowerCase();
      const newIsSignIn = path === "/signin";
      const newIsAuthenticated = !!localStorage.getItem("employee_token");

      setIsSignIn(newIsSignIn);
      setIsAuthenticated(newIsAuthenticated);

      // Reset navigation state immediately when we navigate away from SignIn
      if (!newIsSignIn && isSignIn) {
        setIsNavigating(false);
      }
    };

    // Call updateAuth immediately
    updateAuth();

    // Also listen for route changes via pushstate/replacestate
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(updateAuth, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(updateAuth, 0);
    };

    window.addEventListener("storage", updateAuth);
    window.addEventListener("focus", updateAuth);
    window.addEventListener("popstate", updateAuth);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("focus", updateAuth);
      window.removeEventListener("popstate", updateAuth);
    };
  }, [isSignIn]);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && sidePanelOpen) {
        setSidePanelOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidePanelOpen]);

  const toggleSidePanel = () => {
    setSidePanelOpen((open) => !open);
  };

  return (
    <LayoutContext.Provider
      value={{
        sidePanelOpen,
        setSidePanelOpen,
        toggleSidePanel,
        isSignIn,
        isAuthenticated,
        isNavigating,
        setIsNavigating,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
}
