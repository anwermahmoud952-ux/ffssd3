import React, { useState, useEffect } from 'react';
import { ScenarioData, SoilType, CropName } from '../types';
import { TemperatureIcon, RainfallIcon, MoistureIcon, NDVIIcon, SoilIcon, PlantIcon, WindIcon, HumidityIcon, CloudIcon, PressureIcon } from './icons';
import { playSound } from '../services/soundService';
import { CROP_TYPES, EGYPTIAN_CITIES } from '../constants';

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

const RealWeatherDisplay: React.FC<{ data: ScenarioData; cityName: string }> = ({ data, cityName }) => (
    <div className="bg-gray-700/30 p-4 rounded-lg animate-fade-in w-full">
        <h3 className="text-lg font-bold text-green-400 mb-4 text-center">بيانات الطقس الواقعي لـ {cityName}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-red-300" title="درجة الحرارة"><TemperatureIcon className="w-5 h-5" /><span>{data.temperature}°م</span></div>
            <div className="flex items-center space-x-2 text-blue-300" title="كمية المطر"><RainfallIcon className="w-5 h-5" /><span>{data.rainfall} مم</span></div>
            <div className="flex items-center space-x-2 text-indigo-300" title="الرطوبة"><HumidityIcon className="w-5 h-5" /><span>{data.humidity}%</span></div>
            <div className="flex items-center space-x-2 text-gray-300" title="سرعة الرياح"><WindIcon className="w-5 h-5" /><span>{data.windSpeed} كم/س</span></div>
            <div className="flex items-center space-x-2 text-gray-400" title="الغيوم"><CloudIcon className="w-5 h-5" /><span>{data.cloudCover}%</span></div>
            <div className="flex items-center space-x-2 text-purple-300" title="الضغط الجوي"><PressureIcon className="w-5 h-5" /><span>{data.pressure} hPa</span></div>
        </div>
    </div>
);


const FarmSetup: React.FC<{
    soilType: SoilType,
    cropType: CropName,
    onSoilChange: (soil: SoilType) => void,
    onCropChange: (crop: CropName) => void
}> = ({ soilType, cropType, onSoilChange, onCropChange }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-8 border-t border-gray-700/50">
        <div>
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                <SoilIcon className="w-5 h-5" />
                اختار نوع التربة
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SOIL_TYPE_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onSoilChange(opt.value)}
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
                onChange={e => onCropChange(e.target.value)}
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
);


const WeatherInputModal: React.FC<{ onStart: (data?: ManualStartData) => void }> = ({ onStart }) => {
    const [mode, setMode] = useState<'auto' | 'manual' | 'real'>('auto');
    const [soilType, setSoilType] = useState<SoilType>('SILTY');
    const [cropType, setCropType] = useState<CropName>('القمح');
    const [selectedCity, setSelectedCity] = useState('Cairo');
    const [weatherData, setWeatherData] = useState<WeatherInputState>({
        temperature: "28", rainfall: "0", soilMoisture: "50", ndvi: "0.65",
        humidity: "60", windSpeed: "15", cloudCover: "20", pressure: "1012",
    });
    const [realWeatherState, setRealWeatherState] = useState<{
        status: 'idle' | 'loading' | 'success' | 'error';
        data: ScenarioData | null;
        error: string | null;
    }>({ status: 'idle', data: null, error: null });

     useEffect(() => {
        if (mode === 'real') {
            const fetchWeatherData = async () => {
                setRealWeatherState({ status: 'loading', data: null, error: null });
                const apiKey = '9ffd10b1321bf417bed40c2232955c5e';
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${selectedCity}&appid=${apiKey}&units=metric&lang=ar`;

                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`!فشل جلب البيانات. حاول مرة أخرى. (HTTP ${response.status})`);
                    }
                    const weather = await response.json();

                    const scenarioData: ScenarioData = {
                        temperature: Math.round(weather.main.temp),
                        rainfall: weather.rain ? weather.rain['1h'] || 0 : 0,
                        humidity: weather.main.humidity,
                        windSpeed: Math.round(weather.wind.speed * 3.6), // m/s to km/h
                        cloudCover: weather.clouds.all,
                        pressure: weather.main.pressure,
                        // Set sensible defaults for data not available in the weather API
                        soilMoisture: 50,
                        ndvi: 0.65,
                    };

                    setRealWeatherState({ status: 'success', data: scenarioData, error: null });

                } catch (e: any) {
                     setRealWeatherState({ status: 'error', data: null, error: e.message || 'فشل في جلب بيانات الطقس. حاول مرة أخرى.' });
                     console.error("Failed to fetch real weather data:", e);
                }
            };
            fetchWeatherData();
        } else {
            setRealWeatherState({ status: 'idle', data: null, error: null });
        }
    }, [mode, selectedCity]);

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
        } else if (mode === 'real' && realWeatherState.data) {
             const finalData: ManualStartData = {
                scenarioData: realWeatherState.data,
                soilType: soilType,
                cropType: cropType,
            };
            onStart(finalData);
        } else {
             const finalData: ManualStartData = {
                scenarioData: {
                    temperature: 25, rainfall: 2, soilMoisture: 55, ndvi: 0.7,
                    humidity: 60, windSpeed: 10, cloudCover: 20, pressure: 1012,
                },
                soilType: soilType,
                cropType: cropType,
            };
            onStart(finalData);
        }
    };

    const isSubmitDisabled = mode === 'real' && realWeatherState.status !== 'success';
    const selectedCityAr = EGYPTIAN_CITIES.find(c => c.nameEn === selectedCity)?.nameAr || selectedCity;


    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 max-w-4xl w-full mx-4 animate-fade-in max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-bold text-green-400 mb-4 text-center">إعدادات المحاكاة الأولية</h2>
                <p className="text-gray-300 mb-6 text-center">
                    اختار طريقة بداية المحاكاة: بسيناريو عشوائي، بيانات محددة، أو طقس إحدى المحافظات الآن.
                </p>
                
                <div className="bg-gray-700 rounded-lg p-1 flex mb-8 max-w-lg mx-auto">
                    <button 
                        onClick={() => setMode('auto')}
                        className={`w-full font-semibold py-2 rounded-md transition-colors duration-200 ${mode === 'auto' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}
                    >
                        تلقائي
                    </button>
                    <button 
                        onClick={() => setMode('manual')}
                        className={`w-full font-semibold py-2 rounded-md transition-colors duration-200 ${mode === 'manual' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}
                    >
                        يدوي
                    </button>
                    <button 
                        onClick={() => setMode('real')}
                        className={`w-full font-semibold py-2 rounded-md transition-colors duration-200 ${mode === 'real' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}
                    >
                        طقس واقعي
                    </button>
                </div>

                <div className="mb-10 min-h-[25vh]">
                    {mode === 'auto' && (
                         <div className="text-center text-gray-400 h-full flex flex-col items-center justify-center animate-fade-in">
                            <p className="mb-8">دع الذكاء الاصطناعي يفاجئك بسيناريو بداية عشوائي ومليء بالتحديات.</p>
                             <FarmSetup 
                                soilType={soilType}
                                cropType={cropType}
                                onSoilChange={setSoilType}
                                onCropChange={setCropType}
                            />
                        </div>
                    )}
                    {mode === 'manual' && (
                         <div className="space-y-8 animate-fade-in">
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
                        </div>
                    )}
                    {mode === 'real' && (
                        <div className="animate-fade-in flex flex-col items-center justify-center h-full">
                           <div className="w-full max-w-sm mb-6">
                                <label htmlFor="city-select" className="text-sm text-gray-400 block mb-2 text-center">اختار المحافظة:</label>
                                <select
                                    id="city-select"
                                    value={selectedCity}
                                    onChange={e => setSelectedCity(e.target.value)}
                                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
                                >
                                    {EGYPTIAN_CITIES.map(city => (
                                        <option key={city.nameEn} value={city.nameEn}>{city.nameAr}</option>
                                    ))}
                                </select>
                            </div>

                           {realWeatherState.status === 'loading' && (
                                <>
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
                                    <p className="text-gray-300">جاري جلب بيانات الطقس الحالية من {selectedCityAr}...</p>
                                </>
                           )}
                           {realWeatherState.status === 'error' && (
                                <div className="text-center text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                                    <p className="font-semibold">حدث خطأ</p>
                                    <p>{realWeatherState.error}</p>
                                </div>
                           )}
                           {realWeatherState.status === 'success' && realWeatherState.data && (
                                <RealWeatherDisplay data={realWeatherState.data} cityName={selectedCityAr} />
                           )}
                        </div>
                    )}

                    {(mode === 'manual' || (mode === 'real' && realWeatherState.status === 'success')) && (
                        <div className="mt-8 animate-fade-in">
                            <FarmSetup 
                                soilType={soilType}
                                cropType={cropType}
                                onSoilChange={setSoilType}
                                onCropChange={setCropType}
                            />
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        ابدأ المحاكاة
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WeatherInputModal;