import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const TOKEN_KEY = "inventory_pos.token";
const MUST_CHANGE_PASSWORD_KEY = "inventory_pos.must_change_password";

interface AuthContextValue {
  isLoading: boolean;
  token: string | null;
  mustChangePassword: boolean;
  signIn: (token: string, mustChangePassword: boolean) => Promise<void>;
  completePasswordChange: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedToken, storedFlag] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(MUST_CHANGE_PASSWORD_KEY),
      ]);
      setToken(storedToken);
      setMustChangePassword(storedFlag === "true");
      setIsLoading(false);
    })();
  }, []);

  const signIn = async (newToken: string, newMustChangePassword: boolean) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(MUST_CHANGE_PASSWORD_KEY, String(newMustChangePassword));
    setToken(newToken);
    setMustChangePassword(newMustChangePassword);
  };

  const completePasswordChange = async (newToken: string) => {
    await signIn(newToken, false);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, MUST_CHANGE_PASSWORD_KEY]);
    setToken(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{ isLoading, token, mustChangePassword, signIn, completePasswordChange, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
