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

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.GARDEN);
  const [isPlanting, setIsPlanting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedThought, setSelectedThought] = useState<ThoughtCard | null>(null);
  const [gardenThoughts, setGardenThoughts] = useState<ThoughtCard[]>([]);
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
  
  // Tuned coordinates for the "Two Islands" image (3:2 Aspect Ratio)
  // Left Island: x 5-55%
  // Right Island: x 60-95%
  const ISLAND_SLOTS = [
    // --- Left Island (Large L-Shape) ---
    { x: 15, y: 55 }, // Top-left tip
    { x: 35, y: 40 }, // Top-center (back)
    { x: 50, y: 45 }, // Top-right tip of left island
    { x: 25, y: 65 }, // Mid-left
    { x: 45, y: 60 }, // Mid-right (near path)
    { x: 20, y: 80 }, // Bottom-left lobe
    { x: 40, y: 75 }, // Bottom-center
    
    // --- Right Island (Kidney Shape) ---
    { x: 75, y: 50 }, // Top-center
    { x: 90, y: 60 }, // Top-right lobe
    { x: 65, y: 70 }, // Left edge
    { x: 85, y: 75 }, // Right edge
    { x: 75, y: 85 }, // Bottom tip
  ];

  const getNextAvailablePosition = (currentThoughts: ThoughtCard[]): Position => {
    // We want to fill gaps if thoughts were deleted, or append.
    // Let's iterate through all possible slot indices (0 to infinity)
    // and find the first one that isn't occupied.
    
    // Create a set of occupied "Global Indices"
    // Global Index = islandIndex * slotsPerIsland + localSlotIndex
    const occupiedIndices = new Set<number>();
    const SLOTS_PER_ISLAND = ISLAND_SLOTS.length;

    currentThoughts.forEach(t => {
      // Reverse engineer the index from the position
      const islandIndex = Math.floor(t.position.x / 100);
      const localX = t.position.x % 100;
      const localY = t.position.y;
      
      // Find which slot this corresponds to (with tolerance for float math)
      const slotIndex = ISLAND_SLOTS.findIndex(slot => 
        Math.abs(slot.x - localX) < 1 && Math.abs(slot.y - localY) < 1
      );
      
      if (slotIndex !== -1) {
        const globalIndex = islandIndex * SLOTS_PER_ISLAND + slotIndex;
        occupiedIndices.add(globalIndex);
      }
    });

    // Find first free index
    let i = 0;
    while (occupiedIndices.has(i)) {
      i++;
    }

    // Convert free index back to position
    const islandIndex = Math.floor(i / SLOTS_PER_ISLAND);
    const localSlotIndex = i % SLOTS_PER_ISLAND;
    const slot = ISLAND_SLOTS[localSlotIndex];

    return {
      x: (islandIndex * 100) + slot.x,
      y: slot.y
    };
  };

  const handlePlant = async (text: string) => {
    setIsLoading(true);
    const loadingToast = toast.loading('The soil is listening...');
    
    try {
      const { songSuggestion, ...content } = await generateMindGardenContent(text);
      const position = getPositionForCategory(content.meta.category);
      const content = await generateMindGardenContent(text);
      
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