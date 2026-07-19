# Project Self-Consistency

A Node.js command-line interface (CLI) application demonstrating self-consistency and consensus among Large Language Models (LLMs).

## What it does (in `index.js`)
The `index.js` script implements an advanced AI querying mechanism that leverages multiple LLMs to arrive at the best possible answer. Instead of relying on just one model, it queries several models in parallel and then uses an "expert evaluator" model to synthesize the final, most accurate response.

Key features in `index.js`:
- Interactive CLI prompt for user questions.
- Parallel asynchronous requests to different AI models (`openai/gpt-4o-mini-2024-07-18`, `google/gemini-2.5-flash-lite`, `anthropic/claude-sonnet-4.6` and a free openrouter model).
- A Chain-of-Thought (CoT) system prompt that forces a final evaluator model to compare the initial outputs and combine their strongest parts.
- Rich terminal output using styled Markdown.

## How it works

1. **User Input:** The CLI prompts you to enter a question.
2. **Parallel Processing:** A loading spinner appears while the script simultaneously sends your question to three different LLMs via OpenRouter.
3. **Response Collection:** The script waits for all three models to return their individual responses.
4. **Evaluation & Synthesis:** It takes all three responses and feeds them into a final evaluator LLM with strict instructions. This evaluator analyzes the responses for accuracy, logic, and factual correctness step-by-step.
5. **Final Output:** The evaluator generates a single, highly accurate response, explaining which parts it took from which model and why.
6. **Terminal Rendering:** This final synthesized answer is parsed as Markdown and rendered beautifully in your terminal with syntax highlighting and colors.

## Packages Used

This project relies on several modern NPM packages to create a smooth CLI experience:

* **[`@openrouter/sdk`](https://www.npmjs.com/package/@openrouter/sdk)**: The official SDK for interacting with the OpenRouter API.
* **[`dotenv`](https://www.npmjs.com/package/dotenv)**: Loads environment variables (like your `API_KEY`) from a `.env` file into `process.env`.
* **[`@inquirer/prompts`](https://www.npmjs.com/package/@inquirer/prompts)**: Provides the interactive, user-friendly prompt in the terminal to capture your questions.
* **[`ora`](https://www.npmjs.com/package/ora)**: Displays elegant terminal spinners while waiting for the LLM API responses.
* **[`chalk`](https://www.npmjs.com/package/chalk)**: Used for styling terminal string outputs with colors and text formatting (bold, italic, etc.).
* **[`marked`](https://www.npmjs.com/package/marked)**: A fast markdown parser.
* **[`marked-terminal`](https://www.npmjs.com/package/marked-terminal)**: A custom renderer for `marked` that translates markdown formatting into terminal-friendly ANSI escape codes (using chalk).

## About OpenRouter

[OpenRouter](https://openrouter.ai/) is a unified API routing service that provides standard access to dozens of different AI models (including those from OpenAI, Google, Anthropic, Meta, and open-source models).

By using OpenRouter in this project:
- We only need a **single API key** to access multiple different LLMs.
- We can easily swap models in and out by just changing a model string identifier (e.g., `"google/gemini-2.5-flash-lite"` or `"openai/gpt-4o-mini-2024-07-18"`, `"anthropic/claude-sonnet-4.6"`).
- We utilize standard OpenAI-compatible SDKs (like `@openrouter/sdk`) to manage the underlying API calls.

## Reason For Using OpenRouter
The instructor suggested using different SDKs, but when I tried to buy credits for OpenAI and Claude, my transactions failed. To continue with the project, I looked for an alternative solution and came across OpenRouter. I was able to successfully add credits to OpenRouter, which is why I chose to use it instead of three different SDKs.

## Getting Started

1. Ensure you have your environment variables set up (create a `.env` file and add `API_KEY=your_openrouter_api_key_here`).
2. Install the dependencies by running:
   ```bash
   npm install
   ```
3. Run the CLI:
   ```bash
   node index.js
   ```
