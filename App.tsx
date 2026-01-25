import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GardenCanvas } from './components/GardenCanvas';
import { ListView } from './components/ListView';
import { PlantingModal } from './components/PlantingModal';
import { ReflectionModal } from './components/ReflectionModal';
import { AppView, ThoughtCard, ThoughtCategory, Position } from './types';
import { generateMindGardenContent, waterMindGardenThought } from './services/geminiService';
import { saveThought, getThoughts, deleteThought } from './services/storageService';
import { Toaster, toast } from 'react-hot-toast';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.GARDEN);
  const [isPlanting, setIsPlanting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedThought, setSelectedThought] = useState<ThoughtCard | null>(null);
  const [gardenThoughts, setGardenThoughts] = useState<ThoughtCard[]>([]);

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
             newStage: result.newStage
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

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <Header currentView={view} setView={setView} />
      
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