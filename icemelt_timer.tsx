import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square, Plus, Trash2, Edit2, Moon, Sun, X, Calendar, User, RefreshCw, Palette, Volume2, VolumeX } from 'lucide-react';

// --- THEME CONFIGURATION ---
const THEMES = {
  cyan: {
    name: 'Ice',
    primary: 'bg-cyan-400',
    hover: 'hover:bg-cyan-300',
    ice: 'bg-cyan-300',
    water: 'bg-cyan-400/60',
    waterBorder: 'border-cyan-200'
  },
  green: {
    name: 'Matcha',
    primary: 'bg-emerald-400',
    hover: 'hover:bg-emerald-300',
    ice: 'bg-emerald-300',
    water: 'bg-emerald-400/60',
    waterBorder: 'border-emerald-200'
  },
  purple: {
    name: 'Berry',
    primary: 'bg-violet-400',
    hover: 'hover:bg-violet-300',
    ice: 'bg-violet-300',
    water: 'bg-violet-400/60',
    waterBorder: 'border-violet-200'
  },
  pink: {
    name: 'Candy',
    primary: 'bg-pink-400',
    hover: 'hover:bg-pink-300',
    ice: 'bg-pink-300',
    water: 'bg-pink-400/60',
    waterBorder: 'border-pink-200'
  },
  orange: {
    name: 'Sunset',
    primary: 'bg-orange-400',
    hover: 'hover:bg-orange-300',
    ice: 'bg-orange-300',
    water: 'bg-orange-400/60',
    waterBorder: 'border-orange-200'
  }
};

// --- SOUND CONFIGURATION ---
const SOUNDS = {
  none: { name: 'Mati', url: null, icon: '🔇' },
  rain: { name: 'Hujan', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', icon: '🌧️' }
};

// --- UTILITY COMPONENTS ---

// Komponen Card Pixel Art
const PixelCard = ({ children, className = "", color = "bg-white" }) => (
  <div className={`${color} border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] p-4 rounded-none ${className}`}>
    {children}
  </div>
);

// Komponen Button Pixel Art
const PixelButton = ({ onClick, children, variant = "primary", className = "", disabled = false, theme = THEMES.cyan }) => {
  const colors = {
    primary: `${theme.primary} ${theme.hover} text-gray-900`,
    secondary: "bg-pink-400 hover:bg-pink-300 text-gray-900", // Tetap pink untuk kontras (tombol pause)
    danger: "bg-red-400 hover:bg-red-300 text-gray-900",
    neutral: "bg-gray-200 hover:bg-gray-100 text-gray-900",
    dark: "bg-gray-800 text-white hover:bg-gray-700"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colors[variant]} 
        border-4 border-gray-900 
        font-bold py-2 px-4 
        active:translate-y-1 active:shadow-none
        shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]
        transition-all disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  // --- STATE ---
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("Guest");
  
  // Theme State
  const [currentThemeKey, setCurrentThemeKey] = useState('cyan');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const currentTheme = THEMES[currentThemeKey];

  // Sound State
  const [selectedSound, setSelectedSound] = useState('none');
  const bgAudioRef = useRef(null);
  
  // Timer State
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' or 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState({ focus: 25, break: 5, rounds: 4 });
  const [currentRound, setCurrentRound] = useState(1);
  
  // Events State
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', icon: '📅' });

  // Refs for interval
  const timerRef = useRef(null);

  // --- INITIALIZATION & LOCAL STORAGE ---

  useEffect(() => {
    // Load font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Initialize Audio Object
    bgAudioRef.current = new Audio();
    bgAudioRef.current.loop = true;
    bgAudioRef.current.volume = 0.5; // Set volume to 50%

    // Load Data
    const savedUser = localStorage.getItem('icemelt_user');
    const savedEvents = localStorage.getItem('icemelt_events');
    const savedSettings = localStorage.getItem('icemelt_settings');
    const savedTheme = localStorage.getItem('icemelt_theme');

    if (savedUser) setUsername(savedUser);
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedTheme && THEMES[savedTheme]) setCurrentThemeKey(savedTheme);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTimeLeft(parsed.focus * 60);
    }

    // Cleanup audio on unmount
    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('icemelt_user', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('icemelt_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('icemelt_theme', currentThemeKey);
  }, [currentThemeKey]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- AUDIO LOGIC ---

  // Effect to handle sound source change
  useEffect(() => {
    if (!bgAudioRef.current) return;

    if (selectedSound === 'none') {
      bgAudioRef.current.pause();
    } else {
      bgAudioRef.current.src = SOUNDS[selectedSound].url;
      if (isActive) {
        bgAudioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
    }
  }, [selectedSound]);

  // Effect to handle play/pause based on timer status
  useEffect(() => {
    if (!bgAudioRef.current || selectedSound === 'none') return;

    if (isActive) {
      bgAudioRef.current.play().catch(e => console.log("Audio play error:", e));
    } else {
      bgAudioRef.current.pause();
    }
  }, [isActive, selectedSound]);

  // --- TIMER LOGIC ---

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      clearInterval(timerRef.current);
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3'); // Simple beep
    audio.play().catch(e => console.log("Audio play failed interaction needed"));

    if (timerMode === 'focus') {
      if (currentRound < settings.rounds) {
        setTimerMode('break');
        setTimeLeft(settings.break * 60);
        setCurrentRound(prev => prev + 1);
      } else {
        alert("🎉 Yay! Sesi belajar selesai! Waktunya istirahat panjang.");
        resetTimer();
      }
    } else {
      setTimerMode('focus');
      setTimeLeft(settings.focus * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimerMode('focus');
    setCurrentRound(1);
    setTimeLeft(settings.focus * 60);
  };

  const updateSettings = (key, value) => {
    const newSettings = { ...settings, [key]: parseInt(value) || 1 };
    setSettings(newSettings);
    localStorage.setItem('icemelt_settings', JSON.stringify(newSettings));
    if (!isActive && timerMode === 'focus' && key === 'focus') {
      setTimeLeft(newSettings.focus * 60);
    }
    if (!isActive && timerMode === 'break' && key === 'break') {
      setTimeLeft(newSettings.break * 60);
    }
  };

  // --- EVENT LOGIC ---

  const addEvent = () => {
    if (!newEvent.name || !newEvent.date) return;
    const event = {
      id: Date.now(),
      title: newEvent.name,
      date: newEvent.date,
      created: new Date().toISOString(),
      icon: ['🎓', '📚', '🎒', '✏️', '🏆'][Math.floor(Math.random() * 5)]
    };
    setEvents([...events, event]);
    setNewEvent({ name: '', date: '', icon: '📅' });
    setShowEventModal(false);
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  // Helper untuk menghitung selisih hari
  const getDaysDiff = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  // --- ICE VISUALIZATION LOGIC ---
  
  // Total cubes needed = Total Minutes / 5
  const totalDuration = timerMode === 'focus' ? settings.focus * 60 : settings.break * 60;
  const totalCubes = Math.ceil(totalDuration / 300); 
  
  // Calculate which cube is currently melting
  const currentCubeIndex = Math.ceil(timeLeft / 300); 
  
  // Calculate melting percentage of current cube (0 to 1)
  const secondsInCurrentBlock = timeLeft % 300;
  const meltScale = secondsInCurrentBlock === 0 && timeLeft > 0 ? 1 : secondsInCurrentBlock / 300;

  // Generate random positions for ice cubes
  // Memoize this so cubes don't jump around on every second tick
  const iceCubeStyles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      rotation: Math.floor(Math.random() * 45) - 20, // -20deg to 25deg
      xOffset: Math.floor(Math.random() * 20) - 10,  // -10px to 10px
      marginRight: Math.floor(Math.random() * 10),
    }));
  }, []); // Empty dependency array means this is calculated once on mount

  // --- RENDER ---

  return (
    <div className={`min-h-screen font-['VT323'] text-2xl transition-colors duration-300 
      ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-yellow-50 text-gray-900'}
    `}>
      
      {/* HEADER */}
      <header className={`border-b-4 border-gray-900 p-4 sticky top-0 z-40 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${currentTheme.primary} border-4 border-black flex items-center justify-center animate-bounce transition-colors`}>
              🧊
            </div>
            <h1 className="text-4xl font-bold tracking-widest uppercase">IceMelt</h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 border-4 border-gray-900 px-2 py-1 flex-1 md:flex-none">
                <User size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent outline-none w-32 font-bold uppercase placeholder-gray-500"
                  maxLength={12}
                />
             </div>

             {/* THEME PICKER BUTTON */}
             <div className="relative">
                <button 
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className={`p-2 border-4 border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-transform active:scale-95 ${showThemePicker ? 'bg-gray-200' : ''}`}
                >
                  <Palette size={24} />
                </button>
                
                {showThemePicker && (
                  <div className="absolute right-0 top-full mt-2 p-2 bg-white border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col gap-2 w-32">
                    <p className="text-sm font-bold border-b-2 border-gray-200 mb-1 text-gray-900">PILIH TEMA</p>
                    {Object.keys(THEMES).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setCurrentThemeKey(key); setShowThemePicker(false); }}
                        className={`flex items-center gap-2 p-1 hover:bg-gray-100 text-gray-900 text-sm font-bold ${currentThemeKey === key ? 'bg-gray-200' : ''}`}
                      >
                        <div className={`w-4 h-4 ${THEMES[key].primary} border-2 border-black`}></div>
                        {THEMES[key].name}
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <button onClick={() => setDarkMode(!darkMode)} className="p-2 border-4 border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-none bg-white dark:bg-gray-800">
               {darkMode ? <Sun size={24} /> : <Moon size={24} />}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        
        {/* LEFT COLUMN: POMODORO */}
        <div className="space-y-6">
          <PixelCard className="relative overflow-hidden" color={darkMode ? 'bg-gray-800' : 'bg-blue-50'}>
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-3xl font-bold flex items-center gap-2">
                 {timerMode === 'focus' ? '🔥 FOKUS' : '🍦 ISTIRAHAT'}
               </h2>
               <div className="text-xl bg-gray-900 text-white px-3 py-1">
                 RONDE {currentRound}/{settings.rounds}
               </div>
            </div>

            {/* THE GLASS CONTAINER */}
            <div className="flex justify-center mb-4">
              {/* Dynamic border color for glass visibility in dark mode & improved water visualization */}
              <div className={`relative w-64 h-80 border-x-8 border-b-8 rounded-b-xl flex flex-col-reverse flex-wrap content-center gap-2 p-4 overflow-hidden transition-colors duration-300 
                ${darkMode ? 'border-white bg-white/5' : 'border-gray-900 bg-blue-900/5'}`}
              >
                {/* Ice Cubes Rendering */}
                {Array.from({ length: totalCubes }).map((_, index) => {
                  const cubeNum = index + 1; // 1-based index
                  const style = iceCubeStyles[index % iceCubeStyles.length]; // Get random style
                  
                  let opacity = 0;
                  let scale = 0;

                  if (cubeNum < currentCubeIndex) {
                    // Ice fully exists
                    opacity = 1;
                    scale = 1;
                  } else if (cubeNum === currentCubeIndex) {
                    // Ice is melting
                    opacity = 0.8;
                    scale = meltScale;
                  }
                  // Else ice is gone (melted)

                  return (
                    <div 
                      key={index}
                      className={`w-12 h-12 ${currentTheme.ice} border-4 border-white shadow-inner transition-all duration-1000 ease-linear relative z-10`}
                      style={{ 
                        opacity: cubeNum <= currentCubeIndex ? opacity : 0,
                        transform: `scale(${cubeNum <= currentCubeIndex ? scale : 0}) rotate(${style.rotation}deg) translate(${style.xOffset}px, 0)`,
                        marginRight: `${style.marginRight}px`,
                        display: cubeNum > Math.ceil(timeLeft/300) + (timerMode==='focus'?0:0) && isActive ? 'block' : 'block' 
                      }}
                    >
                      {/* Reflection shine */}
                      <div className="absolute top-1 right-1 w-3 h-3 bg-white opacity-60"></div>
                    </div>
                  );
                })}
                 
                 {/* Water level rising as ice melts */}
                 <div className={`absolute bottom-0 left-0 w-full ${currentTheme.water} z-0 border-t-4 ${currentTheme.waterBorder} transition-all duration-1000 ease-linear`}
                      style={{ height: `${((totalDuration - timeLeft) / totalDuration) * 100}%` }}>
                    {/* Bubbles effect in water */}
                    <div className="absolute bottom-4 left-1/4 w-2 h-2 bg-white/50 animate-bounce"></div>
                    <div className="absolute bottom-8 right-1/4 w-3 h-3 bg-white/30 animate-pulse"></div>
                 </div>
              </div>
            </div>

            {/* DIGITAL TIMER */}
            <div className="text-center text-6xl font-bold tracking-widest mb-4 font-mono">
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </div>

             {/* MUSIC CONTROLS */}
             <div className="flex justify-center gap-2 mb-6">
                <div className={`flex border-4 border-gray-900 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-1`}>
                   {Object.keys(SOUNDS).map((soundKey) => (
                      <button
                        key={soundKey}
                        onClick={() => setSelectedSound(soundKey)}
                        className={`
                            p-2 hover:bg-white dark:hover:bg-gray-600 transition-colors 
                            ${selectedSound === soundKey ? 'bg-white dark:bg-gray-600 shadow-sm border-2 border-gray-300 dark:border-gray-500' : 'border-2 border-transparent'}
                        `}
                        title={SOUNDS[soundKey].name}
                      >
                          <span className="text-xl filter drop-shadow-sm">{SOUNDS[soundKey].icon}</span>
                      </button>
                   ))}
                </div>
             </div>

            {/* CONTROLS */}
            <div className="flex justify-center gap-4">
              {!isActive ? (
                <PixelButton onClick={toggleTimer} variant="primary" theme={currentTheme} className="w-32 text-xl">
                  <Play size={24} /> MULAI
                </PixelButton>
              ) : (
                <PixelButton onClick={toggleTimer} variant="secondary" theme={currentTheme} className="w-32 text-xl">
                  <Pause size={24} /> PAUSE
                </PixelButton>
              )}
              <PixelButton onClick={resetTimer} variant="neutral" theme={currentTheme}>
                <Square size={24} />
              </PixelButton>
            </div>
          </PixelCard>

          {/* TIMER SETTINGS */}
          <PixelCard color={darkMode ? 'bg-gray-800' : 'bg-pink-50'}>
            <h3 className="text-xl font-bold mb-4 border-b-4 border-gray-900 inline-block">PENGATURAN TIMER</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-lg mb-1">Fokus (Menit)</label>
                <input 
                  type="number" 
                  value={settings.focus}
                  onChange={(e) => updateSettings('focus', e.target.value)}
                  className="w-full p-2 border-4 border-gray-900 bg-white text-gray-900 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-lg mb-1">Istirahat</label>
                <input 
                  type="number" 
                  value={settings.break}
                  onChange={(e) => updateSettings('break', e.target.value)}
                  className="w-full p-2 border-4 border-gray-900 bg-white text-gray-900 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-lg mb-1">Ronde</label>
                <input 
                  type="number" 
                  value={settings.rounds}
                  onChange={(e) => updateSettings('rounds', e.target.value)}
                  className="w-full p-2 border-4 border-gray-900 bg-white text-gray-900 text-center font-bold"
                />
              </div>
            </div>
          </PixelCard>
        </div>

        {/* RIGHT COLUMN: EVENTS */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
             <h2 className="text-3xl font-bold">📅 JADWAL PENTING</h2>
             <PixelButton onClick={() => setShowEventModal(true)} variant="primary" theme={currentTheme} className="py-1">
               <Plus size={20} /> BARU
             </PixelButton>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {events.length === 0 && (
              <div className="text-center py-10 opacity-50 border-4 border-dashed border-gray-400">
                <p>Belum ada event.</p>
                <p>Tambah biar gak lupa!</p>
              </div>
            )}
            
            {events.sort((a,b) => new Date(a.date) - new Date(b.date)).map((event) => {
              const daysDiff = getDaysDiff(event.date);
              
              return (
                <div key={event.id} className={`
                  relative border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  flex items-center gap-4 transition-transform hover:-translate-y-1
                  ${darkMode ? 'bg-gray-700' : 'bg-white'}
                `}>
                  <div className={`w-16 h-16 ${currentTheme.ice} border-4 border-gray-900 flex items-center justify-center text-3xl transition-colors`}>
                    {event.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold uppercase truncate">{event.title}</h3>
                    <p className="text-sm opacity-70">{new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    {/* Logic Tampilan Countdown */}
                    {daysDiff > 0 ? (
                      <>
                        <div className="text-2xl font-bold text-pink-500">{daysDiff}</div>
                        <div className="text-xs">HARI LAGI</div>
                      </>
                    ) : daysDiff === 0 ? (
                      <div className="text-xl font-bold text-green-500 animate-pulse">HARI INI!</div>
                    ) : (
                      <div className="text-xl font-bold text-gray-400">SELESAI</div>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 border-2 border-black hover:scale-110 transition-transform"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MODAL ADD EVENT */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <PixelCard className="w-full max-w-md animate-in fade-in zoom-in duration-200 text-gray-900">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-2xl font-bold">TAMBAH EVENT</h3>
               <button onClick={() => setShowEventModal(false)}>
                 <X size={32} />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block mb-2">Nama Event</label>
                 <input 
                    type="text" 
                    placeholder="Ujian Nasional, Pensi..." 
                    className="w-full border-4 border-gray-900 p-2 font-sans text-lg bg-white text-gray-900"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block mb-2">Tanggal</label>
                 <input 
                    type="date" 
                    className="w-full border-4 border-gray-900 p-2 font-sans text-lg bg-white text-gray-900"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                 />
               </div>
               <div className="flex gap-2 pt-4">
                 <PixelButton onClick={addEvent} variant="primary" theme={currentTheme} className="flex-1">SIMPAN</PixelButton>
                 <PixelButton onClick={() => setShowEventModal(false)} variant="danger" theme={currentTheme}>BATAL</PixelButton>
               </div>
             </div>
          </PixelCard>
        </div>
      )}

      {/* FIXED: Removed 'jsx' and 'global' attributes from style tag */}
      <style>{`
        ::-webkit-scrollbar {
          width: 12px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-left: 2px solid #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #000; 
          border: 2px solid #fff;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555; 
        }
        input[type="date"] {
            font-family: 'VT323', monospace;
        }
      `}</style>
    </div>
  );
}