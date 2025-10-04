import React from 'react';
import { playSound } from '../services/soundService';

interface TutorialModalProps {
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const handleClose = () => {
    playSound('click');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 animate-fade-in">
        <h2 className="text-3xl font-bold text-green-400 mb-4">أهلاً بيك في لعبة اتحضر للأخضر!</h2>
        <div className="space-y-4 text-gray-300">
          <p>
            أنت مسئول عن مزرعة حديثة. هدفك هو تطبيق ممارسات زراعية مستدامة لمدة 5 جولات للحفاظ على صحة مزرعتك والبيئة.
          </p>
          <p>
            كل جولة، الذكاء الاصطناعي هيقترح سيناريو بيئي جديد وتحدي مختلف. قراراتك هتأثر على صحة الزرع، رطوبة التربة، ومخزون المياه.
          </p>
          <p>
            التركيز هنا على الاستدامة، مش الربح. لازم تختار بحكمة من الخيارات دي:
          </p>
          <ul className="list-disc list-inside pr-4 space-y-2">
            <li><span className="font-semibold text-white">الري:</span> اسقِ زرعك بحكمة. الري ضروري، لكن الإفراط فيه بيهدر المياه الثمينة.</li>
            <li><span className="font-semibold text-white">التسميد:</span> استخدم السماد العضوي لتحسين خصوبة التربة على المدى الطويل ودعم صحة النظام البيئي.</li>
            <li><span className="font-semibold text-white">مكافحة الآفات:</span> استخدم طرق طبيعية وحيوية لحماية زرعك بدلًا من الكيماويات الضارة بالبيئة.</li>
            <li><span className="font-semibold text-white">الحفاظ:</span> طبق تقنيات زي الزراعة بدون حرث للحفاظ على رطوبة التربة وصحتها وتحسينها مع الوقت.</li>
          </ul>
          <p>
            اللعبة بتخلص لو صحة الزرع وصلت صفر، أو كملت الـ 5 جولات بنجاح. خد قرارات صديقة للبيئة، وبالتوفيق!
          </p>
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={handleClose}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
          >
            يلا نزرع
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;