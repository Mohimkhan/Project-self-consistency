import "dotenv/config";
import { input } from "@inquirer/prompts";
import ora from "ora";
import chalk from "chalk";
import { OpenRouter } from "@openrouter/sdk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

// Configure marked to use the terminal renderer
marked.setOptions({
  renderer: new TerminalRenderer({
    heading: chalk.cyan.bold,
    strong: chalk.bold.yellow,
    em: chalk.italic,
    blockquote: chalk.gray.italic,
    listitem: chalk.white,
    firstHeading: chalk.whiteBright.bold,
    list: chalk.yellow,
    link: chalk.blue.bold,
  }),
});

const client = new OpenRouter({
  apiKey: process.env.API_KEY,
});

const formatMarkdownTerminal = (text) => {
  if (!text) return "";
  return marked.parse(text.replace(/#+/g, "") + "\n");
};

const generatingSystemPrompt = ({ question = "", responses = [] }) => {
  return `
    
  You're an EXPERT EVALUATOR. You analyze responses based on similarity, logic, relevancy, facts, accuracy and etc  step-by-step using a Chain-of-Thought approach from multiple models like Gemini, Claude & Openai and provide the best and most accurate response.

    -- Rules: 
     - Don't add AI generated text before or after response, or in between response or any extra response
     - Give the single best and most accurate response based on the user question and responses from multiple model
     - Analyze question and user prompt very carefully, I mean each and every line.
     - Don't copy from different response, rather than that provide the most accurate response by analyzing all the responses
     - Compare the outputs, identify the strongest parts, and generate the best possible accurate & structured final response
     - You must After your final response explain what part you take from which exact model (From below Response From Models List) and why their output was bad or good
     - Output format MUST strictly follow the valid Markdown structure provided in the Output Example below. Do NOT use custom tags like [Q] or [A]: as structural elements. Use real markdown syntax (#, ###, *, ---).
     - If you haven't got any model response, just write no model response are given

    -- Output Example (Follow this exactly using Markdown): 
    # Question: <User Question>
    
    ### Answer
    <Output of Answer goes here, which is the Final Most Accurate Response. Use markdown lists (* item) or bolding (**text**) for structural visibility.>
    
    ---
    
    ### Model Comparison & Synthesis
    **<Model Name 1>**: <explanation of what part you take from which exact model and why their output was bad or good>
    **<Model Name 2>**: <explanation of what part you take from which exact model and why their output was bad or good>

    -- User Query: 
     - ${question}
    
    -- Responses From Models:

    ${responses
      .map((res) => {
        return `[${res?.model ?? ""}]: ${res?.output ?? ""}`;
      })
      .join("\n")}
    `;
};

const llm = async ({
  model = "openai/gpt-4o-mini",
  question,
  system_prompt,
}) => {
  const messages = system_prompt
    ? [
        {
          role: "system",
          content: system_prompt,
        },
      ]
    : [
        {
          role: "assistant",
          content: "I will help you with whatever question you have",
        },
        {
          role: "user",
          content: question,
        },
      ];

  const response = await client.chat.send({
    chatRequest: {
      model,
      messages: messages,
      temperature: 0.7,
    },
  });

  return response;
};

async function runCLI() {
  console.log(
    chalk.gray.bold(
      "=========================================================",
    ),
  );
  console.log(
    chalk.cyan.bold("  === Welcome to the Project-Self-Consistency Demo ===  "),
  );
  console.log(
    chalk.gray.bold(
      "=========================================================",
    ),
  );

  // Take user prompt
  const question = await input({
    message: chalk.bold("What's your question, Ask Below\n=>"),
    required: true,
    transformer: (value) => ` ${value}`,
  });

  if (question) {
    console.log();
    const spinner = ora("Generating your answer...").start();

    try {
      // API calls to LLM
      const promises = [
        llm({ model: "openai/gpt-4o-mini-2024-07-18", question }),
        llm({
          model: "google/gemini-2.5-flash-lite",
          question,
        }),
        llm({ model: "openrouter/free", question }),
      ];
      const responses = [];

      const results = await Promise.allSettled(promises);

      results.forEach((res) => {
        if (res.status === "fulfilled") {
          const model = res?.value?.model ?? "";
          const output = res?.value?.choices[0]?.message?.content ?? "";

          responses.push({ model, output });
        }
      });

      const finalResponse = await llm({
        model: "anthropic/claude-sonnet-4.6",
        question,
        system_prompt: generatingSystemPrompt({ question, responses }),
      });

      // Green success message
      spinner.succeed(chalk.green.bold("Answer generated successfully:\n"));

      process.stdout.write(
        formatMarkdownTerminal(finalResponse.choices[0].message.content),
      );
      console.log(chalk.gray("\n======================================="));
    } catch (apiError) {
      spinner.fail(chalk.red("Failed to generate an answer."));
      console.error(apiError);
    }
  } else {
    console.log(chalk.dim("\nGoodbye! Come back when you are ready."));
  }
}

runCLI().catch((error) => {
  if (error.name === "ExitPromptError") {
    console.log(chalk.yellow("\n\n👋 Prompt canceled by user (Ctrl+C)."));
  } else {
    console.error("An unexpected error occurred:", error);
  }
});
