/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Components
import AppLayout from './components/AppLayout';

// Pages
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import LessonPage from './pages/LessonPage';
import AdminPanel from './pages/AdminPanel';
import QuizPage from './pages/QuizPage';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'instructor') return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  const setAuth = useAuthStore(state => state.setAuth);
  const [initializing, setInitializing] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setAuth({
              id: fbUser.uid,
              email: fbUser.email!,
              name: userDoc.data().name,
              role: userDoc.data().role
            });
          } else {
            // Profile not found - auto-create it (recovery from partial registration)
            const role = (fbUser.email === 'tahyas68@gmail.com' || fbUser.email === 'admin@demo.com') ? 'admin' : 'student';
            const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم تعافى';
            
            try {
              await setDoc(doc(db, 'users', fbUser.uid), {
                name: name,
                email: fbUser.email,
                role: role,
                createdAt: serverTimestamp()
              });
            } catch (e) {
              console.error("Failed to auto-create missing profile:", e);
              // Fallback without Firestore doc is dangerous, but we allow them access temporarily
            }
            
            setAuth({
              id: fbUser.uid,
              email: fbUser.email!,
              name: name,
              role: role
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setAuth(null);
        }
      } else {
        setAuth(null);
      }
      setInitializing(false);
    });

    return () => unsub();
  }, [setAuth]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-bento-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-bento-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/courses/:id" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
        <Route path="/courses/:cid/lessons/:id" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
        <Route path="/quiz/:id" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminPanel /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
