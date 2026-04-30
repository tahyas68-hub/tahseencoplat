import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Button, Card } from '../components/UI';
import { Play, Pause, Volume2, Maximize, RotateCcw, ChevronLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LessonPage() {
  const { cid, id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        if (!cid || !id) return;
        
        // 1. Fetch all sections of the course
        const sectionsSnap = await getDocs(collection(db, `courses/${cid}/sections`));
        
        // 2. Search for the lesson in these sections
        let foundLesson = null;
        for (const sDoc of sectionsSnap.docs) {
           const lessonDoc = await getDoc(doc(db, `courses/${cid}/sections/${sDoc.id}/lessons`, id));
           if (lessonDoc.exists()) {
             foundLesson = { id: lessonDoc.id, ...lessonDoc.data() };
             break;
           }
        }

        if (foundLesson) {
          setLesson(foundLesson);
        } else {
          toast.error('الدرس غير موجود');
          navigate(-1);
        }
      } catch (error) {
        toast.error('غير مصرح لك بمشاهدة هذا الدرس');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();

    // Disable right click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Disable certain shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.key === 'F12')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [id, navigate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      
      const mins = Math.floor(videoRef.current.currentTime / 60);
      const secs = Math.floor(videoRef.current.currentTime % 60);
      setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">جاري تحضير المشغل الآمن...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} className="ml-2 rotate-180" /> العودة للدورة
        </Button>
        <div className="flex items-center gap-2 px-3 py-1 bg-bento-accent/10 text-bento-accent rounded-full text-[10px] font-bold uppercase tracking-widest">
           <Shield size={12} className="ml-1" /> بث آمن
        </div>
      </div>

      <div className="relative group bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video">
        <video 
          ref={videoRef}
          src={lesson?.videoUrl || ''} 
          className="w-full h-full"
          onTimeUpdate={onTimeUpdate}
          onClick={togglePlay}
        />
        
        {/* Protection Watermark */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          {[1,2,3,4,5].map(i => (
            <div 
              key={i}
              className="absolute text-white font-bold select-none text-2xl whitespace-nowrap rotate-[-45deg]"
              style={{ 
                top: `${i * 20}%`, 
                right: `${(i % 2) * 50}%`,
                animation: 'pulse 5s infinite' 
              }}
            >
              {user?.email} • {new Date().toLocaleDateString('ar-EG')}
            </div>
          ))}
        </div>

        {/* Custom Controls */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 space-y-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <input 
            type="range" 
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-bento-accent"
            value={progress}
            onChange={handleSeek}
          />
          
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="rotate-180" />}
              </button>
              <div className="text-sm font-mono">{currentTime}</div>
            </div>
            
            <div className="flex items-center gap-6">
              <Volume2 size={20} className="cursor-pointer" />
              <Maximize size={20} className="cursor-pointer" onClick={() => videoRef.current?.requestFullscreen()} />
            </div>
          </div>
        </div>
        
        {!isPlaying && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                 <Play size={32} fill="white" className="text-white mr-1 rotate-180" />
              </div>
           </div>
        )}
      </div>

      <Card className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">{lesson?.title || 'محتوى الدرس'}</h1>
        <p className="text-bento-muted leading-relaxed">
          {lesson?.description || 'لا يوجد وصف متاح لهذا الدرس حالياً.'}
        </p>
        <div className="pt-4 flex gap-4">
           <Button variant="outline">تحميل المواد</Button>
           <Button>تحديد كمكتمل</Button>
        </div>
      </Card>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1) rotate(-45deg); opacity: 0.1; }
          50% { transform: scale(1.1) rotate(-45deg); opacity: 0.3; }
          100% { transform: scale(1) rotate(-45deg); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
