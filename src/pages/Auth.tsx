import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, limit, query as fsQuery } from 'firebase/firestore';
import { Button, Card, Input } from '../components/UI';
import { Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  const handleAdminDemo = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, 'admin@demo.com', 'admin1234');
      toast.success('مرحباً بك في الحساب التجريبي!');
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, 'admin@demo.com', 'admin1234');
          await setDoc(doc(db, 'users', cred.user.uid), {
            name: 'مدير (حساب تجريبي)',
            email: 'admin@demo.com',
            role: 'admin',
            createdAt: serverTimestamp()
          });
          toast.success('تم تفعيل الحساب التجريبي بنجاح!');
          navigate('/');
        } catch (createError) {
          console.error(createError);
          toast.error('حدث خطأ أثناء تفعيل الحساب التجريبي.');
        }
      } else {
        toast.error('حدث خطأ أثناء الدخول التجريبي.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني أولاً في الحقل المخصص لإرسال رابط الاستعادة.');
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح!');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        toast.error('هذا البريد الإلكتروني غير مسجل لدينا.');
      } else {
        toast.error('حدث خطأ أثناء إرسال الرابط.');
      }
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('أهلاً بك مجدداً!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let message = 'فشل تسجيل الدخول. تأكد من صحة البيانات.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = 'خطأ في البريد الإلكتروني أو كلمة المرور.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bento-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-bento-accent text-white rounded-2xl shadow-lg shadow-bento-accent/20 mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-bento-text">منصة تحسين التعليمية</h1>
          <p className="text-bento-muted">سجل الدخول للمتابعة في رحلة التعلم</p>
        </div>

        <Card className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="space-y-1">
              <Input
                label="كلمة المرور"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="text-left w-full">
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="text-xs text-bento-accent hover:underline focus:outline-none"
                >
                  {resetting ? 'جاري الإرسال...' : 'نسيت كلمة المرور؟'}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              {!loading && <ArrowRight size={20} className="mr-2 rotate-180" />}
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">أو لتجنب مشاكل الدخول</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdminDemo}
              disabled={loading}
              className="w-full h-12 rounded-xl border-2 border-dashed border-bento-accent text-bento-accent font-bold hover:bg-bento-accent/10 transition-colors focus:outline-none"
            >
              دخول سريع كـ مدير (للتجربة)
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-bento-muted">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-bento-accent font-bold hover:underline">
                أنشئ حساباً مجانياً
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      try {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // If already in auth, try to sign in to see if profile is missing
          const loginCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          user = loginCredential.user;
          // Check if profile exists
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            toast.success('لديك حساب بالفعل! جاري توجيهك...');
            navigate('/');
            return;
          }
          // Profile missing - continue to step 2/3
        } else {
          throw authError;
        }
      }

      if (!user) return;

      // 2. Check if first user - make admin
      const usersSnap = await getDocs(fsQuery(collection(db, 'users'), limit(1)));
      const role = usersSnap.empty ? 'admin' : 'student';

      // 3. Create Firestore Profile
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        role: role,
        createdAt: serverTimestamp()
      });

      toast.success('تم إنشاء الحساب بنجاح!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let message = 'فشل إنشاء الحساب.';
      if (error.code === 'auth/weak-password') message = 'كلمة المرور ضعيفة جداً.';
      if (error.code === 'auth/invalid-email') message = 'البريد الإلكتروني غير صحيح.';
      if (error.code === 'auth/email-already-in-use') message = 'البريد الإلكتروني مستخدم مسبقاً.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = 'البريد الإلكتروني موجود مسبقاً، ولكن كلمة المرور غير صحيحة.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bento-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-bento-text">انضم إلى منصة تحسين التعليمية</h1>
          <p className="text-bento-muted">ابدأ بالتعلم من رواد الصناعة اليوم</p>
        </div>

        <Card className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="الاسم الكامل"
              placeholder="ياسين طه"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="8 أحرف كحد أدنى"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-bento-muted">
              هل لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-bento-accent font-bold hover:underline">
                سجل دخولك بدلاً من ذلك
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
