import { createContext, useContext, useState, type ReactNode } from "react";

const AUTH_STORAGE_KEY = "ddi-platform-auth-user";

interface LocalAccount {
  username: string;
  password: string;
  displayName: string;
  role: string;
}

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
}

interface LoginResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => LoginResult;
  logout: () => void;
  demoCredentials: { username: string; password: string } | null;
}

const configuredUsername = import.meta.env.VITE_AUTH_USERNAME?.trim();
const configuredPassword = import.meta.env.VITE_AUTH_PASSWORD?.trim();

const localAccounts: LocalAccount[] = configuredUsername && configuredPassword
  ? [
      {
        username: configuredUsername,
        password: configuredPassword,
        displayName: "Verified User",
        role: "Configured",
      },
    ]
  : [
      {
        username: "everest.user",
        password: "DDI2026!",
        displayName: "Everest Verified User",
        role: "Local",
      },
    ];

const demoCredentials = configuredUsername && configuredPassword
  ? null
  : { username: "everest.user", password: "DDI2026!" };

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  function login(username: string, password: string): LoginResult {
    const normalizedUsername = username.trim();
    const account = localAccounts.find((item) => item.username === normalizedUsername && item.password === password);

    if (!account) {
      return { ok: false, message: "账号或密码错误，请重新验证。" };
    }

    const nextUser: AuthUser = {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
    };

    setUser(nextUser);
    persistUser(nextUser);
    return { ok: true };
  }

  function logout() {
    setUser(null);
    persistUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
        demoCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
