import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User, LoginCredentials, RegisterData } from "../types";
import { api } from "../api";

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  adminLogin: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;

  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= RESTORE SESSION =================
  useEffect(() => {
    const userToken = localStorage.getItem("access");
    const adminToken = localStorage.getItem("admin_access");

    // ADMIN SESSION
    if (adminToken) {
      setUser({
        role: "admin",
      } as User);
      setLoading(false);
      return;
    }

    // USER SESSION
    if (userToken) {
      api
        .getCurrentUser()
        .then(setUser)
        .catch(() => {
          api.logout();
          setUser(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    setLoading(false);
  }, []);

  // ================= USER LOGIN =================
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);

    await api.login(credentials);
    const user = await api.getCurrentUser();
    setUser(user);

    setLoading(false);
  };

  // ================= ADMIN LOGIN =================
  const adminLogin = async (credentials: {
    username: string;
    password: string;
  }) => {
    setLoading(true);

    await api.adminLogin(credentials);

    setUser({
      role: "admin",
    } as User);

    setLoading(false);
  };

  // ================= REGISTER =================
  const register = async (data: RegisterData) => {
    setLoading(true);

    await api.register(data);
    const user = await api.getCurrentUser();
    setUser(user);

    setLoading(false);
  };

  // ================= GOOGLE LOGIN =================
  const googleLogin = async (token: string) => {
    setLoading(true);

    await api.googleLogin(token);
    const user = await api.getCurrentUser();
    setUser(user);

    setLoading(false);
  };

  // ================= LOGOUT =================
  const logout = () => {
    api.logout();
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("admin_access");
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        register,
        googleLogin,
        logout,
        updateUser,
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
