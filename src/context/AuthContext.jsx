import { createContext, useContext, useState } from 'react';
import { login as requestLogin, register as requestRegister } from '../api/authApi';

const AuthContext = createContext(null);

function readSavedSession() {
  const token = localStorage.getItem('seculens_token');
  const savedUser = localStorage.getItem('seculens_user');

  try {
    return {
      token,
      user: savedUser ? JSON.parse(savedUser) : null
    };
  } catch (error) {
    localStorage.removeItem('seculens_token');
    localStorage.removeItem('seculens_user');
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSavedSession);

  const saveSession = (data) => {
    if (!data?.token || !data.user) {
      throw new Error('Le serveur n’a pas renvoyé une session valide.');
    }

    localStorage.setItem('seculens_token', data.token);
    localStorage.setItem('seculens_user', JSON.stringify(data.user));
    setSession({ token: data.token, user: data.user });
  };

  const login = async (email, password) => {
    const data = await requestLogin(email, password);
    saveSession(data);
  };

  const register = async (email, password) => {
    const data = await requestRegister(email, password);
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem('seculens_token');
    localStorage.removeItem('seculens_user');
    setSession({ token: null, user: null });
  };

  const value = {
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token && session.user),
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.');
  }
  return context;
}