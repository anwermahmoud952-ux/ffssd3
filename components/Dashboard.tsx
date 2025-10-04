import React, { useState, useEffect } from 'react';
import { FarmStats, Scenario, Action, ScenarioData, SoilType } from '../types';
import { PlantIcon, HistoryIcon, MoistureIcon, NDVIIcon, RainfallIcon, TemperatureIcon, WaterIcon, IrrigateIcon, FertilizeIcon, PestControlIcon, ConserveIcon, CheckIcon, SoilIcon, SunIcon, SnowflakeIcon, WindIcon, HumidityIcon, CloudIcon, PressureIcon } from './icons';
import { playSound } from '../services/soundService';

interface DashboardProps {
  farmStats: FarmStats;
  scenario: Scenario | null;
  round: number;
  isLoading: boolean;
  onAction: (action: Action, modifiedData: ScenarioData) => void;
  onShowHistory: () => void;
  showSuccess: boolean;
  farmImageUrl: string | null;
  isGeneratingImage: boolean;
}

const ACTION_DESCRIPTIONS: Record<Action, string> = {
  IRRIGATE: "اسقِ زرعك لزيادة رطوبة التربة. الإفراط في الري يهدر المياه ويؤثر على المياه الجوفية.",
  FERTILIZE: "استخدم السماد العضوي لتحسين صحة التربة والنبات. يحسن المحصول على المدى الطويل ويدعم التنوع البيولوجي للتربة.",
  PEST_CONTROL: "طبّق أساليب المكافحة الحيوية للآفات لحماية زرعك دون الإضرار بالحشرات النافعة أو تلويث التربة.",
  CONSERVE: "اتبع ممارسات الحفاظ على التربة والمياه (مثل الزراعة بدون حرث) لتحسين صحة المزرعة على المدى الطويل."
};

const SOIL_TYPE_NAMES: Record<SoilType, { name: string; description: string }> = {
    SILTY: { name: 'طميية', description: 'خصبة، تحتفظ بالماء والمغذيات بشكل ممتاز.' },
    SANDY: { name: 'رملية', description: 'تصرف المياه بسرعة وتحتاج لري وتسميد متكرر.' },
    CHALKY: { name: 'جيرية', description: 'قلوية وقد تسبب نقص في المغذيات وتجف بسرعة.' },
    SALINE: { name: 'ملحية', description: 'ملوحة عالية تضر الزرع وتعيق امتصاص الماء.' },
    ROCKY: { name: 'صخرية', description: 'لا تحتفظ بالماء أو المغذيات والجذور تجد صعوبة في النمو.' }
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; unit: string; color: string }> = ({ icon, label, value, unit, color }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-center space-x-4">
    <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold">{value}<span className="text-lg ml-1">{unit}</span></p>
    </div>
  </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; description: string; onClick: () => void; disabled: boolean }> = ({ icon, label, description, onClick, disabled }) => {
    const handleClick = () => {
        playSound('click');
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            title={description}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 active:scale-95 text-center"
        >
            <div className="w-8 h-8 mb-2">{icon}</div>
            <span className="text-lg">{label}</span>
        </button>
    );
};

const ImagePlaceholder: React.FC = () => (
    <div className="aspect-video w-full bg-gray-700/50 rounded-lg flex items-center justify-center animate-pulse border-2 border-gray-700">
        <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="mt-2 text-sm">الذكاء الاصطناعي بيرسم مزرعتك المستدامة...</p>
        </div>
    </div>
);

const DataInput: React.FC<{ icon: React.ReactNode; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: number, label: string }> = ({ icon, value, onChange, step = 1, label }) => (
    <div className="relative">
        <label className="text-sm text-gray-400 mb-1 block">{label}</label>
        <div className="absolute inset-y-0 bottom-0 top-6 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input
            type="number"
            step={step}
            value={value}
            onChange={onChange}
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full pl-10 p-2.5"
        />
    </div>
);

const WeatherEffectsOverlay: React.FC<{ temperature: number; rainfall: number }> = ({ temperature, rainfall }) => {
  const isHot = temperature > 30;
  const isCold = temperature < 10;
  const isRaining = rainfall > 5;

  if (!isHot && !isCold && !isRaining) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4 pointer-events-none z-10">
      {isHot && (
        <div title={`طقس حار: ${temperature}°م`} className="animate-pulse">
          <SunIcon className="w-7 h-7 text-yellow-300/70" />
        </div>
      )}
      {isCold && (
        <div title={`طقس بارد: ${temperature}°م`} className="animate-pulse">
          <SnowflakeIcon className="w-7 h-7 text-blue-300/70" />
        </div>
      )}
      {isRaining && (
        <div title={`مطر: ${rainfall} مم`} className="animate-pulse">
          <RainfallIcon className="w-7 h-7 text-cyan-300/70" />
        </div>
      )}
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ farmStats, scenario, isLoading, onAction, onShowHistory, showSuccess, farmImageUrl, isGeneratingImage }) => {
  const [isEditingWeather, setIsEditingWeather] = useState(false);
  const [editableData, setEditableData] = useState<ScenarioData | null>(scenario?.data ?? null);

  useEffect(() => {
    if (scenario) {
      setEditableData(scenario.data);
    }
  }, [scenario]);

  const handleDataChange = (field: keyof ScenarioData, value: string) => {
    // Allow empty input for better UX, but treat it as 0
    const numValue = value === '' ? 0 : parseFloat(value);
    if (editableData && !isNaN(numValue)) {
      setEditableData({
        ...editableData,
        [field]: numValue,
      });
    }
  };


  if (isLoading && !scenario) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
        <p className="absolute text-lg">بنحضّر الأرض...</p>
      </div>
    );
  }

  const handleShowHistory = () => {
    playSound('click');
    onShowHistory();
  };
  
  const currentData = editableData || scenario?.data;

  const moistureBorderClass = scenario?.data.soilMoisture 
    ? scenario.data.soilMoisture < 30 
      ? 'border-yellow-600/60' 
      : scenario.data.soilMoisture > 70 
        ? 'border-blue-400/60' 
        : 'border-gray-700'
    : 'border-gray-700';

  return (
    <div className="space-y-6">
      {/* Farm Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<PlantIcon className="w-6 h-6" />} label="صحة الزرع" value={farmStats.cropHealth} unit="%" color="green" />
        <StatCard icon={<MoistureIcon className="w-6 h-6" />} label="رطوبة التربة" value={farmStats.soilMoisture} unit="%" color="blue" />
        <StatCard icon={<WaterIcon className="w-6 h-6" />} label="مخزون المياه" value={farmStats.waterReserves} unit="%" color="cyan" />
        <div className="bg-gray-800 p-4 rounded-lg flex items-start space-x-4">
            <div className="p-3 rounded-full bg-yellow-500/20 text-yellow-400">
                <SoilIcon className="w-6 h-6" />
            </div>
            <div>
                 <p className="text-sm text-gray-400">المحصول / التربة</p>
                <p className="text-xl font-bold">{farmStats.cropType}</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{SOIL_TYPE_NAMES[farmStats.soilType].name}: {SOIL_TYPE_NAMES[farmStats.soilType].description}</p>
            </div>
        </div>
      </div>

      {/* Farm Image */}
      {(isGeneratingImage || farmImageUrl) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-green-400 mb-3 text-center">
                حالة المزرعة
            </h3>
            <div className="w-full">
                {isGeneratingImage ? (
                    <ImagePlaceholder />
                ) : farmImageUrl ? (
                    <img src={farmImageUrl} alt="صورة للمزرعة تم إنشاؤها بواسطة الذكاء الاصطناعي" className="aspect-video w-full h-auto object-cover rounded-md shadow-lg animate-fade-in" />
                ) : null}
            </div>
        </div>
      )}

      {/* Scenario */}
      {scenario && currentData && (
        <div className={`bg-gray-800/50 border rounded-lg p-6 space-y-4 relative transition-colors duration-500 ${moistureBorderClass}`}>
            <WeatherEffectsOverlay temperature={currentData.temperature} rainfall={currentData.rainfall} />
            {showSuccess && (
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-20 rounded-lg animate-fade-in">
                    <div className="animate-pop-in">
                        <CheckIcon className="w-24 h-24 text-green-400" />
                    </div>
                </div>
            )}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-lg text-gray-300">بنحلل التأثير البيئي لقرارك...</p>
                </div>
            )}
            <div>
                <h2 className="text-xl font-bold text-green-400 mb-2">سيناريو الجولة دي</h2>
                <p className="text-gray-300">{scenario.narrative}</p>
                <p className="mt-2 font-semibold text-yellow-400">التحدي: <span className="font-normal text-yellow-300">{scenario.challenge}</span></p>
            </div>
            <div className="pt-4 border-t border-gray-700 space-y-4">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-red-300" title="درجة الحرارة"><TemperatureIcon className="w-5 h-5" /><span>{currentData.temperature}°م</span></div>
                    <div className="flex items-center space-x-2 text-blue-300" title="كمية المطر"><RainfallIcon className="w-5 h-5" /><span>{currentData.rainfall} مم</span></div>
                    <div className="flex items-center space-x-2 text-cyan-300" title="رطوبة التربة"><MoistureIcon className="w-5 h-5" /><span>{currentData.soilMoisture}%</span></div>
                    <div className="flex items-center space-x-2 text-green-300" title="مؤشر NDVI"><NDVIIcon className="w-5 h-5" /><span>{currentData.ndvi.toFixed(2)}</span></div>
                    <div className="flex items-center space-x-2 text-gray-300" title="سرعة الرياح"><WindIcon className="w-5 h-5" /><span>{currentData.windSpeed} كم/س</span></div>
                    <div className="flex items-center space-x-2 text-indigo-300" title="الرطوبة"><HumidityIcon className="w-5 h-5" /><span>{currentData.humidity}%</span></div>
                    <div className="flex items-center space-x-2 text-gray-400" title="الغيوم"><CloudIcon className="w-5 h-5" /><span>{currentData.cloudCover}%</span></div>
                    <div className="flex items-center space-x-2 text-purple-300" title="الضغط الجوي"><PressureIcon className="w-5 h-5" /><span>{currentData.pressure} hPa</span></div>
                </div>
                 <button onClick={() => setIsEditingWeather(!isEditingWeather)} className="text-sm text-green-400 hover:text-green-300 transition-colors">
                    {isEditingWeather ? 'إخفاء تعديل الطقس' : 'تعديل بيانات الطقس لمحاكاة فعلية'}
                </button>
                {isEditingWeather && (
                    <div className="bg-gray-700/30 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                       <DataInput label="الحرارة °م" icon={<TemperatureIcon className="w-5 h-5 text-gray-400" />} value={editableData?.temperature ?? 0} onChange={e => handleDataChange('temperature', e.target.value)} />
                       <DataInput label="المطر مم" icon={<RainfallIcon className="w-5 h-5 text-gray-400" />} value={editableData?.rainfall ?? 0} onChange={e => handleDataChange('rainfall', e.target.value)} />
                       <DataInput label="رطوبة التربة %" icon={<MoistureIcon className="w-5 h-5 text-gray-400" />} value={editableData?.soilMoisture ?? 0} onChange={e => handleDataChange('soilMoisture', e.target.value)} />
                       <DataInput label="NDVI" icon={<NDVIIcon className="w-5 h-5 text-gray-400" />} value={editableData?.ndvi ?? 0} onChange={e => handleDataChange('ndvi', e.target.value)} step={0.01} />
                       <DataInput label="سرعة الرياح كم/س" icon={<WindIcon className="w-5 h-5 text-gray-400" />} value={editableData?.windSpeed ?? 0} onChange={e => handleDataChange('windSpeed', e.target.value)} />
                       <DataInput label="الرطوبة %" icon={<HumidityIcon className="w-5 h-5 text-gray-400" />} value={editableData?.humidity ?? 0} onChange={e => handleDataChange('humidity', e.target.value)} />
                       <DataInput label="الغيوم %" icon={<CloudIcon className="w-5 h-5 text-gray-400" />} value={editableData?.cloudCover ?? 0} onChange={e => handleDataChange('cloudCover', e.target.value)} />
                       <DataInput label="الضغط hPa" icon={<PressureIcon className="w-5 h-5 text-gray-400" />} value={editableData?.pressure ?? 0} onChange={e => handleDataChange('pressure', e.target.value)} />
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-center">اختار قرارك المستدام</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton icon={<IrrigateIcon />} label="الري" description={ACTION_DESCRIPTIONS.IRRIGATE} onClick={() => onAction('IRRIGATE', editableData!)} disabled={isLoading || !editableData} />
            <ActionButton icon={<FertilizeIcon />} label="التسميد" description={ACTION_DESCRIPTIONS.FERTILIZE} onClick={() => onAction('FERTILIZE', editableData!)} disabled={isLoading || !editableData} />
            <ActionButton icon={<PestControlIcon />} label="مكافحة الآفات" description={ACTION_DESCRIPTIONS.PEST_CONTROL} onClick={() => onAction('PEST_CONTROL', editableData!)} disabled={isLoading || !editableData} />
            <ActionButton icon={<ConserveIcon />} label="الحفاظ" description={ACTION_DESCRIPTIONS.CONSERVE} onClick={() => onAction('CONSERVE', editableData!)} disabled={isLoading || !editableData} />
        </div>
      </div>

       <button onClick={handleShowHistory} className="fixed bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-3 rounded-full shadow-lg transition-transform hover:scale-105">
            <HistoryIcon className="w-7 h-7" />
        </button>
    </div>
  );
};

export default Dashboard;