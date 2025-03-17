import { Annotation, StateGraph, Command, Send } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Global configuration object
const CONFIG = {
  sceneCount: 3, // The number of scenes in the comic book
  revisionLimit: 1, // Maximum number of revision cycles before forcing progression
};

// =============== SINGLE SCENE VISUAL PROCESSING SUBGRAPH ===============

// Define state schema for single scene visual processing subgraph
const SingleSceneVisualProcessingAnnotation = Annotation.Root({
  // Input scene
  scene: Annotation<{
    sceneNumber: number;
    title: string;
    description: string;
    characters: string[];
    setting: string;
    narrativePhase: string;
  }>({
    reducer: (current, update) => update
  }),
  
  // Output visual description
  visualDescription: Annotation<{
    sceneNumber: number;
    visualElements: string;
    imagePrompt: string;
  }>({
    reducer: (current, update) => update
  }),
  
  // Critique state
  visualCritique: Annotation<{
    isApproved: boolean;
    feedback: string;
    revisionCount: number;
  }>({
    default: () => ({ isApproved: false, feedback: "", revisionCount: 0 }),
    reducer: (current, update) => update
  })
});

// Create visual description for a single scene
const createVisualDescription = async (state: typeof SingleSceneVisualProcessingAnnotation.State) => {
  console.log(`Creating visual description for scene ${state.scene.sceneNumber}...`);
  
  const scene = state.scene;
  
  const visualDescriptionSchema = z.object({
    sceneNumber: z.number().describe(`Scene number`),
    visualElements: z.string().describe("Key visual elements to include"),
    imagePrompt: z.string().describe("Focused prompt for image generation - MUST be under 75 words and 300 characters")
  });

  
  const visualPrompt = `
    Create a detailed visual description and image generation prompt for this comic book scene:
    
    SCENE ${scene.sceneNumber}: ${scene.title}
    DESCRIPTION: ${scene.description}
    CHARACTERS: ${scene.characters.join(", ")}
    SETTING: ${scene.setting}
    
    First, identify the key visual elements that should be included in this panel.
    These should capture the essence of the scene and advance the narrative.
    
    Then, create a detailed image generation prompt for AI image generation (DALL-E, Midjourney). Make sure it doesn't contain any elemets that would be blocked by the content filters. Make sure the images are always Safe for work but must maintain critical elemets of the story
    Focus on:
    1. Character appearance, positioning, and expressions
    2. Setting details and atmosphere
    3. Lighting, color palette, and mood
    4. Composition and perspective
    5. Style guidance (comic book style, realistic, etc.)
    
    The prompt should be comprehensive but focused on the most important visual elements.
  `;
  
  const visualDescription = await model
    .withStructuredOutput(visualDescriptionSchema, { name: `visual_${scene.sceneNumber}` })
    .invoke(visualPrompt);
  
  return { 
    visualDescription: {
      sceneNumber: visualDescription.sceneNumber,
      visualElements: visualDescription.visualElements,
      imagePrompt: visualDescription.imagePrompt
    }
  };
};

// Critique visuals for a single scene
const critiqueVisual = async (state: typeof SingleSceneVisualProcessingAnnotation.State) => {
  console.log(`Critiquing visual description for scene ${state.scene.sceneNumber}...`);
  
  const critiqueSchema = z.object({
    isApproved: z.boolean().describe("Whether the visual description meets quality standards"),
    feedback: z.string().describe("Constructive feedback for improvement")
  });
  
  const currentRevisionCount = state.visualCritique.revisionCount;
  
  const critiquePrompt = `
    Critique this visual description and image prompt for scene ${state.scene.sceneNumber}:
    
    SCENE TITLE: ${state.scene.title}
    SCENE DESCRIPTION: ${state.scene.description}
    
    VISUAL ELEMENTS: ${state.visualDescription.visualElements}
    IMAGE PROMPT: ${state.visualDescription.imagePrompt}
    
    Evaluate for:
    1. Visual storytelling effectiveness
    2. Clarity and specificity of the image prompt
    3. Alignment with scene description and narrative
    4. Technical quality for AI image generation
    5. Appropriateness of style and composition
    
    ${currentRevisionCount > 0 ? `This is revision attempt #${currentRevisionCount + 1}. Previous feedback was: ${state.visualCritique.feedback}` : ""}
    
    Should this visual description be approved or revised?
    If revisions are needed, provide specific, actionable feedback.
    If this is the second revision attempt, be more lenient and approve unless there are major issues.
  `;
  
  const critique = await model
    .withStructuredOutput(critiqueSchema, { name: `critique_scene_${state.scene.sceneNumber}` })
    .invoke(critiquePrompt);
  
  // Update revision count
  const revisionCount = currentRevisionCount + 1;
  
  // Force approval after revision limit is reached
  const isApproved = revisionCount >= CONFIG.revisionLimit ? true : critique.isApproved;
  
  return { 
    visualCritique: { 
      isApproved, 
      feedback: critique.feedback,
      revisionCount
    } 
  };
};

// Router function for the single scene subgraph
const visualCritiqueRouter = (state: typeof SingleSceneVisualProcessingAnnotation.State) => {
  if (state.visualCritique.isApproved) {
    return "__end__";
  } else if (state.visualCritique.revisionCount < CONFIG.revisionLimit) {
    return "createVisualDescription"; // Go back for revisions
  } else {
    return "__end__";
  }
};

// Create the single scene visual processing subgraph
const singleSceneVisualProcessingSubgraph = new StateGraph(SingleSceneVisualProcessingAnnotation)
  .addNode("createVisualDescription", createVisualDescription)
  .addNode("critiqueVisual", critiqueVisual)
  .addEdge("__start__", "createVisualDescription")
  .addEdge("createVisualDescription", "critiqueVisual")
  .addConditionalEdges(
    "critiqueVisual", 
    visualCritiqueRouter, 
    ["createVisualDescription", "__end__"]
  )
  .compile();

// =============== MAIN COMIC BOOK GENERATION GRAPH ===============

// Define the main graph state schema
const ComicBookStateAnnotation = Annotation.Root({
  // User input
  audience_inputs: Annotation<{ 
    category: string; 
    description: string 
  }[]>({
    default: () => [],
    reducer: (current, update) => update
  }),
  
  // Story plan
  storyPlan: Annotation<{
    title: string;
    premise: string;
    mainCharacters: { name: string; description: string; arc: string }[];
    settings: { name: string; description: string }[];
    narrativeArc: { phase: string; description: string }[];
  }>({
    reducer: (current, update) => update
  }),
  
  // Narrative critique
  narrativeCritique: Annotation<{
    isApproved: boolean;
    feedback: string;
    revisionCount: number;
  }>({
    default: () => ({ isApproved: false, feedback: "", revisionCount: 0 }),
    reducer: (current, update) => update
  }),
  
  // Scene descriptions - collects results from generateSingleScene
  scenes: Annotation<{
    sceneNumber: number;
    title: string;
    description: string;
    characters: string[];
    setting: string;
    narrativePhase: string;
  }[]>({
    default: () => [],
    reducer: (current, update) => current.concat(update)
  }),
  
  // Visual descriptions - collects results from processVisualForScene
  visualDescriptions: Annotation<{
    sceneNumber: number;
    visualElements: string;
    imagePrompt: string;
  }[]>({
    default: () => [],
    reducer: (current, update) => current.concat(update)
  }),
  
  // Final output
  finalOutput: Annotation<{
    title: string;
    premise: string;
    scenes: {
      sceneNumber: number;
      title: string;
      description: string;
      characters: string[];
      setting: string;
      imagePrompt: string;
    }[];
  }>({
    reducer: (current, update) => update
  }),
});

// Initialize AI model
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

// Process audience inputs
const processInputs = async (state: typeof ComicBookStateAnnotation.State) => {
  console.log("Processing audience inputs...");
  
  if (state.audience_inputs && Array.isArray(state.audience_inputs)) {
    return {}; // Input is already in the expected format
  } else if (state.audience_inputs && state.audience_inputs.audience_inputs && 
             Array.isArray(state.audience_inputs.audience_inputs)) {
    // Input is in the format { audience_inputs: [...] }
    return { audience_inputs: state.audience_inputs.audience_inputs };
  }
  
  return {}; // Keep as is if we can't determine the format
};

// Plan the story based on audience inputs
const planStory = async (state: typeof ComicBookStateAnnotation.State) => {
  console.log("Planning story...");
  
  // Get the audience inputs directly from the state
  const inputItems = state.audience_inputs || [];
  
  // Create a mapping function to extract categories
  const getCategoryItems = (category) => {
    return inputItems
      .filter(item => item.category === category)
      .map(item => item.description);
  };
  
  // Extract all categories
  const characters = getCategoryItems('character-description');
  const settings = getCategoryItems('setting-description');
  const plotTwists = getCategoryItems('plot-twist');
  const props = getCategoryItems('significant-prop');
  const backstories = getCategoryItems('character-backstory');
  const atmosphericConditions = getCategoryItems('atmospheric-conditions');
  const specialAbilities = getCategoryItems('special_ability');
  const technologyConcepts = getCategoryItems('technology-concept');

  // const symbolicMotifs = getCategoryItems('special-ability');
  // const culturalElements = getCategoryItems('cultural_element');
  // const conflicts = getCategoryItems('conflict');
  // const themes = getCategoryItems('theme');
  // const relationships = getCategoryItems('character_relationship');
  // const resolutionApproaches = getCategoryItems('resolution_approach');
  
  // Define the story plan schema
  const storyPlanSchema = z.object({
    title: z.string().describe("An engaging title for the comic book"),
    premise: z.string().describe("A concise description of the overall story"),
    mainCharacters: z.array(z.object({
      name: z.string().describe("Character name"),
      description: z.string().describe("Brief character description"),
      arc: z.string().describe("Character's narrative arc")
    })),
    settings: z.array(z.object({
      name: z.string().describe("Setting name"),
      description: z.string().describe("Setting description")
    })),
    narrativeArc: z.array(z.object({
      phase: z.string().describe("Story phase (e.g., introduction, conflict, resolution)"),
      description: z.string().describe("What happens in this phase")
    })).describe(`The story should have exactly ${CONFIG.sceneCount} narrative phases, one for each scene`)
  });
  
  // Create a prompt that includes all categories
  const storyPlanPrompt = `
    Create a comic book SHORT MURDER MYSTERY story plan based on the following audience submissions LEAVE THEM IN SUSPENSE WITH A CLIFFHANGER but don't end it with leaving the audience in suspense or any other obvious indication:
    
    ${characters.length > 0 ? `CHARACTERS:\n${characters.join("\n")}` : ''}
    
    ${settings.length > 0 ? `SETTINGS:\n${settings.join("\n")}` : ''}
    
    ${plotTwists.length > 0 ? `PLOT TWISTS:\n${plotTwists.join("\n")}` : ''}
    
    ${props.length > 0 ? `PROPS:\n${props.join("\n")}` : ''}
    
    ${backstories.length > 0 ? `CHARACTER BACKSTORIES:\n${backstories.join("\n")}` : ''}
    
    ${atmosphericConditions.length > 0 ? `ATMOSPHERIC CONDITIONS:\n${atmosphericConditions.join("\n")}` : ''}
        
    ${specialAbilities.length > 0 ? `SPECIAL ABILITIES:\n${specialAbilities.join("\n")}` : ''}
    
    ${technologyConcepts.length > 0 ? `TECHNOLOGY CONCEPTS:\n${technologyConcepts.join("\n")}` : ''}
    
    IMPORTANT: The comic will have EXACTLY ${CONFIG.sceneCount} scenes each scene can have a max of 200 words, so please create EXACTLY ${CONFIG.sceneCount} narrative phases 
    in your response - no more, no less. Each phase should correspond to one scene in the comic and make sense as the overall part of the short story

    The comic will have ${CONFIG.sceneCount} scenes. Create a complete narrative arc with a clear beginning, middle, and end. 
    Develop memorable characters with clear motivations and arcs as part of the short story.
    The story should incorporate all of the audience elements while remaining coherent as part of the short story.
    Be creative and develop a unique story that seamlessly integrates these diverse elements.
  `;
  
  const storyPlan = await model
    .withStructuredOutput(storyPlanSchema, { name: "story_plan" })
    .invoke(storyPlanPrompt);
    
  // Ensure we have exactly the configured number of scenes
  let narrativeArc = storyPlan.narrativeArc;

  if (narrativeArc.length < CONFIG.sceneCount) {
    console.log(`Warning: Got only ${narrativeArc.length} phases, padding to ${CONFIG.sceneCount}`);
    while (narrativeArc.length < CONFIG.sceneCount) {
      narrativeArc.push({
        phase: `Scene ${narrativeArc.length + 1}`,
        description: `Continuation of the story...`
      });
    }
  } else if (narrativeArc.length > CONFIG.sceneCount) {
    console.log(`Warning: Got ${narrativeArc.length} phases, trimming to ${CONFIG.sceneCount}`);
    narrativeArc = narrativeArc.slice(0, CONFIG.sceneCount);
  }
    
  return { 
    storyPlan: {
      ...storyPlan,
      narrativeArc
    }
  };
};

// Critique the narrative plan
const critiqueNarrative = async (state: typeof ComicBookStateAnnotation.State) => {
  console.log("Critiquing narrative...");
  
  const critiqueSchema = z.object({
    isApproved: z.boolean().describe("Whether the story plan meets quality standards"),
    feedback: z.string().describe("Constructive feedback for improvement")
  });
  
  const currentRevisionCount = state.narrativeCritique.revisionCount;
  
  const critiquePrompt = `
    Critique this comic book story plan:
    
    TITLE: ${state.storyPlan.title}
    PREMISE: ${state.storyPlan.premise}
    CHARACTERS: ${JSON.stringify(state.storyPlan.mainCharacters)}
    SETTINGS: ${JSON.stringify(state.storyPlan.settings)}
    NARRATIVE ARC: ${JSON.stringify(state.storyPlan.narrativeArc)}
    
    Evaluate for:
    1. Character development and consistency
    2. Plot coherence and pacing
    3. Setting utilization
    4. Theme integration
    5. Overall narrative strength
    
    ${currentRevisionCount > 0 ? `This is revision attempt #${currentRevisionCount + 1}. Previous feedback was: ${state.narrativeCritique.feedback}` : ""}
    
    Should this story plan be approved or revised?
    Each scene can have a max of 200 words so ensure that the essence and logical coherence of the story is maintained across scenes
    If revisions are needed, provide specific, actionable feedback.
    If this is the second revision attempt, be more lenient and approve unless there are major issues.
  `;
  
  const critique = await model
    .withStructuredOutput(critiqueSchema, { name: "narrative_critique" })
    .invoke(critiquePrompt);
  
  // Update revision count
  const revisionCount = currentRevisionCount + 1;
  
  // Force approval after two revision cycles
  const isApproved = revisionCount >= CONFIG.revisionLimit ? true : critique.isApproved;
  
  return { 
    narrativeCritique: { 
      isApproved, 
      feedback: critique.feedback,
      revisionCount
    } 
  };
};

// Router function for narrative critique
const narrativeCritiqueRouter = (state: typeof ComicBookStateAnnotation.State) => {
  // Route based on narrative critique approval and revision count
  if (state.narrativeCritique.isApproved) {
    return "sceneGenerationCoordinator"; // Proceed to scene generation
  } else if (state.narrativeCritique.revisionCount < CONFIG.revisionLimit) {
    return "planStory"; // Go back for revisions
  } else {
    // Force progress after revision limit is reached
    return "sceneGenerationCoordinator";
  }
};

// Map function to distribute scene generation tasks
const mapScenesToGenerate = (state: typeof ComicBookStateAnnotation.State) => {
  return state.storyPlan.narrativeArc.map((phase, index) => {
    return new Send("generateSingleScene", {
      sceneNumber: index + 1,
      storyTitle: state.storyPlan.title,
      storyPremise: state.storyPlan.premise,
      narrativePhase: phase,
      mainCharacters: state.storyPlan.mainCharacters,
      settings: state.storyPlan.settings
    });
  });
};

// Single scene generator
const generateSingleScene = async (input: {
  sceneNumber: number;
  storyTitle: string;
  storyPremise: string;
  narrativePhase: { phase: string; description: string };
  mainCharacters: any[];
  settings: any[];
}) => {
  console.log(`Generating scene ${input.sceneNumber}...`);
  
  const sceneSchema = z.object({
    sceneNumber: z.number().describe(`Scene number (1-${CONFIG.sceneCount})`),
    title: z.string().describe("Scene title"),
    description: z.string().describe("Detailed scene description"),
    characters: z.array(z.string()).describe("Characters present in the scene"),
    setting: z.string().describe("Setting of the scene"),
    narrativePhase: z.string().describe("Phase in the narrative arc")
  });
  
  const scenePrompt = `
    Create scene ${input.sceneNumber} of a ${CONFIG.sceneCount}-scene comic book based on this SHORT story plan:
    
    TITLE: ${input.storyTitle}
    PREMISE: ${input.storyPremise}
    
    NARRATIVE PHASE FOR THIS SCENE:
    ${input.narrativePhase.phase}: ${input.narrativePhase.description}
    
    AVAILABLE CHARACTERS:
    ${JSON.stringify(input.mainCharacters)}
    
    AVAILABLE SETTINGS:
    ${JSON.stringify(input.settings)}
    
    Create a detailed scene description that advances the narrative according to this phase. Each scene description can only have can have a maximum of 200 words
    Include specific characters, actions, dialogue, and setting details.
    This scene should fit within the overall narrative of the short story structure while being visually interesting. If the scence is the last scence of ${input.sceneNumber} of a ${CONFIG.sceneCount} LEAVE THEM IN SUSPENSE WITH A CLIFFHANGER but don't do so with any obvious indication
  `;
  
  const scene = await model
    .withStructuredOutput(sceneSchema, { name: `scene_${input.sceneNumber}` })
    .invoke(scenePrompt);
  
  // Return a single scene
  return { scenes: [scene] };
};

// Map function to distribute visual processing tasks
const mapScenesToVisualProcessing = (state: typeof ComicBookStateAnnotation.State) => {
  return state.scenes.map(scene => {
    return new Send("processVisualForScene", { scene });
  });
};

// Process visuals for a single scene using the subgraph
const processVisualForScene = async (input: { scene: any }) => {
  console.log(`Processing visuals for scene ${input.scene.sceneNumber} using subgraph...`);
  
  // Invoke the single scene visual processing subgraph
  const result = await singleSceneVisualProcessingSubgraph.invoke({
    scene: input.scene
  });
  
  // Return the visual description to be collected in the main graph's state
  return { 
    visualDescriptions: [result.visualDescription]
  };
};

// Format the final output
const formatOutput = async (state: typeof ComicBookStateAnnotation.State) => {
  console.log("Formatting final output...");
  
  // Combine scene descriptions with their visual prompts
  const finalScenes = state.scenes.map(scene => {
    const visualDescription = state.visualDescriptions.find(
      vd => vd.sceneNumber === scene.sceneNumber
    );
    
    return {
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      description: scene.description,
      characters: scene.characters,
      setting: scene.setting,
      imagePrompt: visualDescription ? visualDescription.imagePrompt : ""
    };
  });
  
  // Sort scenes by number
  finalScenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
  
  return {
    finalOutput: {
      title: state.storyPlan.title,
      premise: state.storyPlan.premise,
      scenes: finalScenes
    }
  };
};

// Create the main graph
export const comicBookGraph = new StateGraph(ComicBookStateAnnotation)
  .addNode("processInputs", processInputs)
  .addNode("planStory", planStory)
  .addNode("critiqueNarrative", critiqueNarrative)
  .addNode("sceneGenerationCoordinator", async (state) => ({})) // Empty coordination node
  .addNode("generateSingleScene", generateSingleScene)
  .addNode("visualProcessingCoordinator", async (state) => ({})) // Empty coordination node
  .addNode("processVisualForScene", processVisualForScene)
  .addNode("formatOutput", formatOutput)
  
  // Define the connections
  .addEdge("__start__", "processInputs")
  .addEdge("processInputs", "planStory")
  .addEdge("planStory", "critiqueNarrative")
  
  // Conditional edge for narrative critique
  .addConditionalEdges(
    "critiqueNarrative", 
    narrativeCritiqueRouter, 
    ["planStory", "sceneGenerationCoordinator"]
  )
  
  // Map to generate scenes in parallel
  .addEdge("sceneGenerationCoordinator", "visualProcessingCoordinator")
  .addConditionalEdges(
    "sceneGenerationCoordinator",
    mapScenesToGenerate,
    ["generateSingleScene"]
  )
  
  // Map to process visuals in parallel
  .addEdge("generateSingleScene", "visualProcessingCoordinator")
  .addConditionalEdges(
    "visualProcessingCoordinator",
    mapScenesToVisualProcessing,
    ["processVisualForScene"]
  )
  
  // Format final output
  .addEdge("processVisualForScene", "formatOutput")
  .addEdge("formatOutput", "__end__")
  .compile();

// Compile the graph
