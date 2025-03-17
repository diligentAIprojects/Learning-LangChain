import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Global configuration object - Feel free to modify these settings
const CONFIG = {
  sceneCount: 3, // The number of scenes in the comic book
};

/**
 * Define the state schema for our comic book story generator
 * This controls what data is stored and passed between nodes in our graph
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

  // Story plan
  storyPlan: Annotation<{
    title: string;
    premise: string;
    characters: { name: string; description: string }[];
    settings: { name: string; description: string }[];
    scenes: { title: string; description: string }[];
  }>({
    reducer: (current, update) => update,
  }),

  // Scenes with visual descriptions
  scenes: Annotation<
    {
      sceneNumber: number;
      title: string;
      description: string;
      characters: string[];
      setting: string;
      imagePrompt: string;
    }[]
  >({
    default: () => [],
    reducer: (current, update) => current.concat(update),
  }),

  // Final output
  finalOutput: Annotation<{
    title: string;
    premise: string;
    scenes: {
      sceneNumber: number;
      title: string;
      description: string;
      imagePrompt: string;
    }[];
  }>({
    reducer: (current, update) => update,
  }),
});

// Initialize AI model
// TODO: Workshop Exercise 1 (EASY) - Change the model provider
// Replace the OpenAI model with a different provider (Claude/Mistral/Groq)
//
// 1. Import the appropriate model class at the top of the file
// 2. Replace this model configuration with one for your chosen provider
// 3. Look up the correct model name for your provider
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

/**
 * Process audience inputs
 * This node handles the initial data and makes sure it's in the right format
 */
const processInputs = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Processing audience inputs...");

  // Handle different input formats
  if (state.audience_inputs && Array.isArray(state.audience_inputs)) {
    return {}; // Input is already in the expected format
  } else if (
    state.audience_inputs &&
    state.audience_inputs.audience_inputs &&
    Array.isArray(state.audience_inputs.audience_inputs)
  ) {
    // Input is in the format { audience_inputs: [...] }
    return { audience_inputs: state.audience_inputs.audience_inputs };
  }

  return {}; // Keep as is if we can't determine the format

  // You can enhance this function to improve input handling if needed
};

/**
 * Plan the story based on audience inputs
 * This node generates the overall narrative structure
 */
const planStory = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Planning story...");

  // Get the audience inputs directly from the state
  const inputItems = state.audience_inputs || [];

  // Create a mapping function to extract categories
  const getCategoryItems = (category) => {
    return inputItems
      .filter(
        (item) =>
          item.category === category ||
          item.category === category.replace("_", "-")
      )
      .map((item) => item.description);
  };

  // Extract basic categories
  const characters = getCategoryItems("character");
  const settings = getCategoryItems("setting");
  const plotTwists = getCategoryItems("plot_twist");

  // You can extract more categories to enrich your story

  // Define the story plan schema
  const storyPlanSchema = z.object({
    title: z
      .string()
      .describe("An engaging title for the murder mystery comic"),
    premise: z
      .string()
      .describe("A concise description of the overall mystery"),
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
          description: z.string().describe("What happens in this scene"),
        })
      )
      .describe(`The story should have exactly ${CONFIG.sceneCount} scenes`),
  });

  // Create a prompt for the story plan
  const storyPlanPrompt = `
    Create a comic book SHORT MURDER MYSTERY story plan based on the following audience submissions:
    
    ${characters.length > 0 ? `CHARACTERS:\n${characters.join("\n")}` : ""}
    
    ${settings.length > 0 ? `SETTINGS:\n${settings.join("\n")}` : ""}
    
    ${plotTwists.length > 0 ? `PLOT TWISTS:\n${plotTwists.join("\n")}` : ""}
    
    IMPORTANT: 
    - The comic will have EXACTLY ${CONFIG.sceneCount} scenes.
    - Create a complete murder mystery with a clear beginning, middle, and cliffhanger ending.
    - Each scene should have a max of 200 words.
    - Be creative and develop a unique story that integrates these elements.
    
    // You can add more specific instructions for the story plan
  `;

  // Generate the story plan using the model
  const storyPlan = await model
    .withStructuredOutput(storyPlanSchema, { name: "story_plan" })
    .invoke(storyPlanPrompt);

  // Ensure we have exactly the configured number of scenes
  let scenes = storyPlan.scenes;
  if (scenes.length !== CONFIG.sceneCount) {
    console.log(
      `Warning: Got ${scenes.length} scenes, adjusting to ${CONFIG.sceneCount}`
    );
    while (scenes.length < CONFIG.sceneCount) {
      scenes.push({
        title: `Scene ${scenes.length + 1}`,
        description: `Continuation of the mystery...`,
      });
    }
    scenes = scenes.slice(0, CONFIG.sceneCount);
  }

  return {
    storyPlan: {
      ...storyPlan,
      scenes,
    },
  };
};

/**
 * Generate scenes with visual descriptions
 * This node creates detailed scenes and image prompts
 */
const generateScenes = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Generating scenes with visual descriptions...");

  const scenes = [];

  // Generate each scene sequentially
  for (let i = 0; i < CONFIG.sceneCount; i++) {
    const sceneNumber = i + 1;
    const scenePlan = state.storyPlan.scenes[i];

    // Schema for the scene and visual description
    const sceneSchema = z.object({
      sceneNumber: z.number().describe(`Scene number (1-${CONFIG.sceneCount})`),
      title: z.string().describe("Scene title"),
      description: z
        .string()
        .describe("Detailed scene description (max 200 words)"),
      characters: z
        .array(z.string())
        .describe("Characters present in the scene"),
      setting: z.string().describe("Setting of the scene"),
      imagePrompt: z
        .string()
        .describe("Image generation prompt (max 75 words)"),
    });

    // Create a prompt for scene generation
    const scenePrompt = `
      Create scene ${sceneNumber} of a ${CONFIG.sceneCount}-scene murder mystery comic book based on this story plan:
      
      TITLE: ${state.storyPlan.title}
      PREMISE: ${state.storyPlan.premise}
      
      SCENE PLAN:
      ${scenePlan.title}: ${scenePlan.description}
      
      AVAILABLE CHARACTERS:
      ${JSON.stringify(state.storyPlan.characters)}
      
      AVAILABLE SETTINGS:
      ${JSON.stringify(state.storyPlan.settings)}
      
      Provide:
      1. A detailed scene description (max 200 words) that advances the murder mystery.
      2. List of characters present in this scene.
      3. The specific setting for this scene.
      4. An image generation prompt (max 75 words) focusing on key visual elements.
      
      The scene should be visually interesting and include details about:
      - Character expressions and positioning
      - Environmental details that create mood
      - Any important clues or evidence
      - Comic book style composition (panels, angles, etc.)
      
      If this is the final scene (${sceneNumber} of ${CONFIG.sceneCount}), end with a cliffhanger but don't make it obvious.
      
      // You can add more guidance for scene generation
    `;

    // Generate the scene using the model
    const scene = await model
      .withStructuredOutput(sceneSchema, { name: `scene_${sceneNumber}` })
      .invoke(scenePrompt);

    scenes.push(scene);
    console.log(`Generated scene ${sceneNumber}: ${scene.title}`);
  }

  return { scenes };
};

// TODO: Workshop Exercise 2 (MEDIUM) - Add a critique function
// Complete this function to evaluate and improve the generated scenes

const critiqueScenes = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Critiquing scenes...");

  const improvedScenes = [];

  for (const scene of state.scenes) {
    // Define your critique schema here
    const critiqueSchema = z.object({
      // Add schema properties for strengths, weaknesses, and improvements
      // Example:
      // strengths: z.array(z.string()).describe("Strengths of the scene"),
      // weaknesses: z.array(z.string()).describe("Areas for improvement"),
      // improvedDescription: z.string().describe("Enhanced scene description"),
      // improvedImagePrompt: z.string().describe("Enhanced image prompt")
    });

    // Create your critique prompt here
    const critiquePrompt = `
      As an expert comic book editor, critique and improve this murder mystery scene:
      
      SCENE ${scene.sceneNumber}: ${scene.title}
      DESCRIPTION: ${scene.description}
      IMAGE PROMPT: ${scene.imagePrompt}
      
      // Add instructions for what aspects to critique and how to improve
      // Example:
      // First identify strengths and weaknesses of this scene in terms of:
      // - Visual storytelling and composition
      // - Mystery elements and clue placement
      // - Character development and dialogue
      // - Pacing and tension
      // 
      // Then provide improved versions of both the scene description and image prompt
      // that address the weaknesses while preserving the strengths.
    `;

    // Generate critique and improvements
    const critique = await model
      .withStructuredOutput(critiqueSchema, {
        name: `critique_scene_${scene.sceneNumber}`,
      })
      .invoke(critiquePrompt);

    // Create improved scene with critique feedback
    improvedScenes.push({
      // Use critique results to create an improved scene
      // Example:
      // ...scene,
      // description: critique.improvedDescription,
      // imagePrompt: critique.improvedImagePrompt
    });
  }

  return { scenes: improvedScenes };
};

// To use this function, uncomment the following in the main graph:
// .addNode("critiqueScenes", critiqueScenes)
// .addEdge("generateScenes", "critiqueScenes")
// .addEdge("critiqueScenes", "formatOutput")

/**
 * Format the final output
 * This node organizes the generated content into a structured format
 */
const formatOutput = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Formatting final output...");

  // Sort scenes by number
  const finalScenes = [...state.scenes].sort(
    (a, b) => a.sceneNumber - b.sceneNumber
  );

  // Create simplified output format
  const simplifiedScenes = finalScenes.map((scene) => ({
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    description: scene.description,
    imagePrompt: scene.imagePrompt,
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
 * Create the main graph
 * This defines the workflow of our story generator
 */
export const comicBookGraph = new StateGraph(StoryStateAnnotation)
  .addNode("processInputs", processInputs)
  .addNode("planStory", planStory)
  .addNode("generateScenes", generateScenes)
  .addNode("formatOutput", formatOutput)

  // Define the basic flow
  .addEdge("__start__", "processInputs")
  .addEdge("processInputs", "planStory")
  .addEdge("planStory", "generateScenes")
  .addEdge("generateScenes", "formatOutput")
  .addEdge("formatOutput", "__end__")

  // To add the critique function to the graph:
  // .addNode("critiqueScenes", critiqueScenes)
  // .addEdge("generateScenes", "critiqueScenes")
  // .addEdge("critiqueScenes", "formatOutput")

  .compile();
