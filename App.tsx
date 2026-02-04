import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GardenCanvas } from './components/GardenCanvas';
import { ListView } from './components/ListView';
import { PlantingModal } from './components/PlantingModal';
import { ReflectionModal } from './components/ReflectionModal';
import { AppView, ThoughtCard, ThoughtCategory, Position } from './types';
import { generateMindGardenContent, waterMindGardenThought } from './services/geminiService';
import { saveThought, getThoughts, deleteThought } from './services/storageService';
import { searchTrack } from './services/spotifyService';
import { Toaster, toast } from 'react-hot-toast';
import { Key } from 'lucide-react';
import { getNextAvailableSlot, slotToPosition, SLOTS_PER_ISLAND } from './hooks/useIslandLayout';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.GARDEN);
  const [isPlanting, setIsPlanting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedThought, setSelectedThought] = useState<ThoughtCard | null>(null);
  const [gardenThoughts, setGardenThoughts] = useState<ThoughtCard[]>([]);
  const [islandCount, setIslandCount] = useState(1);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API Key
  useEffect(() => {
    const checkKey = async () => {
      try {
        const win = window as any;
        if (win.aistudio) {
          const has = await win.aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.warn("API Key check failed, proceeding with assumption of env key", e);
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  // Load thoughts
  useEffect(() => {
    refreshGarden();
  }, []);

  const refreshGarden = async () => {
    try {
      const thoughts = await getThoughts();
      // Sort by creation to ensure logical timeline, though rendering depends on slot
      setGardenThoughts(thoughts.sort((a, b) => a.createdAt - b.createdAt));
    } catch (error) {
      console.error("Failed to load garden:", error);
      toast.error("Could not load your garden.");
    }
  };

  const handleApiKeySelect = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // --- SLOT LOGIC FOR ORGANIC PLACEMENT ---
  // Slot definitions now live in hooks/useIslandLayout.ts (shared with GardenCanvas).
  // islandCount is expanded automatically when all slots are full.

  // Sync islandCount to match the actual number of islands needed.
  // Grows when thoughts land on higher islands, shrinks when deletions
  // leave upper islands empty.
  useEffect(() => {
    if (gardenThoughts.length === 0) {
      setIslandCount(1);
      return;
    }
    const maxIsland = gardenThoughts.reduce(
      (max, t) => Math.max(max, Math.floor(t.position.x / 100)),
      0
    );
    setIslandCount(maxIsland + 1);
  }, [gardenThoughts]);

  const getNextAvailablePosition = (currentThoughts: ThoughtCard[]): Position => {
    let currentCount = islandCount;

    // Try to find a free slot within the current island count
    let slot = getNextAvailableSlot(currentThoughts, currentCount);

    if (!slot) {
      // All islands full — expand by adding one more island
      currentCount += 1;
      setIslandCount(currentCount);
      slot = getNextAvailableSlot(currentThoughts, currentCount);
    }

    // slot is guaranteed non-null now (new island has 12 free slots)
    return slotToPosition(slot!);
  };

  const handlePlant = async (text: string) => {
    setIsLoading(true);
    const loadingToast = toast.loading('The soil is listening...');
    
    try {
      const { songSuggestion, ...content } = await generateMindGardenContent(text);
      
      // Calculate position based on next available slot
      const position = getNextAvailablePosition(gardenThoughts);
      
      // Try to fetch music recommendation from Spotify (non-blocking)
      let musicRecommendation = undefined;
      try {
        if (songSuggestion?.query) {
          toast.loading('Finding your song...', { id: loadingToast });
          musicRecommendation = await searchTrack(
            songSuggestion.query,
            songSuggestion.reasoning
          );
        }
      } catch (musicError) {
        // Silently fail - thought still gets planted without music
        console.warn('Failed to fetch music:', musicError);
      }
      
      const newCard: ThoughtCard = {
        ...content,
        id: crypto.randomUUID(),
        originalText: text,
        createdAt: Date.now(),
        position,
        hasViewed: false,
        growthStage: 'seed',
        updates: [],
        music: musicRecommendation || undefined
      };

      await saveThought(newCard);
      await refreshGarden();
      
      setIsPlanting(false);
      
      // Small delay to let animation start
      setTimeout(() => setSelectedThought(newCard), 800);
      
      toast.success(`Planted a ${content.meta.plantSpecies} seed`, { id: loadingToast });
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
         imageUrl: result.newImageUrl || thought.imageUrl, 
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
       
       if (result.newImageUrl) {
           toast.success('Your plant has grown!', { id: loadingToast });
       } else {
           toast.success('Nourished', { id: loadingToast });
       }
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      <Header
        currentView={view}
        setView={setView}
      />
      
      <main className="pt-16 h-screen">
        {view === AppView.GARDEN && (
          <GardenCanvas
            thoughts={gardenThoughts}
            islandCount={islandCount}
            onPlantClick={setSelectedThought}
            onNewThoughtClick={() => setIsPlanting(true)}
          />
        )}

        {view === AppView.LIST && (
          <div className="h-full overflow-y-auto">
            <ListView
              thoughts={gardenThoughts}
              onThoughtClick={setSelectedThought}
              onDelete={handleDelete}
            />
          </div>
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