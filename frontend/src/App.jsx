import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BrowseItems from './pages/BrowseItems';
import AddItem from './pages/AddItem';
import MyItems from './pages/MyItems';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CloudSecurity from './pages/CloudSecurity';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = React.createContext();

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AuthRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function AppContent() {
    const [toasts, setToasts] = useState([]);

    const addToast = (message) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter(t => t.id !== id));
        }, 3500);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            <Router>
                <div className="page-wrapper">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/browse" element={<BrowseItems />} />
                            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                            <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
                            <Route path="/add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
                            <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
                            <Route path="/security" element={<ProtectedRoute><CloudSecurity /></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    <Footer />

                    <div className="toast-container" aria-live="polite" aria-atomic="true">
                        {toasts.map(t => (
                            <div key={t.id} className="toast">{t.message}</div>
                        ))}
                    </div>
                </div>
            </Router>
        </ToastContext.Provider>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
