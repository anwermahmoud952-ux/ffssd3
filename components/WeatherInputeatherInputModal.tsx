import React, { useState } from 'react';
import { ScenarioData, SoilType, CropName } from '../types';
import { TemperatureIcon, RainfallIcon, MoistureIcon, NDVIIcon, SoilIcon, PlantIcon, WindIcon, HumidityIcon, CloudIcon, PressureIcon } from './icons';
import { playSound } from '../services/soundService';
import { CROP_TYPES } from '../constants';

interface WeatherInputState {
    temperature: string;
    rainfall: string;
    soilMoisture: string;
    ndvi: string;
    humidity: string;
    windSpeed: string;
    cloudCover: string;
    pressure: string;
}

interface ManualStartData {
    scenarioData: ScenarioData;
    soilType: SoilType;
    cropType: CropName;
}

const SOIL_TYPE_OPTIONS: { value: SoilType, label: string }[] = [
    { value: 'SILTY', label: 'طميية' },
    { value: 'SANDY', label: 'رملية' },
    { value: 'CHALKY', label: 'جيرية' },
    { value: 'SALINE', label: 'ملحية' },
    { value: 'ROCKY', label: 'صخرية' },
];


const SliderInput: React.FC<{
    label: string;
    icon: React.ReactNode;
    value: string;
    unit: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min: string;
    max: string;
    step: string;
}> = ({ label, icon, value, unit, onChange, min, max, step }) => {
    const numValue = parseFloat(value);
    const numMin = parseFloat(min);
    const numMax = parseFloat(max);

    // Calculate the percentage position of the thumb, clamped between 0 and 100
    const percent = Math.max(0, Math.min(100, ((numValue - numMin) / (numMax - numMin)) * 100));

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400 flex items-center gap-2">
                    {icon}
                    {label}
                </label>
            </div>
            {/* The relative container needs padding-top to avoid the value label from being clipped */}
            <div className="relative pt-10">
                 <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={onChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div 
                    className="text-lg font-bold text-white bg-gray-900/80 px-3 py-1 rounded-md absolute top-0 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${percent}%` }}
                >
                    {value} <span className="text-sm text-gray-400">{unit}</span>
                </div>
            </div>
        </div>
    );
};


const WeatherInputModal: React.FC<{ onStart: (data?: ManualStartData) => void }> = ({ onStart }) => {
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [soilType, setSoilType] = useState<SoilType>('SILTY');
    const [cropType, setCropType] = useState<CropName>('القمح');
    const [weatherData, setWeatherData] = useState<WeatherInputState>({
        temperature: "28",
        rainfall: "0",
        soilMoisture: "50",
        ndvi: "0.65",
        humidity: "60",
        windSpeed: "15",
        cloudCover: "20",
        pressure: "1012",
    });

    const handleDataChange = (field: keyof WeatherInputState, value: string) => {
        setWeatherData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        playSound('click');
        
        if (mode === 'manual') {
            const finalData: ManualStartData = {
                scenarioData: {
                    temperature: parseFloat(weatherData.temperature) || 0,
                    rainfall: parseFloat(weatherData.rainfall) || 0,
                    soilMoisture: parseFloat(weatherData.soilMoisture) || 0,
                    ndvi: parseFloat(weatherData.ndvi) || 0,
                    humidity: parseFloat(weatherData.humidity) || 0,
                    windSpeed: parseFloat(weatherData.windSpeed) || 0,
                    cloudCover: parseFloat(weatherData.cloudCover) || 0,
                    pressure: parseFloat(weatherData.pressure) || 0,
                },
                soilType: soilType,
                cropType: cropType,
            };
            onStart(finalData);
        } else {
            onStart(); // Automatic mode with default soil and crop
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 max-w-4xl w-full mx-4 animate-fade-in max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-bold text-green-400 mb-4 text-center">إعدادات المحاكاة الأولية</h2>
                <p className="text-gray-300 mb-6 text-center">
                    اختار طريقة بداية المحاكاة: بسيناريو عشوائي من الذكاء الاصطناعي، أو بإدخال بيانات محددة.
                </p>
                
                <div className="bg-gray-700 rounded-lg p-1 flex mb-8 max-w-md mx-auto">
                    <button 
                        onClick={() => setMode('auto')}
                        className={`w-full font-semibold py-2 rounded-md transition-colors duration-200 ${mode === 'auto' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}
                    >
                        اعداد تلقائي
                    </button>
                    <button 
                        onClick={() => setMode('manual')}
                        className={`w-full font-semibold py-2 rounded-md transition-colors duration-200 ${mode === 'manual' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}
                    >
                        إعداد يدوي
                    </button>
                </div>

                {mode === 'manual' ? (
                     <div className="space-y-8 mb-10 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-6">
                            {/* Column 1 */}
                            <div className="space-y-8">
                                <SliderInput label="المطر" icon={<RainfallIcon className="w-5 h-5 text-gray-400" />} value={weatherData.rainfall} unit="مم" onChange={e => handleDataChange('rainfall', e.target.value)} min="0" max="200" step="1" />
                                <SliderInput label="NDVI" icon={<NDVIIcon className="w-5 h-5 text-gray-400" />} value={weatherData.ndvi} unit="" onChange={e => handleDataChange('ndvi', e.target.value)} min="0" max="1" step="0.01" />
                                <SliderInput label="الرطوبة" icon={<HumidityIcon className="w-5 h-5 text-gray-400" />} value={weatherData.humidity} unit="%" onChange={e => handleDataChange('humidity', e.target.value)} min="0" max="100" step="1" />
                                <SliderInput label="الضغط" icon={<PressureIcon className="w-5 h-5 text-gray-400" />} value={weatherData.pressure} unit="hPa" onChange={e => handleDataChange('pressure', e.target.value)} min="950" max="1050" step="1" />
                            </div>
                             {/* Column 2 */}
                             <div className="space-y-8">
                                <SliderInput label="الحرارة" icon={<TemperatureIcon className="w-5 h-5 text-gray-400" />} value={weatherData.temperature} unit="°م" onChange={e => handleDataChange('temperature', e.target.value)} min="-10" max="50" step="1" />
                                <SliderInput label="رطوبة التربة" icon={<MoistureIcon className="w-5 h-5 text-gray-400" />} value={weatherData.soilMoisture} unit="%" onChange={e => handleDataChange('soilMoisture', e.target.value)} min="0" max="100" step="1" />
                                <SliderInput label="سرعة الرياح" icon={<WindIcon className="w-5 h-5 text-gray-400" />} value={weatherData.windSpeed} unit="كم/س" onChange={e => handleDataChange('windSpeed', e.target.value)} min="0" max="100" step="1" />
                                <SliderInput label="الغيوم" icon={<CloudIcon className="w-5 h-5 text-gray-400" />} value={weatherData.cloudCover} unit="%" onChange={e => handleDataChange('cloudCover', e.target.value)} min="0" max="100" step="1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-8 border-t border-gray-700/50">
                             {/* Soil and Crop Selection */}
                                <div>
                                    <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                                        <SoilIcon className="w-5 h-5" />
                                        اختار نوع التربة
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {SOIL_TYPE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSoilType(opt.value)}
                                                className={`w-full font-semibold py-2 px-2 text-sm rounded-md transition-all duration-200 border-2 ${soilType === opt.value ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="crop-select" className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                                        <PlantIcon className="w-5 h-5" />
                                        اختار نوع المحصول
                                    </label>
                                    <select 
                                        id="crop-select"
                                        value={cropType} 
                                        onChange={e => setCropType(e.target.value)}
                                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
                                    >
                                        {Object.entries(CROP_TYPES).map(([season, types]) => (
                                            <optgroup key={season} label={season}>
                                                {Object.entries(types).flatMap(([type, crops]) => 
                                                    crops.map(crop => <option key={crop} value={crop}>{crop}</option>)
                                                )}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 mb-10 min-h-[40vh] flex items-center justify-center animate-fade-in">
                        <p>دع الذكاء الاصطناعي يفاجئك بسيناريو بداية عشوائي ومليء بالتحديات.</p>
                    </div>
                )}
               
                <div className="text-center">
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
                    >
                        ابدأ المحاكاة
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WeatherInputModal;