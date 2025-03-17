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
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

// TODO: Workshop Exercise 1 (EASY) - Change the model provider
//
// WORKSHOP INSTRUCTIONS:
// Replace the OpenAI model with a different provider (Claude/Mistral/Groq)
//
// 1. Import the appropriate model class at the top of the file
//    Example: import { ChatAnthropic } from "@langchain/anthropic";
//
// 2. Replace this model configuration with one for your chosen provider
//    - Look up the correct model name for your provider
//    - Add any provider-specific parameters
//
// EXAMPLE (you should modify this for your chosen provider):
// const model = new ChatAnthropic({
//   model: "claude-3-haiku-20240307",
//   temperature: 0.7,
// });

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

// TODO: Workshop Exercise 2 (MEDIUM) - Add a critique function
//
// WORKSHOP INSTRUCTIONS:
// Implement a scene critique function that evaluates and improves the generated scenes
//
// 1. Create a function with this signature:
//    const critiqueScenes = async (state: typeof StoryStateAnnotation.State) => { ... }
//
// 2. Inside the function:
//    - Create a schema for critique feedback using z.object()
//    - Loop through each scene in state.scenes
//    - For each scene, create a prompt asking the model to critique it
//    - Use model.withStructuredOutput to get critique results
//    - Use the critique to create improved scenes
//    - Return the improved scenes
//
// 3. When you've implemented the function, add it to the graph
//    by uncommenting and modifying the appropriate edge connections
//
// FUNCTION SKELETON (fill in the missing implementation):
/*
const critiqueScenes = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Critiquing scenes...");
  
  // Create an array to hold the improved scenes
  const improvedScenes = [];
  
  // Loop through each scene
  for (const scene of state.scenes) {
    // TODO: Create your critique schema here
    const critiqueSchema = z.object({
      // Define your schema properties here
    });
    
    // TODO: Create your critique prompt here
    const critiquePrompt = `
      // Your prompt text here
    `;
    
    // TODO: Use the model to generate critique and improvements
    const critique = await model
      .withStructuredOutput(critiqueSchema, { name: `critique_scene_${scene.sceneNumber}` })
      .invoke(critiquePrompt);
    
    // TODO: Create an improved scene using the critique
    improvedScenes.push({
      // Your improved scene object here
    });
  }
  
  return { scenes: improvedScenes };
};
*/

// TODO: Workshop Exercise 3 (ADVANCED) - Create an enhanced visual description generator
//
// WORKSHOP INSTRUCTIONS:
// Implement a function that creates more detailed and artistic image prompts
//
// 1. Create a function with this signature:
//    const enhanceVisualDescription = async (state: typeof StoryStateAnnotation.State) => { ... }
//
// 2. Inside the function:
//    - Create a schema for visual elements using z.object()
//    - Loop through each scene in state.scenes
//    - For each scene, create a prompt asking for detailed visual analysis
//    - Use model.withStructuredOutput to get enhanced visual descriptions
//    - Use the results to create improved image prompts
//    - Return the scenes with enhanced prompts
//
// 3. When you've implemented the function, add it to the graph
//    by uncommenting and modifying the appropriate edge connections
//
// FUNCTION SKELETON (fill in the missing implementation):
/*
const enhanceVisualDescription = async (state: typeof StoryStateAnnotation.State) => {
  console.log("Enhancing visual descriptions...");
  
  // Create an array to hold the enhanced scenes
  const enhancedScenes = [];
  
  // Loop through each scene
  for (const scene of state.scenes) {
    // TODO: Create your visual elements schema here
    const visualSchema = z.object({
      // Define your schema properties here
      // Consider including: artisticStyle, colorPalette, composition, etc.
    });
    
    // TODO: Create your visual analysis prompt here
    const visualPrompt = `
      // Your prompt text here
    `;
    
    // TODO: Use the model to generate enhanced visual descriptions
    const enhancedVisual = await model
      .withStructuredOutput(visualSchema, { name: `enhance_visual_${scene.sceneNumber}` })
      .invoke(visualPrompt);
    
    // TODO: Create a scene with the enhanced image prompt
    enhancedScenes.push({
      // Your enhanced scene object here
    });
  }
  
  return { scenes: enhancedScenes };
};
*/

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

  // After implementing the workshop exercises, you can add them to the graph:
  // Example for Exercise 2: .addEdge("generateScenes", "critiqueScenes").addEdge("critiqueScenes", "formatOutput")
  // Example for Exercise 3: .addEdge("generateScenes", "enhanceVisualDescription").addEdge("enhanceVisualDescription", "formatOutput")

  .compile();
