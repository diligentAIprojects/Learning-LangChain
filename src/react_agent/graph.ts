import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

// Simplified configuration with fewer scenes for token efficiency
const CONFIG = {
  sceneCount: 3,
};

/**
 * Simplified state schema without image prompts
 */
const StoryStateAnnotation = Annotation.Root({
  // User input
  audience_inputs: Annotation<
    {
      category: string;
      description: string;
    }[]
  >({
    default: () => [],
    reducer: (current, update) => update,
  }),

  // Story plan - streamlined
  storyPlan: Annotation<{
    title: string;
    premise: string;
    characters: { name: string; description: string }[];
    settings: { name: string; description: string }[];
    scenes: { title: string; description: string }[];
  }>({
    reducer: (current, update) => update,
  }),

  // Scenes - removed visual descriptions
  scenes: Annotation<
    {
      sceneNumber: number;
      title: string;
      description: string;
      characters: string[];
      setting: string;
    }[]
  >({
    default: () => [],
    reducer: (current, update) => current.concat(update),
  }),

  // Final output - removed image prompts
  finalOutput: Annotation<{
    title: string;
    premise: string;
    scenes: {
      sceneNumber: number;
      title: string;
      description: string;
    }[];
  }>({
    reducer: (current, update) => update,
  }),
});

// Initialize AI model with adjusted parameters for reliability
const model = new ChatGroq({
  model: "gemma2-9b-it",
  temperature: 0.5, // Lower temperature for more deterministic outputs
  maxTokens: 1500, // Further reduced to avoid hitting limits
  maxRetries: 3, // Increased retries
  timeout: 60000, // 60 second timeout
});

/**
 * Process audience inputs
 */
const processInputs = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Processing inputs...");

  if (state.audience_inputs && Array.isArray(state.audience_inputs)) {
    return {};
  } else if (
    state.audience_inputs &&
    state.audience_inputs.audience_inputs &&
    Array.isArray(state.audience_inputs.audience_inputs)
  ) {
    return { audience_inputs: state.audience_inputs.audience_inputs };
  }

  return {};
};

/**
 * Plan the story based on audience inputs - streamlined prompt
 */
const planStory = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Planning story...");

  const inputItems = state.audience_inputs || [];
  const getCategoryItems = (category) => {
    return inputItems
      .filter(
        (item) =>
          item.category === category ||
          item.category === category.replace("_", "-")
      )
      .map((item) => item.description);
  };

  const characters = getCategoryItems("character");
  const settings = getCategoryItems("setting");
  const plotTwists = getCategoryItems("plot_twist");

  // Define the story plan schema - simplified
  const storyPlanSchema = z.object({
    title: z.string().describe("Title for the murder mystery comic"),
    premise: z.string().describe("Brief premise of the mystery"),
    characters: z.array(
      z.object({
        name: z.string().describe("Character name"),
        description: z.string().describe("Brief character description"),
      })
    ),
    settings: z.array(
      z.object({
        name: z.string().describe("Setting name"),
        description: z.string().describe("Setting description"),
      })
    ),
    scenes: z
      .array(
        z.object({
          title: z.string().describe("Scene title"),
          description: z.string().describe("Brief scene description"),
        })
      )
      .describe(`The story should have ${CONFIG.sceneCount} scenes`),
  });

  // Extremely simplified prompt
  const storyPlanPrompt = `
    Create a brief murder mystery with ${CONFIG.sceneCount} scenes using:
    ${characters.length > 0 ? `CHARACTERS: ${characters.join(", ")}` : "Create 2-3 characters"}
    ${settings.length > 0 ? `SETTINGS: ${settings.join(", ")}` : "Create 1-2 settings"}
    ${plotTwists.length > 0 ? `PLOT TWIST: ${plotTwists[0]}` : ""}
    
    Keep all descriptions under 100 words per scene.
  `;

  const storyPlan = await model
    .withStructuredOutput(storyPlanSchema, { name: "story_plan" })
    .invoke(storyPlanPrompt);

  // Ensure correct scene count
  let scenes = storyPlan.scenes;
  if (scenes.length !== CONFIG.sceneCount) {
    console.log(
      `Adjusting scenes from ${scenes.length} to ${CONFIG.sceneCount}`
    );
    while (scenes.length < CONFIG.sceneCount) {
      scenes.push({
        title: `Scene ${scenes.length + 1}`,
        description: `Continuation of the mystery...`,
      });
    }
    scenes = scenes.slice(0, CONFIG.sceneCount);
  }

  return { storyPlan: { ...storyPlan, scenes } };
};

const generateScenes = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Generating scenes...");

  const scenes = [];

  for (let i = 0; i < CONFIG.sceneCount; i++) {
    const sceneNumber = i + 1;
    const scenePlan = state.storyPlan.scenes[i];

    // Simplified scene schema with minimal requirements
    const sceneSchema = z.object({
      sceneNumber: z.number().describe(`Scene number (1-${CONFIG.sceneCount})`),
      title: z.string().describe("Scene title"),
      description: z.string().describe("Scene description (max 100 words)"),
      characters: z.array(z.string()).describe("Characters in the scene"),
      setting: z.string().describe("Setting name"),
    });

    // Extremely simplified prompt to reduce token usage
    const scenePrompt = `
      Create scene ${sceneNumber}/${CONFIG.sceneCount} for mystery "${state.storyPlan.title}":
      
      PLAN: ${scenePlan.title}
      
      AVAILABLE CHARACTERS: ${state.storyPlan.characters.map((c) => c.name).join(", ")}
      AVAILABLE SETTINGS: ${state.storyPlan.settings.map((s) => s.name).join(", ")}
      
      Provide:
      1. Brief scene description (max 100 words)
      2. List of 2-3 main characters present
      3. Single setting name
      
      ${sceneNumber === CONFIG.sceneCount ? "Include a cliffhanger." : ""}
    `;

    const scene = await model
      .withStructuredOutput(sceneSchema, { name: `scene_${sceneNumber}` })
      .invoke(scenePrompt);

    scenes.push(scene);
    console.log(`Generated scene ${sceneNumber}: ${scene.title}`);
  }

  return { scenes };
};

/**
 * Format the final output - simplified
 */
const formatOutput = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Formatting output...");

  const finalScenes = [...state.scenes].sort(
    (a, b) => a.sceneNumber - b.sceneNumber
  );

  const simplifiedScenes = finalScenes.map((scene) => ({
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    description: scene.description,
  }));

  return {
    finalOutput: {
      title: state.storyPlan.title,
      premise: state.storyPlan.premise,
      scenes: simplifiedScenes,
    },
  };
};

/**
 * Create the main graph - simplified workflow
 */
export const comicBookGraph = new StateGraph(StoryStateAnnotation)
  .addNode("processInputs", processInputs)
  .addNode("planStory", planStory)
  .addNode("generateScenes", generateScenes)
  .addNode("formatOutput", formatOutput)

  // Define the flow
  .addEdge("__start__", "processInputs")
  .addEdge("processInputs", "planStory")
  .addEdge("planStory", "generateScenes")
  .addEdge("generateScenes", "formatOutput")
  .addEdge("formatOutput", "__end__")

  .compile();
