import "dotenv/config";
import { input } from "@inquirer/prompts";
import ora from "ora";
import chalk from "chalk";
import { OpenRouter } from "@openrouter/sdk";

const client = new OpenRouter({
  apiKey: process.env.API_KEY,
});

const llm = async ({
  model = "openai/gpt-4o-mini",
  question,
  system_prompt,
}) => {
  const response = await client.chat.send({
    chatRequest: {
      model,
      messages: system_prompt
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
          ],
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
      // API call to LLM
      const response = await llm({ question });

      const finalResponse = response.choices[0].message.content;

      // Green success message
      spinner.succeed(chalk.green("Answer generated successfully:\n"));

      process.stdout.write(finalResponse);
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
