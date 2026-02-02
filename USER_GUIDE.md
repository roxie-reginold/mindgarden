# MindGarden - User Guide

Welcome to **MindGarden**, where your thoughts take root and grow into living art. This guide will help you make the most of your reflective journey.

---

## What is MindGarden?

MindGarden is an AI-powered journaling tool that transforms your thoughts into botanical illustrations. Each thought you "plant" becomes a unique plant that grows as you reflect on it over time.

### The Growth Metaphor

Your thoughts evolve through four natural stages:

🌱 **Seed** → First planted, potential waiting  
🌿 **Sprout** → Beginning to take shape  
🌸 **Bloom** → Flourishing with insight  
🍎 **Fruit** → Mature and complete

---

## Getting Started

### 1. Accessing MindGarden

When you first open MindGarden, you'll see a floating island—your garden canvas.

**If you're using AI Studio**: The app will use your AI Studio API key automatically  
**If running locally**: You'll need to provide a Gemini API key (see technical documentation)

### 2. Understanding the Interface

**Garden View** 🌿  
- Visual representation of your thoughts as plants on islands
- Scroll horizontally to see more islands as your garden grows
- Click any plant to view details

**List View** 📋  
- Organized view of all thoughts grouped by category
- Shows growth stage, emotion, and next steps
- Good for finding specific thoughts quickly

**Switch Views**: Use the toggle in the top navigation

---

## Planting Your First Thought

### Step 1: Open the Planting Modal
Click the **"Sow a New Seed"** button at the bottom of the garden.

### Step 2: Choose a Category
Select what type of thought this is:
- 💡 **Idea** - Creative sparks, concepts
- ✓ **Todo** - Tasks, things to do
- 😰 **Worry** - Concerns, anxieties
- ❤️ **Feeling** - Emotions, moods
- 🎯 **Goal** - Aspirations, objectives
- 📝 **Memory** - Recollections, experiences
- ✨ **Other** - Anything else

### Step 3: Write Your Thought
Type what's on your mind. It can be:
- A single sentence or a paragraph
- A question or statement
- Something specific or abstract

Examples:
- "I want to learn how to cook authentic Italian pasta"
- "Feeling overwhelmed by upcoming deadlines"
- "Remember that amazing sunset at the beach last summer"

### Step 4: Plant It
Click **"Plant in Garden"** and watch the magic happen!

**What Happens Next**:
1. AI analyzes your thought
2. Generates a poetic reflection
3. Creates a unique botanical illustration
4. Places it in your garden

---

## Viewing Your Thoughts

### In the Garden
- **Plants appear** as illustrated botanicals on islands
- **New badge** (⭐) marks thoughts you haven't opened yet
- **Colored dots** indicate growth stage:
  - Gray = Seed
  - Green = Sprout  
  - Pink/Purple = Bloom
  - Yellow/Orange = Fruit

### Click to Open
Clicking a plant opens the **Reflection Modal** with:

**Top Section**:
- Circular plant illustration
- AI-generated reflection (poetic interpretation)
- Emotion and topic tags
- Current growth stage

**Next Step Card** (if available):
AI suggests an actionable next step:
- 🦶 **A small step** - Something to do
- 💡 **To clarify** - Something to explore
- ❤️ **To reflect** - Something to contemplate

**Growth Log**:
- Your original thought
- Timeline of all updates
- AI responses to each update

---

## Watering Your Thoughts (Updates)

As your thoughts evolve in real life, you can "water" them with updates.

### How to Water

1. **Open a thought** from the garden or list view
2. **Scroll to the bottom** of the Reflection Modal
3. **Type an update** in the input field
4. **Click the send button** (→)

### What to Include in Updates

- Progress on tasks or goals
- New insights or realizations
- How you're feeling about it now
- Actions you've taken
- Questions that arose

Examples:
- "Started researching pasta recipes, found a great carbonara tutorial"
- "The deadline passed but I realized I was overestimating the work"
- "Went back to that beach today and took photos"

### What Happens
- AI acknowledges your update with a personalized response
- Your thought may **advance to the next growth stage**
- If it advances, a **new illustration is generated** showing the plant's growth
- A **new next step** might be suggested

### Growth Progression
You don't control when thoughts advance—the AI decides based on:
- Depth of reflection
- Progress toward resolution
- Emotional development

Not every update will advance the stage, and that's okay! Some thoughts need time.

---

## Managing Your Garden

### Deleting Thoughts
1. Open the thought
2. Click **"Clear"** button in the bottom-right
3. Confirm deletion

**Note**: Deleted thoughts free up space for new plants in the same slot.

### Viewing All Thoughts
Switch to **List View** to:
- See all thoughts at once
- Group by category (ideas, todos, feelings, etc.)
- Quickly scan emotions and next steps

### Understanding Emotions
Each thought is tagged with an emotional quality detected by AI:
- Joy, Hope, Curiosity (positive)
- Anxiety, Sadness, Frustration (challenging)
- Calm, Neutral, Reflective (balanced)

This helps you see patterns in your mental garden over time.

---

## Tips for a Thriving Garden

### 🌱 Be Authentic
Write what's truly on your mind. The AI responds to genuine thoughts, not what you think you "should" say.

### 💧 Water Regularly
Revisit thoughts as they evolve in real life. Even small updates help them grow.

### 🌸 Embrace All Stages
Not every thought needs to reach "fruit." Some are meant to bloom and that's enough.

### 🏝️ Let It Grow Organically
Don't force updates. Come back when you have something genuine to add.

### 🎨 Enjoy the Art
Each illustration is unique. Notice the details—they often reflect the thought's emotional tone.

### 📖 Read Your Reflections
The AI-generated reflections often capture insights you didn't consciously notice. They can be surprisingly meaningful.

---

## Advanced Features

### Multiple Islands
As you plant more thoughts (beyond 12), the garden expands to new islands:
- **Swipe left/right** on mobile
- **Click arrows** or scroll on desktop
- Each island holds up to 12 plants

### Next Step Types

**🦶 A Small Step (Do)**  
Concrete action you can take. These are practical and specific.

**💡 To Clarify (Clarify)**  
Question to explore or aspect to examine further. These deepen understanding.

**❤️ To Reflect (Reflect)**  
Invitation to sit with a feeling or insight. These process emotions.

### Fruit Stage Completion
When a thought reaches **Fruit** stage:
- You can no longer water it
- It's considered "complete"
- You'll see: *"This thought has borne fruit. It is safe to rest now."*

This doesn't mean you failed—it means the thought has reached maturity!

---

## Storage & Privacy

### Where Your Thoughts Are Saved

**Option 1: Local Storage (Default)**  
- Saved in your browser using IndexedDB
- Completely private
- Only accessible on this device/browser
- No account needed

**Option 2: Supabase Cloud (Optional)**  
- Saved to a cloud database
- Sync across devices
- Still private to your anonymous ID
- Configure in Settings (⚙️)

### Privacy Notes
- Your thoughts are **never** shared with others
- AI processing happens via Gemini API (Google)
- Images are generated on-demand and stored with your data
- No analytics or tracking beyond what's needed for functionality

---

## Troubleshooting

### "The soil is listening..." never completes
- Check your internet connection
- Verify API key is configured
- Try a shorter thought initially

### Images appear as simple placeholders
- Image generation may have failed (network/API issue)
- The thought still works—just with a basic visual

### Plants overlap or look misaligned
- Try refreshing the page
- This might be a display issue with the garden layout

### Thoughts disappear after refresh
- If using local storage: Check browser isn't in private/incognito mode
- If using Supabase: Verify connection in Settings

### Updates don't seem to advance growth
- Not every update advances growth—this is intentional
- Keep watering authentically; advancement happens when the AI detects significant development

---

## Frequently Asked Questions

**Q: How many thoughts can I have?**  
A: Unlimited! The garden expands to new islands automatically.

**Q: Can I edit a thought after planting?**  
A: No, but you can add updates via "watering." The original thought stays as a record.

**Q: Why did my plant's illustration change?**  
A: When thoughts advance to a new growth stage, the AI generates a new illustration showing the plant's development.

**Q: What determines the plant species?**  
A: The AI chooses based on your thought's emotion and category. It maintains the same species through all growth stages.

**Q: Can I export my garden?**  
A: Not currently, but this could be a future feature!

**Q: Does the AI remember my previous thoughts?**  
A: Each thought is independent. The AI considers a thought's history when you water it, but doesn't cross-reference other thoughts.

---

## Philosophy of Use

MindGarden isn't a traditional to-do list or journal. It's a space for:

✨ **Observation** - Notice what you're thinking and feeling  
🌱 **Patience** - Let thoughts develop at their own pace  
💧 **Tending** - Regular small check-ins rather than intense sessions  
🌸 **Growth** - Watching how thoughts change as you change

Use it however feels right for you. There's no "correct" way to garden.

---

## Getting Help

- **Technical Issues**: See [DOCUMENTATION.md](file:///Users/amberwang/Desktop/MindGarden/DOCUMENTATION.md)
- **Supabase Setup**: Check Settings modal or technical docs
- **API Keys**: Visit [Google AI Studio](https://aistudio.google.com)

---

Happy gardening! 🌿✨
