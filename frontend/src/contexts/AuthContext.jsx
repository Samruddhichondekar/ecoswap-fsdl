import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const readStoredUser = () => {
    try {
        const stored = localStorage.getItem('ecoswap_user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        localStorage.removeItem('ecoswap_user');
        return null;
    }
};

const persistSession = ({ token, user }) => {
    localStorage.setItem('ecoswap_token', token);
    localStorage.setItem('ecoswap_user', JSON.stringify(user));
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const clearSession = () => {
    localStorage.removeItem('ecoswap_token');
    localStorage.removeItem('ecoswap_user');
    delete axios.defaults.headers.common.Authorization;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readStoredUser);
    const [token, setToken] = useState(() => localStorage.getItem('ecoswap_token') || null);
    const [loading, setLoading] = useState(true);

    // Validate stored token on mount
    useEffect(() => {
        const validateToken = async () => {
            const storedToken = localStorage.getItem('ecoswap_token');
            if (!storedToken) {
                setLoading(false);
                return;
            }
            try {
                axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
                const res = await axios.get(`${API_URL}/api/auth/me`);
                const validatedUser = {
                    _id: res.data._id,
                    name: res.data.name,
                    email: res.data.email,
                    role: res.data.role || 'user',
                };
                setUser(validatedUser);
                setToken(storedToken);
                localStorage.setItem('ecoswap_user', JSON.stringify(validatedUser));
            } catch {
                // Token invalid / expired – clear session
                clearSession();
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };
        validateToken();
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, {
            email: email.trim().toLowerCase(),
            password
        });
        const { token: newToken, user: newUser } = res.data;
        persistSession({ token: newToken, user: newUser });
        setToken(newToken);
        setUser(newUser);
        return newUser;
    }, []);

    const register = useCallback(async (name, email, password, role = 'user') => {
        const res = await axios.post(`${API_URL}/api/auth/register`, {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role,
        });
        const { token: newToken, user: newUser } = res.data;
        persistSession({ token: newToken, user: newUser });
        setToken(newToken);
        setUser(newUser);
        return newUser;
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setToken(null);
        setUser(null);
    }, []);

    const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common.Authorization;
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            logout,
            authHeaders,
            isAuthenticated: !!user,
            loading,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
