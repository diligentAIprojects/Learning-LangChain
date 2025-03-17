# Comic Book Murder Mystery Generator

This LangChain project demonstrates how to build an AI agent that generates comic book murder mystery stories based on audience inputs. It's designed as a learning tool for understanding LangChain's StateGraph and building interactive AI workflows.

## Getting Started

Follow these steps to set up and run the project:

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the LangGraph development server**:

   ```bash
   npx @langchain/langgraph-cli dev
   ```

3. **Test your agent**:
   - Once the server is running, you can interact with your agent through the provided UI
   - Use the example inputs in the JSON format (see below)

## How It Works

This agent uses a LangChain StateGraph to:

1. **Process Inputs**: Parse audience submissions for characters, settings, plot elements, etc.
2. **Plan Story**: Generate a coherent murder mystery narrative structure
3. **Create Scenes**: Develop detailed scene descriptions with visual prompts
4. **Format Output**: Organize everything into a structured comic book format

## Input Format

Use this JSON format to provide input to the agent:

```json
{
  "audience_inputs": [
    {
      "category": "character",
      "description": "A retired astronaut in her 70s who still wears parts of her space suit as everyday clothing."
    },
    {
      "category": "setting",
      "description": "A sprawling city built vertically on massive redwood trees."
    },
    {
      "category": "plot_twist",
      "description": "The hero's loyal companion animal was actually the main villain all along."
    }
  ]
}
```

### Available Input Categories

You can submit items in any of these categories:

- **character**: Main characters with appearance, personality, and quirks
- **setting**: Locations where scenes take place
- **plot_twist**: Unexpected turns of events
- **significant_prop**: Important objects that drive the plot
- **character_backstory**: Past events explaining motivations
- **atmospheric_conditions**: Weather or mood-setting elements
- **symbolic_motif**: Recurring symbols that reinforce themes
- **special_ability**: Unique powers or skills
- **cultural_element**: Traditions or beliefs that shape the world
- **technology_concept**: Fictional devices or inventions
- **conflict**: Central tensions or problems
- **theme**: Underlying messages or ideas
- **character_relationship**: Connections between characters

## Workshop Exercises

This project includes three progressive workshop exercises that build your LangChain skills. For each exercise, you'll find a TODO comment in the code with clear instructions and a skeleton to help you get started.

### Exercise 1: Change the Model Provider (EASY)

Switch from OpenAI to Claude, Mistral, or Groq:

- Import the appropriate model class (ChatAnthropic, ChatMistral, etc.)
- Update the model configuration with the provider's specific parameters
- Experiment with different models to compare output quality

This exercise teaches you about model selection and configuration in LangChain.

### Exercise 2: Add a Scene Critique Function (MEDIUM)

Implement a critique function that evaluates and improves the generated scenes:

- Create a schema for structured critique feedback
- Design a prompt that asks the model to analyze scene quality
- Generate improvements based on the critique
- Integrate this function into the graph workflow

This exercise teaches you about chain-of-thought reasoning and self-improvement in AI workflows.

### Exercise 3: Enhanced Visual Description Generator (ADVANCED)

Create a specialized function for generating more detailed and artistic image prompts:

- Design a structured schema for visual elements (style, color, composition)
- Develop a prompt that guides the model to analyze scenes visually
- Generate enhanced image prompts that would work better for image generation
- Integrate this function into the main workflow

This exercise teaches you about specialized AI tasks and advanced prompt engineering for visual content.

### How to Approach the Exercises

For each exercise:

1. **Locate the TODO comment** in the code that corresponds to the exercise
2. **Read the instructions** carefully - they explain what you need to implement
3. **Use the provided function skeleton** as a starting point - it contains comments showing what you need to fill in
4. **Complete the implementation** according to the instructions
5. **Integrate your new function** into the graph by adding the appropriate edges

The code contains skeleton implementations with missing parts for you to fill in, not complete solutions. This approach gives you structure while still requiring you to think through the implementation details.

## Example Output

The agent will generate a structured output with:

- A story title and premise
- Detailed scenes with descriptions and image prompts
- Character and setting information

## Troubleshooting

- **Model errors**: Check that you're using a valid model in the configuration
- **Prompt issues**: Examine the console logs for detailed error messages
- **LangGraph server**: Make sure you're running the latest version of LangGraph CLI

## Next Steps

After completing the workshop exercises, consider:

- Adding a user interface to collect inputs
- Implementing image generation with the prompts
- Creating a feedback loop for iterative improvement
- Expanding to other story genres beyond murder mystery
