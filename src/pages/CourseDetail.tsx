import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, collection, query as fsQuery, orderBy } from 'firebase/firestore';
import { Card, Button } from '../components/UI';
import { PlayCircle, Lock, ChevronDown, ChevronUp, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'courses', id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        // Load sections
        const sectionsSnap = await getDocs(fsQuery(collection(db, `courses/${id}/sections`), orderBy('orderIndex')));
        const sectionsData = await Promise.all(sectionsSnap.docs.map(async sDoc => {
          const lessonsSnap = await getDocs(fsQuery(collection(db, `courses/${id}/sections/${sDoc.id}/lessons`), orderBy('orderIndex')));
          return {
            id: sDoc.id,
            ...sDoc.data(),
            lessons: lessonsSnap.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() }))
          };
        }));

        setCourse({ id: snap.id, ...snap.data(), sections: sectionsData });
        setExpandedSections(sectionsData.map((s: any) => s.id));
      } catch (error) {
        console.error(error);
        toast.error('فشل تحميل تفاصيل الدورة');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) ? prev.filter(i => i !== sectionId) : [...prev, sectionId]
    );
  };

  if (loading) return <div className="text-center py-20 font-bold">جاري تحميل الدورة...</div>;
  if (!course) return <div className="text-center py-20 font-bold">الدورة غير موجودة</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <Link to="/" className="text-sm text-bento-muted hover:text-bento-accent flex items-center gap-1">
          <BookOpen size={14} className="ml-1" /> العودة للوحة التحكم
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
        <p className="text-lg text-bento-muted font-medium">{course.description}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          منهج الشرح
          <span className="text-sm font-normal text-bento-muted">
            • {course.sections?.reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0)} درس
          </span>
        </h2>

        {course.sections?.map((section: any) => (
          <div key={section.id} className="border border-bento-border rounded-xl overflow-hidden bg-white shadow-sm">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-bento-accent/10 text-bento-accent flex items-center justify-center font-bold text-sm">
                  {section.orderIndex}
                </div>
                <span className="font-bold text-bento-text">{section.title}</span>
              </div>
              {expandedSections.includes(section.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.includes(section.id) && (
              <div className="divide-y divide-gray-50">
                {section.lessons?.map((lesson: any) => (
                  <Link 
                    key={lesson.id} 
                    to={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle size={18} className="text-bento-muted group-hover:text-bento-accent" />
                      <span className="text-sm font-medium">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-bento-muted">
                      <span className="flex items-center gap-1"><Clock size={12} className="ml-1" /> 15 دقيقة</span>
                      <Button variant="ghost" size="sm">شاهد الآن</Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
