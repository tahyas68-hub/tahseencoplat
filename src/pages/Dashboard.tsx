import React, { useEffect, useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { db } from '../lib/firebase';
import { collection, getDocs, query as fsQuery, orderBy, where, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { BookOpen, Clock, BarChart, ChevronRight, ShieldAlert, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { AdBanner } from '../components/AdBanner';

export default function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      if (!user) return;
      
      let coursesData: any[] = [];
      
      if (user.role === 'admin' || user.role === 'instructor') {
        // Admins and instructors see all courses
        const q = fsQuery(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        coursesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        // Students see only enrolled courses via redeemed access codes
        const codesQuery = fsQuery(collection(db, 'accessCodes'), where('redeemedBy', '==', user.id));
        const codesSnap = await getDocs(codesQuery);
        
        const courseIds = codesSnap.docs.map(doc => doc.data().courseId).filter(Boolean);
        
        if (courseIds.length > 0) {
          // Fetch the actual courses (could be optimized, but this works for typical # of courses)
          const fetchedCourses = await Promise.all(
            courseIds.map(async (cid) => {
              const cDoc = await getDoc(doc(db, 'courses', cid));
              return cDoc.exists() ? { id: cDoc.id, ...cDoc.data() } : null;
            })
          );
          coursesData = fetchedCourses.filter(Boolean);
        }
      }
      setCourses(coursesData);
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل الدورات التدريبية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim() || !user) return;
    
    setRedeeming(true);
    try {
      const codeRef = doc(db, 'accessCodes', accessCode.trim());
      const codeSnap = await getDoc(codeRef);
      
      if (!codeSnap.exists()) {
        toast.error('الكود غير صحيح أو لا يوجد في النظام');
        return;
      }
      
      const codeData = codeSnap.data();
      if (codeData.redeemedBy) {
         if (codeData.redeemedBy === user.id) {
            toast.success('لقد قمت بتفعيل هذا الكود مسبقاً');
         } else {
            toast.error('هذا الكود تم استخدامه من قبل مستخدم آخر');
         }
         return;
      }
      
      // Redeem the code
      await updateDoc(codeRef, {
        redeemedBy: user.id,
        redeemedAt: serverTimestamp()
      });
      
      toast.success('تم تفعيل الكود والاشتراك في الدورة بنجاح!');
      setAccessCode('');
      fetchCourses(); // reload courses
    } catch (error) {
      console.error("Redeem error:", error);
      toast.error('حدث خطأ أثناء محاولة تفعيل الكود');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-bento-text">أهلاً بك مجدداً، {user?.name || 'أيها المتعلم'}</h1>
        <p className="text-bento-muted">{user?.role === 'admin' ? 'مرحباً بك في لوحة تحكم الإدارة. يمكنك استعراض المنصة أو الانتقال لإعدادات الإدارة.' : 'أكمل من حيث توقفت'}</p>
      </div>

      {user?.role === 'admin' && (
        <Card className="bg-bento-accent/10 border-bento-accent/20 flex flex-col md:flex-row items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-accent text-white rounded-full">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-bento-accent">أنت تسجل الدخول كمسؤول</h2>
              <p className="text-sm text-bento-muted">يمكنك إدارة الدورات التدريبية، المستخدمين، والمحتوى من خلال لوحة الإدارة.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/admin')} className="shrink-0">
            الانتقال للوحة الإدارة
          </Button>
        </Card>
      )}

      {user?.role === 'student' && (
        <Card className="bg-white border-bento-border p-6 mt-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-bento-accent/10 text-bento-accent rounded-lg">
                  <Key size={20} />
                </div>
                <h2 className="text-xl font-bold text-bento-text">تفعيل دورة جديدة</h2>
              </div>
              <p className="text-sm text-bento-muted">أدخل كود الاشتراك الذي حصلت عليه لفتح محتوى الدورة والبدء فوراً.</p>
            </div>
            <form onSubmit={handleRedeemCode} className="w-full md:w-auto flex gap-3">
              <Input
                placeholder="أدخل الكود هنا (مثال: CS-2024-X)"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full md:w-64"
                disabled={redeeming}
                required
              />
              <Button type="submit" disabled={redeeming || !accessCode.trim()} className="shrink-0">
                {redeeming ? 'جاري التفعيل...' : 'تفعيل الكود'}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* نموذج لمساحة إعلانية */}
      <AdBanner className="my-8" />

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`}>
              <Card className="h-full flex flex-col hover:border-bento-accent transition-all hover:shadow-md group">
                <div className="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                  <BookOpen size={48} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                  <p className="text-sm text-bento-muted line-clamp-2">{course.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-bento-muted">
                    <BarChart size={14} className="text-bento-success" />
                    التقدم
                  </div>
                  <div className="text-sm font-bold text-bento-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                    زيارة <ChevronRight size={16} className="rotate-180" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
           <p className="text-bento-muted mb-4">لم تقم بالاشتراك في أي دورات تدريبية بعد.</p>
           {user?.role === 'admin' && <Button onClick={() => navigate('/admin')}>إضافة دورة جديدة</Button>}
        </Card>
      )}
    </div>
  );
}
