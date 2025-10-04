import React, { useState, useCallback, useEffect } from 'react';
import { GameState, FarmStats, Scenario, Action, HistoryEntry, ScenarioData, SoilType, CropName } from './types';
import { INITIAL_FARM_STATS, MAX_ROUNDS } from './constants';
import { generateScenario, calculateOutcome, generateOrUpdateFarmImage, generateScenarioFromData, generateGameSummaryTips } from './services/geminiService';
import { playSound } from './services/soundService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TutorialModal from './components/TutorialModal';
import GameOverModal from './components/GameOverModal';
import WeatherHistoryModal from './components/WeatherHistoryModal';
import BackgroundAnimation from './components/BackgroundAnimation';
import WeatherInputModal from './components/WeatherInputModal';

interface ManualStartData {
    scenarioData: ScenarioData;
    soilType: SoilType;
    cropType: CropName;
}

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.TUTORIAL);
  const [round, setRound] = useState(1);
  const [farmStats, setFarmStats] = useState<FarmStats | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [farmImageUrl, setFarmImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [gameTips, setGameTips] = useState<string[] | null>(null);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 1500); // The animation will be visible for 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);


  const startNewGame = useCallback(async (initialSetup?: ManualStartData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setRound(1);
    const initialStats: FarmStats = { 
        ...INITIAL_FARM_STATS, 
        soilType: initialSetup?.soilType ?? 'SILTY',
        cropType: initialSetup?.cropType ?? 'القمح' 
    };
    setFarmStats(initialStats);
    setHistory([]);
    setFarmImageUrl(null);
    setScenario(null);

    try {
      const firstScenario = initialSetup?.scenarioData
        ? await generateScenarioFromData(initialSetup.scenarioData, initialSetup.soilType, initialSetup.cropType)
        : await generateScenario([], initialStats);
      
      setScenario(firstScenario);

      // Fire-and-forget image generation for the FIRST image
      setIsGeneratingImage(true);
      generateOrUpdateFarmImage(firstScenario, null, "A new farm is established.", initialStats.cropType, initialStats.soilType)
        .then(url => setFarmImageUrl(url))
        .catch(err => {
            console.error("Initial image generation failed, proceeding without image.", err);
            setFarmImageUrl(null);
        })
        .finally(() => setIsGeneratingImage(false));

    } catch (error) {
      console.error(error);
      setErrorMessage("اللعبة مش عايزة تبدأ. فيه مشكلة في الاتصال بالذكاء الاصطناعي.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTutorialComplete = () => {
    setGameState(GameState.WEATHER_INPUT);
  };
  
  const handleWeatherInputAndStartGame = (data?: ManualStartData) => {
    setGameState(GameState.PLAYING);
    startNewGame(data);
  };

  const handleRestart = () => {
    setGameState(GameState.WEATHER_INPUT);
    setGameTips(null);
  };

  const handleAction = async (action: Action, modifiedData: ScenarioData) => {
    if (!scenario || isLoading || gameState !== GameState.PLAYING || !farmStats) return;
    
    setShowSuccess(false); // Reset on new action
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const scenarioForCalculation: Scenario = {
        ...scenario,
        data: modifiedData,
      };
      
      const outcome = await calculateOutcome(farmStats, scenarioForCalculation, action);

      playSound('success');

      const newHistoryEntry: HistoryEntry = {
        round,
        scenario: scenarioForCalculation,
        action,
        outcome,
      };
      const updatedHistory = [...history, newHistoryEntry];
      setHistory(updatedHistory);
      setFarmStats(outcome.updatedStats);

      const isGameOver = 
        outcome.updatedStats.cropHealth <= 0 ||
        round + 1 > MAX_ROUNDS;

      if (isGameOver) {
        setGameState(GameState.GAME_OVER);
        setIsLoading(false);
        
        // Generate personalized tips based on game performance
        setIsGeneratingTips(true);
        generateGameSummaryTips(outcome.updatedStats, updatedHistory)
            .then(tips => setGameTips(tips))
            .catch(err => {
                console.error("Failed to generate tips:", err);
                setGameTips([]); // Set to empty array on error to stop loading
            })
            .finally(() => setIsGeneratingTips(false));

      } else {
        setRound(r => r + 1);
        setShowSuccess(true); // Trigger success animation

        // Image generation starts here in the background
        const previousImageUrl = farmImageUrl; 
        setIsGeneratingImage(true);
        
        try {
            const nextScenario = await generateScenario(updatedHistory, outcome.updatedStats);
            setScenario(nextScenario);
            setIsLoading(false); // Core logic done, unblock UI

             // Fire-and-forget image update using the new scenario
            generateOrUpdateFarmImage(nextScenario, previousImageUrl, outcome.narrative, outcome.updatedStats.cropType, outcome.updatedStats.soilType)
                .then(url => {
                    if (url) setFarmImageUrl(url);
                })
                .catch(err => {
                    console.error("Image update failed, keeping previous image.", err);
                })
                .finally(() => setIsGeneratingImage(false));

        } catch (e) {
            setErrorMessage("حصلت مشكلة في تحميل السيناريو الجديد.");
            setIsLoading(false); // Unblock on scenario error
            setIsGeneratingImage(false); // Also stop the spinner for image
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("حصلت مشكلة وإحنا بننفذ قرارك. حاول تاني لو سمحت.");
      setIsLoading(false);
    }
  };

  return (
    <div className="text-white min-h-screen font-sans isolate">
      <BackgroundAnimation />
      <Header round={round} maxRounds={MAX_ROUNDS} />
      <main className="container mx-auto p-4 md:p-6">
        {gameState === GameState.TUTORIAL && <TutorialModal onClose={handleTutorialComplete} />}
        {gameState === GameState.WEATHER_INPUT && <WeatherInputModal onStart={handleWeatherInputAndStartGame} />}
        {gameState === GameState.GAME_OVER && farmStats && (
          <GameOverModal
            finalStats={farmStats}
            history={history}
            onRestart={handleRestart}
            tips={gameTips}
            isLoadingTips={isGeneratingTips}
          />
        )}
        {gameState === GameState.PLAYING && farmStats && (
          <>
            {showHistoryModal && <WeatherHistoryModal history={history} onClose={() => setShowHistoryModal(false)} />}
            {errorMessage && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-4">{errorMessage}</div>}
            <Dashboard
              farmStats={farmStats}
              scenario={scenario}
              round={round}
              isLoading={isLoading}
              onAction={handleAction}
              onShowHistory={() => setShowHistoryModal(true)}
              showSuccess={showSuccess}
              farmImageUrl={farmImageUrl}
              isGeneratingImage={isGeneratingImage}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
