/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const opecData = [
  { id: "364", name: "Eron", iso: "IRN", year: 1960, isFounder: true, isActive: true },
  { id: "368", name: "Iroq", iso: "IRQ", year: 1960, isFounder: true, isActive: true },
  { id: "414", name: "Quvayt", iso: "KWT", year: 1960, isFounder: true, isActive: true },
  { id: "682", name: "Saudiya Arabistoni", iso: "SAU", year: 1960, isFounder: true, isActive: true },
  { id: "862", name: "Venesuela", iso: "VEN", year: 1960, isFounder: true, isActive: true },
  { id: "634", name: "Qatar", iso: "QAT", year: 1961, isFounder: false, isActive: false },
  { id: "360", name: "Indoneziya", iso: "IDN", year: 1962, isFounder: false, isActive: false },
  { id: "434", name: "Liviya", iso: "LBY", year: 1962, isFounder: false, isActive: true },
  { id: "784", name: "BAA", iso: "ARE", year: 1967, isFounder: false, isActive: true },
  { id: "012", name: "Jazoir", iso: "DZA", year: 1969, isFounder: false, isActive: true },
  { id: "566", name: "Nigeriya", iso: "NGA", year: 1971, isFounder: false, isActive: true },
  { id: "218", name: "Ekvador", iso: "ECU", year: 1973, isFounder: false, isActive: false },
  { id: "266", name: "Gabon", iso: "GAB", year: 1975, isFounder: false, isActive: true },
  { id: "024", name: "Angola", iso: "AGO", year: 2007, isFounder: false, isActive: false },
  { id: "226", name: "Ekvatorial Gvineya", iso: "GNQ", year: 2017, isFounder: false, isActive: true },
  { id: "178", name: "Kongo", iso: "COG", year: 2018, isFounder: false, isActive: true }
];

let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTimeOffset = 0) => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  const startTime = ctx.currentTime + startTimeOffset;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0.1, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

const playCorrectSound = () => {
  playTone(600, 'sine', 0.1);
  playTone(800, 'sine', 0.2, 0.1);
};

const playWrongSound = () => {
  playTone(300, 'sawtooth', 0.3);
};

const playVictorySound = () => {
  [440, 554.37, 659.25, 880].forEach((freq, i) => {
    playTone(freq, 'sine', 0.3, i * 0.15);
  });
  [440, 554.37, 659.25, 880].forEach((freq) => {
    playTone(freq, 'sine', 0.6, 0.6);
  });
};

// Shuffle array helper
const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

type Question = {
  text: string;
  targetIds: string[];
};

export default function App() {
  const [mode, setMode] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [countryStates, setCountryStates] = useState<Record<string, "green" | "red">>({});
  const [wrongClicked, setWrongClicked] = useState<string | null>(null);
  const [guessedCountries, setGuessedCountries] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);

  const startGame = (selectedMode: number) => {
    setMode(selectedMode);
    setCurrentQuestionIndex(0);
    setAttempts(0);
    setCountryStates({});
    setWrongClicked(null);
    setGuessedCountries(new Set());
    setGameOver(false);

    let newQuestions: Question[] = [];

    if (selectedMode === 1) {
      const founders = opecData.filter(d => d.isFounder);
      newQuestions = shuffle(founders).map(d => ({
        text: `Asoschi davlatni toping: ${d.name}`,
        targetIds: [d.id]
      }));
    } else if (selectedMode === 2) {
      const active = opecData.filter(d => d.isActive);
      newQuestions = shuffle(active).map(d => ({
        text: `Hozirgi a'zolardan birini toping: ${d.name}`,
        targetIds: [d.id]
      }));
    } else if (selectedMode === 3) {
      const left = opecData.filter(d => !d.isActive && !d.isFounder);
      newQuestions = shuffle(left).map(d => ({
        text: `Sobiq a'zolardan birini toping: ${d.name}`,
        targetIds: [d.id]
      }));
    } else if (selectedMode === 4) {
      const mode4Groups = [
        { year: 1960, text: "1960-yilda asos solgan davlatlardan birini toping", ids: ["364", "368", "414", "682", "862"] },
        { year: 1961, text: "1961-yilda qo'shilgan davlatni toping", ids: ["634"] },
        { year: 1962, text: "1962-yilda qo'shilgan davlatlardan birini toping", ids: ["360", "434"] },
        { year: 1967, text: "1967-yilda qo'shilgan davlatni toping", ids: ["784"] },
        { year: 1969, text: "1969-yilda qo'shilgan davlatni toping", ids: ["012"] },
        { year: 1971, text: "1971-yilda qo'shilgan davlatni toping", ids: ["566"] },
        { year: 1973, text: "1973-yilda qo'shilgan davlatni toping", ids: ["218"] },
        { year: 1975, text: "1975-yilda qo'shilgan davlatni toping", ids: ["266"] },
        { year: 2007, text: "2007-yilda qo'shilgan davlatni toping", ids: ["024"] },
        { year: 2017, text: "2017-yilda qo'shilgan davlatni toping", ids: ["226"] },
        { year: 2018, text: "2018-yilda qo'shilgan davlatni toping", ids: ["178"] }
      ];
      
      mode4Groups.forEach(g => {
        for(let i=0; i<g.ids.length; i++) {
          newQuestions.push({
            text: i === 0 ? g.text : `Yana bir ${g.year}-yilda ${g.year === 1960 ? "asos solgan" : "qo'shilgan"} davlatni toping`,
            targetIds: [...g.ids]
          });
        }
      });
    } else if (selectedMode === 5) {
      const active = opecData.filter(d => d.isActive);
      newQuestions = [{
        text: "Hozirgi OPEC davlatlarini xaritadan topib belgilang",
        targetIds: active.map(d => d.id)
      }];
    }

    setQuestions(newQuestions);
  };

  const matchId = (geoId: string, targetId: string) => parseInt(geoId, 10) === parseInt(targetId, 10);

  const handleCountryClick = useCallback((geo: any) => {
    if (gameOver || !mode) return;
    const clickedId = geo.id;
    if (!clickedId) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    // Check if clicked country is already guessed correctly
    let alreadyGuessed = false;
    guessedCountries.forEach(id => {
      if (matchId(clickedId, id)) alreadyGuessed = true;
    });
    if (alreadyGuessed) return;

    // Check if clicked matches any target
    const isCorrect = currentQ.targetIds.some(tid => matchId(clickedId, tid));

    if (isCorrect) {
      // Correct!
      const finalState = attempts === 0 ? "green" : "red";
      setCountryStates(prev => ({ ...prev, [clickedId]: finalState }));
      
      const newGuessed = new Set(guessedCountries);
      newGuessed.add(clickedId);
      setGuessedCountries(newGuessed);
      
      setAttempts(0);
      setWrongClicked(null);

      if (mode === 5) {
        if (newGuessed.size === currentQ.targetIds.length) {
          playVictorySound();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setGameOver(true);
        } else {
          playCorrectSound();
        }
      } else {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          playCorrectSound();
        } else {
          playVictorySound();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setGameOver(true);
        }
      }
    } else {
      // Wrong!
      setAttempts(prev => prev + 1);
      setWrongClicked(clickedId);
      playWrongSound();
      setTimeout(() => {
        setWrongClicked(null);
      }, 1500);
    }
  }, [gameOver, mode, questions, currentQuestionIndex, guessedCountries, attempts]);

  const getFillColor = (geo: any) => {
    const geoId = geo.id;
    if (!geoId) return "#2A2A2A";

    // Check if it's the currently wrong clicked one
    if (wrongClicked && matchId(geoId, wrongClicked)) {
      return "#EF4444"; // Red
    }

    // Check permanent states
    for (const [id, state] of Object.entries(countryStates)) {
      if (matchId(geoId, id)) {
        return state === "green" ? "#22C55E" : "#EF4444";
      }
    }

    return "#2A2A2A"; // Default dark map color
  };

  const isFlashing = (geo: any) => {
    if (attempts < 3 || gameOver || !mode) return false;
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return false;
    
    const geoId = geo.id;
    if (!geoId) return false;

    // If it's a target and not yet guessed
    const isTarget = currentQ.targetIds.some(tid => matchId(geoId, tid));
    let notGuessed = true;
    guessedCountries.forEach(id => {
      if (matchId(geoId, id)) notGuessed = false;
    });

    return isTarget && notGuessed;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="p-6 text-center border-b border-zinc-800">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50">OPEC davlatlari geografiyasi</h1>
        <p className="text-zinc-400 mt-2">Interaktiv xarita o'yini</p>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
        {!mode ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center w-full max-w-2xl mt-12 space-y-4"
          >
            <h2 className="text-2xl font-semibold mb-6 text-zinc-200">O'yin rejimini tanlang:</h2>
            <button onClick={() => startGame(1)} className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-lg font-medium transition-colors border border-zinc-700 hover:border-zinc-500">
              1. Asoschi davlatlar
            </button>
            <button onClick={() => startGame(2)} className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-lg font-medium transition-colors border border-zinc-700 hover:border-zinc-500">
              2. Hozirgi a'zolar (2026)
            </button>
            <button onClick={() => startGame(3)} className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-lg font-medium transition-colors border border-zinc-700 hover:border-zinc-500">
              3. Sobiq a'zolar
            </button>
            <button onClick={() => startGame(4)} className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-lg font-medium transition-colors border border-zinc-700 hover:border-zinc-500">
              4. Tarixiy xronologiya
            </button>
            <button onClick={() => startGame(5)} className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-lg font-medium transition-colors border border-zinc-700 hover:border-zinc-500">
              5. Erkin rejim: Hozirgi a'zolar (Nomsiz)
            </button>
          </motion.div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-lg">
              <button 
                onClick={() => {
                  setMode(null);
                  setGameOver(false);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors mb-4 md:mb-0"
              >
                ← Bosh menyu
              </button>
              
              <div className="text-center flex-grow">
                {gameOver ? (
                  <h2 className="text-2xl font-bold text-emerald-400">Tabriklaymiz! O'yin yakunlandi.</h2>
                ) : (
                  <h2 className="text-xl md:text-2xl font-semibold text-zinc-100">
                    {questions[currentQuestionIndex]?.text}
                  </h2>
                )}
              </div>

              <div className="text-right mt-4 md:mt-0 min-w-[120px]">
                <p className="text-zinc-400 text-sm">Natija</p>
                <p className="text-2xl font-bold font-mono text-zinc-100">
                  {guessedCountries.size} / {mode === 5 ? questions[0]?.targetIds?.length || 12 : questions.length}
                </p>
              </div>
            </div>

            {/* Map Container */}
            <div className="w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative" style={{ height: '60vh', minHeight: '400px' }}>
              <ComposableMap 
                projectionConfig={{ scale: 140 }}
                className="w-full h-full"
              >
                <ZoomableGroup center={[0, 20]} zoom={1} minZoom={1} maxZoom={8}>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const flashing = isFlashing(geo);
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => handleCountryClick(geo)}
                            className={`outline-none transition-colors duration-300 cursor-pointer ${flashing ? 'animate-flash' : ''}`}
                            style={{
                              default: {
                                fill: flashing ? undefined : getFillColor(geo),
                                stroke: "#18181B",
                                strokeWidth: 0.5,
                                outline: "none",
                              },
                              hover: {
                                fill: flashing ? undefined : (getFillColor(geo) === "#2A2A2A" ? "#3F3F46" : getFillColor(geo)),
                                stroke: "#18181B",
                                strokeWidth: 0.5,
                                outline: "none",
                              },
                              pressed: {
                                fill: flashing ? undefined : getFillColor(geo),
                                stroke: "#18181B",
                                strokeWidth: 0.5,
                                outline: "none",
                              },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            </div>
          </div>
        )}

        {/* Victory Modal */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-emerald-400 mb-4 mt-2">Ajoyib natija!</h2>
                <p className="text-zinc-300 text-lg mb-6">Siz barcha davlatlarni muvaffaqiyatli topdingiz.</p>
                <div className="text-6xl font-mono font-bold text-zinc-100 mb-8 bg-zinc-800/50 py-4 rounded-2xl border border-zinc-700/50">
                  {guessedCountries.size} <span className="text-3xl text-zinc-500">/ {mode === 5 ? questions[0]?.targetIds?.length || 12 : questions.length}</span>
                </div>
                <button
                  onClick={() => {
                    setMode(null);
                    setGameOver(false);
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Bosh menyuga qaytish
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-zinc-800 text-center text-zinc-500 text-sm flex flex-col md:flex-row justify-center items-center gap-4">
        <p>Muallif: Rahmatjon Bekimmatov</p>
        <p className="hidden md:block">•</p>
        <p>Instagram: @bekimmatovv</p>
        <p className="hidden md:block">•</p>
        <p>Telegram: @Geografiya_Rahmatjon</p>
      </footer>
    </div>
  );
}

