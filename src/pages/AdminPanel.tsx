import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query as fsQuery, 
  orderBy, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { Card, Button, Input } from '../components/UI';
import { Plus, Trash2, Edit3, Key, Users, Settings, PackagePlus, BookOpen, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'codes'>('courses');
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  
  // States for new/edit items
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [newSection, setNewSection] = useState({ title: '', orderIndex: 0 });
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '', orderIndex: 0 });
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lessonInputMode, setLessonInputMode] = useState<'upload' | 'url'>('upload');

  // States for new access code
  const [newCodeCourseId, setNewCodeCourseId] = useState('');
  const [codePrefix, setCodePrefix] = useState('');
  
  // State for deletion confirmation
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'courses') {
        const q = fsQuery(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'users') {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'codes') {
        const snap = await getDocs(collection(db, 'accessCodes'));
        setAccessCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Ensure courses are loaded for the dropdown
        if (courses.length === 0) {
          const cSnap = await getDocs(collection(db, 'courses'));
          setCourses(cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل بيانات الإدارة');
    }
  };

  const handleGenerateCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeCourseId) return toast.error('يرجى اختيار الدورة');
    
    // Generate a random code: PREFIX-Random8chars
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const finalCode = codePrefix ? `${codePrefix.toUpperCase()}-${randomStr}` : randomStr;

    try {
      await setDoc(doc(db, 'accessCodes', finalCode), {
        courseId: newCodeCourseId,
        redeemedBy: null,
        createdAt: serverTimestamp()
      });
      toast.success('تم توليد كود الاشتراك بنجاح');
      setCodePrefix('');
      fetchData();
    } catch (error) {
       toast.error('فشل توليد الكود');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (deletingCourseId !== courseId) {
       setDeletingCourseId(courseId);
       setTimeout(() => setDeletingCourseId(null), 3000); // 3 seconds to confirm
       return;
    }
    
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      toast.success('تم حذف الدورة بنجاح');
      setDeletingCourseId(null);
      fetchData();
    } catch (error) {
       toast.error('فشل عملية الحذف');
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), {
          title: newCourse.title,
          description: newCourse.description,
        });
        toast.success('تم تحديث الدورة بنجاح');
      } else {
        await addDoc(collection(db, 'courses'), {
          ...newCourse,
          createdAt: serverTimestamp()
        });
        toast.success('تم إنشاء الدورة بنجاح');
      }
      setNewCourse({ title: '', description: '' });
      setEditingCourseId(null);
      fetchData();
    } catch (error) {
      toast.error('فشل حفظ الدورة');
    }
  };

  const handleEditCourseClick = (course: any) => {
    setEditingCourseId(course.id);
    setNewCourse({ title: course.title, description: course.description });
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setNewCourse({ title: '', description: '' });
  };

  const loadCourseFull = async (id: string) => {
    const docRef = doc(db, 'courses', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    
    // Load sections
    const sectionsSnap = await getDocs(fsQuery(collection(db, `courses/${id}/sections`), orderBy('orderIndex')));
    const sections = await Promise.all(sectionsSnap.docs.map(async sDoc => {
      const lessonsSnap = await getDocs(fsQuery(collection(db, `courses/${id}/sections/${sDoc.id}/lessons`), orderBy('orderIndex')));
      return {
        id: sDoc.id,
        ...sDoc.data(),
        lessons: lessonsSnap.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() }))
      };
    }));

    setSelectedCourse({ id: snap.id, ...snap.data(), sections });
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await addDoc(collection(db, `courses/${selectedCourse.id}/sections`), {
        ...newSection,
        createdAt: serverTimestamp()
      });
      toast.success('تم إضافة القسم');
      setNewSection({ title: '', orderIndex: 0 });
      loadCourseFull(selectedCourse.id);
    } catch (error) {
      toast.error('فشل إضافة القسم');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
       return toast.error('يرجى رفع ملف فيديو صالح');
    }

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../lib/firebase');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `courses/${selectedCourse?.id}/lessons/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error: any) => {
          console.error('Upload error:', error);
          toast.error(`فشل الرفع: ${error.message || 'خطأ غير معروف'}`);
          setUploadingVideo(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setNewLesson(prev => ({ ...prev, videoUrl: downloadURL }));
            setUploadingVideo(false);
            toast.success('تم رفع الفيديو بنجاح');
          } catch (urlError: any) {
            console.error('URL error:', urlError);
            toast.error(`فشل الحصول على الرابط: ${urlError.message}`);
            setUploadingVideo(false);
          }
        }
      );

    } catch (error: any) {
       console.error('Catch error:', error);
       toast.error(`حدث خطأ: ${error.message || 'مشكلة في بدء الرفع'}`);
       setUploadingVideo(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionId || !selectedCourse) return;
    try {
      await addDoc(collection(db, `courses/${selectedCourse.id}/sections/${activeSectionId}/lessons`), {
        ...newLesson,
        createdAt: serverTimestamp()
      });
      toast.success('تم إضافة الدرس بنجاح');
      setNewLesson({ title: '', videoUrl: '', orderIndex: 0 });
      setActiveSectionId(null);
      loadCourseFull(selectedCourse.id);
    } catch (error) {
      toast.error('فشل إضافة الدرس');
    }
  };

  const handleGenerateCode = async (courseId: string) => {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, 'accessCodes', code), {
        code,
        courseId,
        redeemedBy: null,
        createdAt: serverTimestamp()
      });
      toast.success(`تم توليد الكود: ${code}`, { duration: 10000 });
    } catch (error) {
      toast.error('فشل توليد الكود');
    }
  };

  if (selectedCourse) {
     return (
        <div className="space-y-6 text-right">
           <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="mb-4">
              <ChevronRight size={18} className="ml-2 rotate-180" /> العودة للدورات
           </Button>
           
           <div className="flex justify-between items-end border-b border-gray-100 pb-6">
              <div>
                 <h1 className="text-3xl font-bold">{selectedCourse.title}</h1>
                 <p className="text-bento-muted mt-1">إدارة الأقسام والدروس والمحتوى التعليمي</p>
              </div>
              <Button onClick={() => handleGenerateCode(selectedCourse.id)} className="bg-bento-accent">
                 <Key size={18} className="ml-2" /> توليد كود دخول
              </Button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to add Section */}
              <div className="lg:col-span-1 space-y-6">
                 <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                       <Plus size={18} className="text-bento-accent" /> إضافة قسم جديد
                    </h3>
                    <form onSubmit={handleAddSection} className="space-y-4">
                       <Input 
                          label="عنوان القسم" 
                          value={newSection.title}
                          onChange={e => setNewSection({...newSection, title: e.target.value})}
                          placeholder="مثلاً: الفصل الأول"
                          required
                       />
                       <Input 
                          label="الترتيب" 
                          type="number"
                          value={newSection.orderIndex}
                          onChange={e => setNewSection({...newSection, orderIndex: parseInt(e.target.value)})}
                          required
                       />
                       <Button type="submit" className="w-full">حفظ القسم</Button>
                    </form>
                 </Card>
              </div>

              {/* Course Structure */}
              <div className="lg:col-span-2 space-y-4">
                 {selectedCourse.sections?.length === 0 && (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center text-bento-muted">
                       لا توجد أقسام في هذه الدورة بعد. ابدأ بإضافة قسم.
                    </div>
                 )}
                 
                 {selectedCourse.sections?.map((section: any) => (
                    <div key={section.id} className="border border-bento-border rounded-xl bg-white overflow-hidden">
                       <div className="bg-gray-50/50 p-4 flex items-center justify-between border-b border-gray-100">
                          <h4 className="font-bold">قسم {section.order_index}: {section.title}</h4>
                          <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={() => setActiveSectionId(section.id)}
                             className="text-[10px]"
                          >
                             <Plus size={14} className="ml-1" /> إضافة درس
                          </Button>
                       </div>

                       <div className="divide-y divide-gray-50">
                          {section.lessons?.map((lesson: any) => (
                             <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-bento-accent" />
                                   <span className="text-sm font-medium">{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-bento-muted font-mono">
                                      {lesson.videoUrl.substring(0, 20)}...
                                   </span>
                                   <Button variant="ghost" size="sm" className="text-red-500"><Trash2 size={14} /></Button>
                                </div>
                             </div>
                          ))}
                          
                          {activeSectionId === section.id && (
                             <div className="p-6 bg-bento-accent/5 border-t border-bento-accent/10">
                                <form onSubmit={handleAddLesson} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <Input 
                                      label="عنوان الدرس" 
                                      value={newLesson.title}
                                      onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                                      required
                                   />
                                   <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                         <label className="text-[10px] uppercase tracking-widest font-bold text-bento-muted">الفيديو</label>
                                         <div className="flex gap-2 text-xs">
                                            <button 
                                              type="button" 
                                              onClick={() => setLessonInputMode('upload')} 
                                              className={lessonInputMode === 'upload' ? 'text-bento-accent font-bold' : 'text-bento-muted'}
                                            >رفع ملف</button>
                                            <span className="text-gray-300">|</span>
                                            <button 
                                              type="button" 
                                              onClick={() => setLessonInputMode('url')} 
                                              className={lessonInputMode === 'url' ? 'text-bento-accent font-bold' : 'text-bento-muted'}
                                            >رابط خارجي</button>
                                         </div>
                                      </div>

                                      {lessonInputMode === 'url' ? (
                                         <Input 
                                            placeholder="أدخل رابط فيديو (يوتيوب أو رابط مباشر)"
                                            value={newLesson.videoUrl}
                                            onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})}
                                            required
                                         />
                                      ) : newLesson.videoUrl ? (
                                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                                           <span className="text-xs font-bold">تم إرفاق الفيديو بنجاح ✓</span>
                                           <Button type="button" variant="ghost" size="sm" onClick={() => setNewLesson({...newLesson, videoUrl: ''})} className="text-red-500 hover:bg-red-50 ml-auto h-6 text-xs">حذف وإعادة رفع</Button>
                                        </div>
                                      ) : (
                                        <div className="relative">
                                           <input 
                                             type="file" 
                                             accept="video/*"
                                             onChange={handleVideoUpload}
                                             disabled={uploadingVideo}
                                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                           />
                                           <div className={`w-full px-4 py-2 bg-white border border-dashed rounded-lg text-sm text-center flex flex-col items-center justify-center min-h-[80px] bg-gray-50 transition-colors ${uploadingVideo ? 'border-bento-accent bg-bento-accent/5' : 'border-gray-300 hover:border-bento-accent hover:bg-gray-50'}`}>
                                             {uploadingVideo ? (
                                                <div className="space-y-2 w-full">
                                                  <div className="text-xs text-bento-accent font-bold">جاري الرفع... {uploadProgress}%</div>
                                                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-bento-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                  </div>
                                                </div>
                                             ) : (
                                                <>
                                                  <span className="font-bold text-bento-muted mb-1">اضغط هنا لاختيار ملف فيديو</span>
                                                  <span className="text-[10px] text-gray-400">MP4, WebM, OGG</span>
                                                </>
                                             )}
                                           </div>
                                        </div>
                                      )}
                                   </div>
                                   <div className="md:col-span-2 flex justify-end gap-2">
                                      <Button type="button" variant="ghost" onClick={() => setActiveSectionId(null)}>إلغاء</Button>
                                      <Button type="submit" disabled={uploadingVideo || !newLesson.videoUrl}>إضافة الدرس</Button>
                                   </div>
                                </form>
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="space-y-8 text-right">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
          <p className="text-bento-muted font-medium">إدارة موارد المنصة والمستفيدين</p>
        </div>
        <div className="flex bg-white border border-bento-border rounded-xl p-1 shadow-sm">
          {[
            { id: 'courses', icon: PackagePlus, label: 'الدورات' },
            { id: 'users', icon: Users, label: 'المستخدمين' },
            { id: 'codes', icon: Key, label: 'أكواد الدخول' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id ? 'bg-bento-accent text-white shadow-md' : 'text-bento-muted hover:bg-gray-50'
              }`}
            >
              <tab.icon size={14} className={activeTab === tab.id ? '' : 'text-bento-accent'} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="space-y-6 sticky top-8">
              <h3 className="font-bold text-lg border-b border-gray-50 pb-2">
                {editingCourseId ? 'تعديل الدورة' : 'دورة جديدة'}
              </h3>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <Input 
                  label="عنوان الدورة" 
                  value={newCourse.title} 
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})} 
                  placeholder="مثلاً: تصميم قواعد البيانات"
                />
                <div className="space-y-1 text-right">
                   <label className="text-[10px] uppercase tracking-widest font-bold text-bento-muted">الوصف</label>
                   <textarea 
                     className="w-full px-4 py-2 bg-white border border-bento-border rounded-lg text-sm h-32 focus:ring-2 focus:ring-bento-accent/20 outline-none transition-all"
                     value={newCourse.description}
                     onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                     placeholder="وصف مختصر لأهداف الدورة..."
                   />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 h-11">
                    {editingCourseId ? 'حفظ التعديلات' : 'إنشاء الدورة'}
                  </Button>
                  {editingCourseId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="h-11">إلغاء</Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-xl px-2">الدورات الحالية</h3>
            {courses.map(course => (
              <Card key={course.id} className={`flex items-center justify-between group transition-colors ${editingCourseId === course.id ? 'border-bento-accent ring-1 ring-bento-accent' : 'hover:border-bento-accent'}`}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-bento-accent/5 rounded-xl flex items-center justify-center text-bento-accent">
                      <BookOpen size={24} />
                   </div>
                   <div>
                     <h4 className="font-bold text-lg">{course.title}</h4>
                     <p className="text-xs text-bento-muted font-mono">{course.id}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={() => loadCourseFull(course.id)} className="text-bento-muted hover:text-bento-accent flex items-center gap-1">
                      <BookOpen size={16} /> إدارة المحتوى
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => handleEditCourseClick(course)} className="text-blue-500 hover:bg-blue-50">
                      <Edit3 size={16} /> تعديل
                   </Button>
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteCourse(course.id)} 
                      className={`hover:bg-red-50 ${deletingCourseId === course.id ? 'bg-red-500 text-white hover:bg-red-600 hover:text-white' : 'text-red-500'}`}
                   >
                      <Trash2 size={16} /> {deletingCourseId === course.id ? 'تأكيد الحذف' : 'حذف'}
                   </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden border-bento-border">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 border-b border-bento-border">
              <tr className="text-[10px] uppercase tracking-widest font-bold text-bento-muted">
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">تاريخ الانضمام</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-bento-accent/10 text-bento-accent flex items-center justify-center font-bold text-sm">
                          {u.name?.[0]}
                       </div>
                       <div>
                          <div className="font-bold text-sm">{u.name}</div>
                          <div className="text-xs text-bento-muted font-mono">{u.email}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {u.role === 'admin' ? 'مدير' : u.role === 'instructor' ? 'محاضر' : 'طالب'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-bento-muted font-medium">
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('ar-EG') : 'قيد المعالجة'}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100"><Settings size={14} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'codes' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Key size={18} className="text-bento-accent" /> توليد أکواد دخول للدورات
            </h3>
            <form onSubmit={handleGenerateCustomCode} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-50 mt-4 pt-4">
               <div>
                  <label className="block text-sm font-bold text-bento-text mb-2">اختر الدورة <span className="text-red-500">*</span></label>
                  <select 
                     className="w-full bg-gray-50 border border-gray-200 text-bento-text rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-bento-accent/50 focus:border-bento-accent transition-all"
                     value={newCodeCourseId}
                     onChange={(e) => setNewCodeCourseId(e.target.value)}
                     required
                  >
                     <option value="">-- يرجى اختيار دورة --</option>
                     {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                     ))}
                  </select>
               </div>
               <Input 
                  label="بادئة الكود (اختياري)" 
                  value={codePrefix}
                  onChange={e => setCodePrefix(e.target.value)}
                  placeholder="مثال: VIP أو CS101"
               />
               <div className="flex items-end">
                 <Button type="submit" className="w-full h-12 flex-1"><Plus size={18} className="ml-2" /> توليد كود جديد</Button>
               </div>
            </form>
          </Card>

          <Card className="p-0 overflow-hidden border-bento-border">
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-50 border-b border-bento-border">
                <tr className="text-[10px] uppercase tracking-widest font-bold text-bento-muted">
                  <th className="px-6 py-4">الكود</th>
                  <th className="px-6 py-4">الدورة المرتبطة</th>
                  <th className="px-6 py-4">حالة التفعيل</th>
                  <th className="px-6 py-4">تاريخ التوليد/التفعيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {accessCodes.map(code => {
                  const course = courses.find(c => c.id === code.courseId);
                  const isRedeemed = !!code.redeemedBy;
                  return (
                    <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono bg-gray-100 text-gray-800 px-3 py-1 rounded-md font-bold tracking-wider text-sm border border-gray-200">
                          {code.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {course?.title || <span className="text-red-400">دورة محذوفة</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isRedeemed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isRedeemed ? 'مُفعَّل' : 'غير مستخدم'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-bento-muted font-medium flex flex-col space-y-1">
                        <span>توليد: {code.createdAt?.toDate ? code.createdAt.toDate().toLocaleDateString('ar-EG') : '-'}</span>
                        {isRedeemed && <span>تفعيل: {code.redeemedAt?.toDate ? code.redeemedAt.toDate().toLocaleDateString('ar-EG') : '-'}</span>}
                      </td>
                    </tr>
                  );
                })}
                {accessCodes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-bento-muted bg-gray-50/30">
                      لا يوجد أي أكواد تفعيل بعد الدورة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
