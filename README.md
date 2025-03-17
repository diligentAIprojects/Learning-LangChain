# 🕵️‍♀️ Comic Book Murder Mystery Generator

Generate thrilling comic book murder mysteries with AI! This LangChain project teaches you how to build AI agents using StateGraph.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the LangGraph server
npx @langchain/langgraph-cli dev

# Then open the provided URL in your browser!
```

## 🔍 How It Works

Our LangChain agent follows this workflow:

1. 📥 **Process Inputs** - Parse characters, settings, plot elements
2. 📝 **Plan Story** - Generate a coherent murder mystery structure
3. 🎭 **Create Scenes** - Develop detailed scenes with visual prompts
4. 📚 **Format Output** - Organize into a structured comic book format

## 📝 Input Format

Use this JSON format with your choice of categories:

```json
{
  "audience_inputs": [
    {
      "category": "character",
      "description": "A retired astronaut in her 70s who still wears parts of her space suit."
    },
    {
      "category": "setting",
      "description": "A city built vertically on massive redwood trees."
    },
    {
      "category": "plot_twist",
      "description": "The hero's loyal companion was actually the villain all along."
    }
  ]
}
```

### 🎭 Categories

- **character** - Unique individuals with personalities & quirks
- **setting** - Interesting locations for scenes
- **plot_twist** - Unexpected turns of events
- **significant_prop** - Important objects driving the plot
- **character_backstory** - Past events explaining motivations
- **atmospheric_conditions** - Weather or mood elements
- **symbolic_motif** - Recurring symbols reinforcing themes
- **special_ability** - Unique powers or skills
- **cultural_element** - Traditions shaping the world
- **technology_concept** - Fictional devices or inventions
- **conflict** - Central tensions or problems
- **theme** - Underlying messages or ideas
- **character_relationship** - Connections between characters

## 🏋️ Workshop Exercises

### 💫 Exercise 1: Model Provider Integration

Switch to a different AI model provider:

```typescript
// From this:
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

// To something like this:
import { ChatGroq } from "@langchain/groq";
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192",
  temperature: 0.7,
});
```

### 🔧 Exercise 2: Story Critique & Enhancement

Improve the story quality by adding an AI editorial review step:

```typescript
// Complete the critiqueScenes function to:
// 1. Analyze strengths & weaknesses of each scene
// 2. Improve descriptions & visual prompts
// 3. Integrate better with the murder mystery theme

// Then connect it to the workflow:
.addNode("critiqueScenes", critiqueScenes)
.addEdge("generateScenes", "critiqueScenes")
.addEdge("critiqueScenes", "formatOutput")
```

The critique should evaluate:

- 🎨 Visual storytelling elements
- 🔎 Mystery clues & red herrings
- 👥 Character development
- ⏱️ Pacing & tension

## 🏆 Example Output

Your agent will generate:

- 📑 Title & premise for your murder mystery
- 📕 Detailed scenes with descriptions
- 🎨 Image prompts for visualization
- 👤 Character & setting details

## 🛠️ Troubleshooting

- ⚠️ **Model errors?** Check your API key and model name
- 🤔 **Strange outputs?** Look at console logs for prompt details
- 🔄 **Server issues?** Make sure LangGraph CLI is updated

## 🔮 Next Steps

After completing the workshop:

- 🖌️ Generate actual images from your prompts
- 🔁 Add user feedback loops
- 🌐 Expand to other story genres
- 🎮 Build an interactive UI
