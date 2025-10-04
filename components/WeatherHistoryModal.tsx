
import React from 'react';
import { HistoryEntry } from '../types';
import { playSound } from '../services/soundService';

interface WeatherHistoryModalProps {
  history: HistoryEntry[];
  onClose: () => void;
}

const WeatherHistoryModal: React.FC<WeatherHistoryModalProps> = ({ history, onClose }) => {
  const handleClose = () => {
    playSound('click');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={handleClose}>
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-green-400">سجل الزراعة</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto space-y-4 pr-2">
          {history.length === 0 ? (
             <p className="text-gray-400 text-center py-8">لسه مفيش حاجة. خد أول قرار!</p>
          ) : (
            [...history].reverse().map((entry) => (
            <div key={entry.round} className="bg-gray-700/50 p-4 rounded-lg">
              <p className="font-bold text-lg mb-2 text-yellow-400">
                الجولة {entry.round}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h4 className="font-semibold text-gray-300 mb-1">السيناريو</h4>
                    <p className="text-sm text-gray-400">{entry.scenario.challenge}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-300 mb-1">قرارك</h4>
                    <p className="text-sm text-gray-400 font-mono bg-gray-900/50 px-2 py-1 rounded inline-block">{entry.action}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-300 mb-1">النتيجة</h4>
                    <p className="text-sm text-gray-400">{entry.outcome.narrative}</p>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};

export default WeatherHistoryModal;
