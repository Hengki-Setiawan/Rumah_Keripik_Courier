import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, removeToken } from './storage';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  authState: AuthState;
	signIn: () => void;
	signOut: () => Promise<void>;
	devSignIn: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  authState: 'loading',
  signIn: () => {},
  signOut: async () => {},
  devSignIn: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    getToken().then((tok) => {
      setAuthState(tok ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  const signIn = () => setAuthState('authenticated');
  const signOut = async () => {
    await removeToken();
    setAuthState('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ authState, signIn, signOut, devSignIn: signIn }}>
      {children}
    </AuthContext.Provider>
  );
}
