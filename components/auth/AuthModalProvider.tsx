"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LandingLoginModal } from "@/components/landing/LandingLoginModal";

export type AuthModalMode = "login" | "register";

type AuthModalContextValue = {
  openAuth: (mode?: AuthModalMode) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("login");

  const openAuth = useCallback((nextMode: AuthModalMode = "login") => {
    setMode(nextMode);
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
    setMode("login");
  }, []);

  const value = useMemo(() => ({ openAuth }), [openAuth]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <LandingLoginModal
        open={open}
        mode={mode}
        onModeChange={setMode}
        onClose={closeAuth}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal phải được dùng bên trong AuthModalProvider");
  }
  return context;
}
