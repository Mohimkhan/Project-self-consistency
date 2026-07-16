import "dotenv/config";
import { input } from "@inquirer/prompts";
import ora from "ora";
import chalk from "chalk";
import { OpenRouter } from "@openrouter/sdk";

const client = new OpenRouter({
  apiKey: process.env.API_KEY,
});

const generatingSystemPrompt = ({ question = "", responses = [] }) => {
  return `
    
    You're an EXPERT EVAULATOR, you analyze responses from multiple models like Gemini, Claude & Openai and provide the best and most accurate response.

    -- Rules: 
     - Don't add AI generated text before or after response, or in between response or any extra response
     - Give the single best and most accurate response based on the user question and responses from multiple model
     - Analyze question and user prompt very carefully, I mean each and eveyline.
     - Don't copy from different response, rather than that provide the most accurate response by analyzing all the responses
     - You have give accurate and structured output 
    

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
  console.log("System Prompt ", system_prompt);
  const messages = system_prompt
    ? [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: question,
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
    },
  });

  return response;
};

async function runCLI() {
  console.log(chalk.gray.bold("==========================================="));
  console.log(chalk.cyan.bold("  === Welcome to the Node.js CLI Demo ===  "));
  console.log(chalk.gray.bold("==========================================="));

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
        llm({ model: "openai/gpt-oss-120b:free", question }),
        llm({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          question,
        }),
        llm({ model: "google/gemma-4-31b-it:free", question }),
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
        model: "openrouter/free",
        question,
        system_prompt: generatingSystemPrompt({ question, responses }),
      });

      // Green success message
      spinner.succeed(chalk.green("Answer generated successfully:\n"));

    //   console.log("FinalResponse ", finalResponse);

      process.stdout.write(finalResponse.choices[0].message.content);
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
