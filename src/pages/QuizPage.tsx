import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "ما هو المستوى الطبيعي الثالث (3NF)؟",
    options: ["التخلص من الاعتمادات غير المفتاحية", "التخلص من التكرار فقط", "تخزين البيانات في جدول واحد", "إخفاء البيانات عن المستخدمين"],
    correct: "التخلص من الاعتمادات غير المفتاحية"
  },
  {
    id: 2,
    question: "أي نوع هو الأفضل لتخزين مجموعة من الخيارات في PostgreSQL؟",
    options: ["JSONB", "VARCHAR(MAX)", "TEXT ARRAY", "BOOLEAN"],
    correct: "JSONB"
  }
];

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!selected) {
      toast.error('يرجى اختيار إجابة');
      return;
    }

    if (currentStep < MOCK_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelected(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <Card className="max-w-md mx-auto text-center space-y-6 py-12">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl font-bold">100%</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">اكتمل الاختبار!</h2>
          <p className="text-bento-muted">لقد أتقنت هذه المفاهيم بنجاح.</p>
        </div>
        <Button onClick={() => navigate(-1)} className="w-full">مواصلة التعلم</Button>
      </Card>
    );
  }

  const q = MOCK_QUESTIONS[currentStep];

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-right">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-bento-muted">
          السؤال {currentStep + 1} من {MOCK_QUESTIONS.length}
        </div>
        <div className="h-1.5 w-48 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-bento-accent transition-all duration-500" 
            style={{ width: `${((currentStep + 1) / MOCK_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{q.question}</h1>
        <div className="grid gap-3">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => setSelected(opt)}
              className={`w-full p-6 text-right rounded-2xl border-2 transition-all font-medium ${
                selected === opt 
                ? 'border-bento-accent bg-bento-accent/5 ring-4 ring-bento-accent/10' 
                : 'border-bento-border hover:border-gray-300 bg-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg" className="px-12">
          {currentStep === MOCK_QUESTIONS.length - 1 ? 'إنهاء' : 'السؤال التالي'}
        </Button>
      </div>
    </div>
  );
}
