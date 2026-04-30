import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Layout as LayoutIcon, LogOut, BookOpen, Shield, BarChart3, User, Menu, X } from 'lucide-react';
import { Button } from './UI';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'لوحة التحكم', href: '/', icon: LayoutIcon },
    { name: 'الدورات التدريبية', href: '/courses', icon: BookOpen },
    ...(user?.role === 'admin' || user?.role === 'instructor' ? [
      { name: 'الإدارة', href: '/admin', icon: Shield }
    ] : []),
  ];

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bento-bg flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-bento-card border-l border-bento-border flex-col p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-bento-accent p-2 rounded-lg text-white">
            <Shield size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">منصة تحسين</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? 'bg-bento-accent/10 text-bento-accent'
                  : 'text-bento-muted hover:bg-gray-100'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-bento-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-bento-muted font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-right">{user?.name}</p>
              <p className="text-[10px] text-bento-muted uppercase tracking-wider text-right">{user?.role === 'admin' ? 'مدير' : user?.role === 'instructor' ? 'محاضر' : 'طالب'}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}>
            <LogOut size={18} className="ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-bento-card border-b border-bento-border p-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Shield className="text-bento-accent" size={20} />
            <span className="font-bold text-lg">منصة تحسين</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </header>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white p-6 pt-20">
          <button className="absolute top-6 left-6" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
          <nav className="space-y-4 text-center">
             {navigation.map(item => (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className="block text-2xl font-bold" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
             ))}
             <button className="text-red-500 text-2xl font-bold pt-10" onClick={handleLogout}>تسجيل الخروج</button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
