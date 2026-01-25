import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GardenCanvas } from './components/GardenCanvas';
import { ListView } from './components/ListView';
import { PlantingModal } from './components/PlantingModal';
import { ReflectionModal } from './components/ReflectionModal';
import { SettingsModal } from './components/SettingsModal';
import { AppView, ThoughtCard, ThoughtCategory, Position } from './types';
import { generateMindGardenContent, waterMindGardenThought } from './services/geminiService';
import { saveThought, getThoughts, deleteThought } from './services/storageService';
import { Toaster, toast } from 'react-hot-toast';
import { Key } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.GARDEN);
  const [isPlanting, setIsPlanting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedThought, setSelectedThought] = useState<ThoughtCard | null>(null);
  const [gardenThoughts, setGardenThoughts] = useState<ThoughtCard[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API Key on mount (Required for Gemini 3 Pro Image)
  useEffect(() => {
    const checkKey = async () => {
      try {
        const win = window as any;
        if (win.aistudio) {
          const has = await win.aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        } else {
          // Fallback if not running in IDX/Project IDX environment, assume env key works
          setHasApiKey(true);
        }
      } catch (e) {
        console.warn("API Key check failed, proceeding with assumption of env key", e);
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  // Load thoughts on mount
  useEffect(() => {
    refreshGarden();
  }, []);

  const refreshGarden = async () => {
    try {
      const thoughts = await getThoughts();
      setGardenThoughts(thoughts);
    } catch (error) {
      console.error("Failed to load garden:", error);
      toast.error("Could not load your garden.");
    }
  };

  const handleApiKeySelect = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasApiKey(true);
    }
  };

  const getPositionForCategory = (category: ThoughtCategory): Position => {
    // Map Layout based on "MindGarden" reference:
    // To-Do Patch: Top Left
    // Ideas Meadow: Top Right
    // Memory Blossoms: Top Center
    // Feelings Grove: Center Left
    // Worry Shade: Center Right
    // Goal Vines: Bottom Center

    let xRange = [0, 100];
    let yRange = [0, 100];

    switch(category) {
      case 'todo': 
        // Top Left
        xRange = [10, 30]; yRange = [15, 35]; break;
      case 'idea': 
        // Top Right
        xRange = [65, 85]; yRange = [10, 30]; break;
      case 'memory': 
        // Top Center
        xRange = [40, 60]; yRange = [15, 30]; break;
      case 'feeling': 
        // Center Left
        xRange = [15, 35]; yRange = [45, 65]; break;
      case 'worry': 
        // Center Right
        xRange = [65, 85]; yRange = [40, 60]; break;
      case 'goal': 
        // Bottom Center
        xRange = [35, 65]; yRange = [60, 80]; break;
      default: 
        // Random edges for 'other'
        xRange = [10, 90]; yRange = [10, 90]; break;
    }

    // Add some randomness within the zone
    const x = Math.floor(Math.random() * (xRange[1] - xRange[0]) + xRange[0]);
    const y = Math.floor(Math.random() * (yRange[1] - yRange[0]) + yRange[0]);
    
    return { x, y };
  };

  const handlePlant = async (text: string) => {
    setIsLoading(true);
    const loadingToast = toast.loading('The soil is listening...');
    
    try {
      const content = await generateMindGardenContent(text);
      const position = getPositionForCategory(content.meta.category);
      
      const newCard: ThoughtCard = {
        ...content,
        id: crypto.randomUUID(),
        originalText: text,
        createdAt: Date.now(),
        position,
        hasViewed: false,
        growthStage: 'seed',
        updates: []
      };

      await saveThought(newCard);
      await refreshGarden();
      
      setIsPlanting(false);
      // Open the detail view immediately for gratification
      setSelectedThought(newCard);
      toast.success('Planted!', { id: loadingToast });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Could not plant seed', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWater = async (thought: ThoughtCard, updateText: string) => {
     const loadingToast = toast.loading('Watering...');
     try {
       const result = await waterMindGardenThought(thought, updateText);
       
       const updatedThought: ThoughtCard = {
         ...thought,
         growthStage: result.newStage,
         meta: {
           ...thought.meta,
           hasNextStep: result.hasNextStep,
           nextStep: result.nextStep
         },
         updates: [
           {
             id: crypto.randomUUID(),
             timestamp: Date.now(),
             text: updateText,
             aiResponse: result.acknowledgment,
             previousStage: thought.growthStage,
             newStage: result.newStage,
             nextStep: result.nextStep
           },
           ...thought.updates
         ]
       };

       await saveThought(updatedThought);
       await refreshGarden();
       setSelectedThought(updatedThought);
       toast.success('Nourished', { id: loadingToast });
     } catch (error) {
       console.error(error);
       toast.error('Failed to water plant', { id: loadingToast });
     }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this thought?')) {
      try {
        await deleteThought(id);
        await refreshGarden();
        setSelectedThought(null);
        toast.success('Removed from garden');
      } catch (e) {
        toast.error('Failed to remove thought');
      }
    }
  };

  // API Key Gate
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
           <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-amber-100 rounded-full blur-3xl mix-blend-multiply" />
           <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-teal-100 rounded-full blur-3xl mix-blend-multiply" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-rose-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
             <Key className="text-stone-600 opacity-60" size={32} />
          </div>
          
          <h1 className="font-serif text-3xl text-stone-800 mb-4">Unlock the Garden</h1>
          <p className="text-stone-500 mb-8 leading-relaxed">
            MindGarden uses advanced AI (Gemini 3 Pro) to grow your thoughts into art. Please select your API key to enter.
          </p>
          
          <button 
            onClick={handleApiKeySelect}
            className="w-full py-4 px-6 bg-stone-800 hover:bg-stone-700 text-stone-50 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Select API Key</span>
          </button>

          <p className="mt-6 text-xs text-stone-400">
            Ensure your key has billing enabled. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">Billing Information</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <Header 
        currentView={view} 
        setView={setView} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <main className="pt-16">
        {view === AppView.GARDEN && (
          <GardenCanvas 
            thoughts={gardenThoughts}
            onPlantClick={setSelectedThought}
            onNewThoughtClick={() => setIsPlanting(true)}
          />
        )}

        {view === AppView.LIST && (
          <ListView 
            thoughts={gardenThoughts}
            onThoughtClick={setSelectedThought}
          />
        )}
      </main>

      {/* Overlays */}
      <PlantingModal 
        isOpen={isPlanting} 
        onClose={() => setIsPlanting(false)}
        onPlant={handlePlant}
        isLoading={isLoading}
      />

      <ReflectionModal 
        thought={selectedThought}
        onClose={() => setSelectedThought(null)}
        onDelete={handleDelete}
        onWater={handleWater}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={refreshGarden}
      />

      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#292524',
            color: '#fff',
            borderRadius: '50px',
            fontFamily: 'serif'
          }
        }}
      />
    </div>
  );
};

export default App;