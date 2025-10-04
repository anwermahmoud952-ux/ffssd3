import React, { useEffect, useState } from 'react';
import { FarmStats, HistoryEntry } from '../types';
import { playSound } from '../services/soundService';
import { ChevronDownIcon } from './icons';

interface GameOverModalProps {
  finalStats: FarmStats;
  history: HistoryEntry[];
  onRestart: () => void;
  tips: string[] | null;
  isLoadingTips: boolean;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ finalStats, onRestart, tips, isLoadingTips }) => {
  const isWin = finalStats.cropHealth > 0;
  const finalScore = Math.round(finalStats.cropHealth * 10 + finalStats.soilMoisture * 2.5 + finalStats.waterReserves * 2.5);
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);

  useEffect(() => {
    if (isWin) {
      playSound('win');
    } else {
      playSound('lose');
    }
  }, [isWin]);

  const handleRestart = () => {
    playSound('click');
    onRestart();
  };

  const handleToggleTips = () => {
    playSound('click');
    setIsTipsExpanded(!isTipsExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4 text-center animate-fade-in">
        <h2 className={`text-4xl font-bold mb-4 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {isWin ? 'نجحت في الزراعة المستدامة!' : 'انتهت المحاكاة'}
        </h2>
        <p className="text-lg text-gray-300 mb-6">
          {isWin
            ? "مبروك! قدرت تدير مزرعتك بطريقة صديقة للبيئة."
            : "للأسف، مزرعتك واجهت تحديات كبيرة. حظ أفضل في محاولتك القادمة لزراعة مستقبل أخضر!"}
        </p>
        
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-2 text-left mb-8">
            <h3 className="text-xl font-semibold text-center mb-3">التقرير النهائي للاستدامة</h3>
            <div className="flex justify-between">
                <span className="text-gray-400">صحة الزرع النهائية:</span>
                <span className="font-bold">{finalStats.cropHealth}%</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-400">رطوبة التربة النهائية:</span>
                <span className="font-bold">{finalStats.soilMoisture}%</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-400">مخزون المياه النهائي:</span>
                <span className="font-bold">{finalStats.waterReserves}%</span>
            </div>
            <hr className="border-gray-600 my-2" />
             <div className="flex justify-between text-yellow-400 text-lg">
                <span className="font-semibold">مؤشر الاستدامة:</span>
                <span className="font-bold">{finalScore.toLocaleString()}</span>
            </div>
        </div>

        {/* Tips Section */}
        <div className="mb-8">
            <button
                onClick={handleToggleTips}
                className="w-full bg-gray-700/50 hover:bg-gray-700 text-yellow-300 font-semibold py-3 px-4 rounded-lg flex justify-between items-center transition-all duration-200"
            >
                <span>نصائح لتحسين الاستدامة</span>
                <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${isTipsExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isTipsExpanded && (
                <div className="bg-gray-900/50 text-left p-4 mt-2 rounded-b-lg animate-fade-in">
                    {isLoadingTips ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
                            <p className="mr-4 text-gray-400">بنجهزلك نصايح مخصوص...</p>
                        </div>
                    ) : tips && tips.length > 0 ? (
                        <ul className="space-y-3 list-disc list-inside text-gray-300 pr-4">
                            {tips.map((tip, index) => (
                                <li key={index}>{tip}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4">لم نتمكن من إنشاء نصائح هذه المرة. حاول مرة أخرى!</p>
                    )}
                </div>
            )}
        </div>

        <button
          onClick={handleRestart}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          ازرع من جديد
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
