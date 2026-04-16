# 🛠️ toolpick - See Only the Right Tools

[![Download toolpick](https://img.shields.io/badge/Download-Toolpick-purple?style=for-the-badge)](https://github.com/kosa6053/toolpick/releases)

## 🚀 What toolpick does

toolpick helps apps work with large sets of tools without showing all of them to the model at once.

If your app gives the model many tools, each step can get crowded. toolpick trims that list down. It picks the most useful tools for the current step and keeps the rest ready in the background.

This helps when you want:

- Less tool clutter
- Faster steps
- Better tool choice
- Lower token use
- Cleaner model input

toolpick fits into apps that use AI tools and step-based output. It works with common AI flows and keeps tool access open for execution.

## 📥 Download toolpick

Go to the release page here:

https://github.com/kosa6053/toolpick/releases

From there, download the latest Windows release file and run it on your PC.

## 🖥️ What you need

toolpick is made for modern Windows systems.

Use:

- Windows 10 or Windows 11
- An internet connection for the first download
- Enough free space for the app and its files
- A current browser or package tool if you are setting it up for development use

If you plan to use it in a development project, you will also need:

- Node.js
- npm

## ⚙️ How toolpick works

toolpick looks at your full set of tools and sorts them by fit for the current step.

Instead of sending every tool to the model, it gives the model only the most useful ones. The rest stay available if the app needs them later.

That means:

- The model sees a smaller tool list
- The step stays focused
- The app can still use all tools
- You keep control of the full tool set

## 🛠️ Setup

If you are using toolpick in a project, install it with npm:

```bash
npm install toolpick
```

If you are using the Windows release from GitHub, open the downloaded file from the release page and follow the normal Windows prompts.

## ▶️ Run it on Windows

1. Open your browser.
2. Go to the release page:
   https://github.com/kosa6053/toolpick/releases
3. Download the latest Windows file from the release list.
4. Open the file after it finishes downloading.
5. Follow the setup steps shown on screen.
6. Launch toolpick from the installed app or the file you downloaded.

If Windows shows a security prompt, choose the option that lets you continue only if the file came from the official release page.

## 🧭 Using toolpick in a project

toolpick is built for apps that use AI tools. A typical setup looks like this:

- You list all the tools your app can use
- You create a tool index
- You let toolpick choose the best tools for each step
- Your model uses the smaller tool list
- Your app still keeps access to every tool

Example:

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createToolIndex } from "toolpick";

const index = createToolIndex(allTools, {
  embeddingModel: openai.embeddingModel("text-embedding-3-small"),
});

const result = await generateText({
  model: openai("gpt-4o"),
  tools: allTools,
  prepareStep: index.prepareStep(),
  prompt: "ship it to prod",
});
```

## 🔍 What happens during each step

Each time the model takes a step, toolpick checks the current request and the tool set.

Then it:

- Compares the request with the tools
- Picks the best matches
- Sets `activeTools`
- Leaves the rest out of view for that step

This makes the prompt smaller and easier for the model to handle.

## 🧩 Where it fits

toolpick works well in apps that use:

- Chat flows
- Task agents
- Tool-heavy assistants
- Multi-step AI workflows
- Apps with many actions or services

It works with:

- `generateText`
- `streamText`
- `Experimental_Agent`

## 📁 Example use case

Imagine your app has 30 tools:

- One for email
- One for calendar
- One for files
- One for search
- One for reports
- Many more for internal tasks

Without toolpick, the model sees all 30 tools every time.

With toolpick, it sees only the 5 that matter for the current step.

That keeps the model focused on the task in front of it.

## 🔧 Basic flow

1. Add your tools to the app.
2. Create a tool index with toolpick.
3. Connect the index to your step handler.
4. Run your AI flow.
5. Let toolpick choose the right tools for each step.

## 🪟 Windows install steps

If you want the easiest path on Windows:

1. Open this page:
   https://github.com/kosa6053/toolpick/releases
2. Find the newest release.
3. Download the Windows file for your system.
4. Save it to your Downloads folder.
5. Double-click the file.
6. Follow the install prompts.
7. Open toolpick after setup finishes.

If the release comes as a zipped file, open the zip first, then run the app file inside.

## 🧪 Troubleshooting

If the app does not open:

- Check that the download finished
- Try running it again
- Make sure Windows did not block the file
- Confirm you downloaded the latest release

If a project setup does not work:

- Check that Node.js is installed
- Run `npm install` again
- Make sure your tool list is valid
- Confirm your embedding model is set

If the model still sees too many tools:

- Check that `prepareStep` is attached
- Confirm the tool index is created from the full tool list
- Make sure the step handler runs before the model call

## 🔐 Safety and file checks

Before you open the download:

- Make sure the link matches the release page
- Keep the file in a safe folder
- Use the newest release file
- Remove old copies if you no longer need them

## 📚 Quick start for developers

```bash
npm install toolpick
```

```ts
import { createToolIndex } from "toolpick";
```

```ts
const index = createToolIndex(allTools, {
  embeddingModel: openai.embeddingModel("text-embedding-3-small"),
});
```

```ts
prepareStep: index.prepareStep(),
```

## 📌 What you get

- Smaller tool sets per step
- Less noise in model input
- Better tool matching
- Full tool access when needed
- Support for common AI workflows

## 📎 Download again

https://github.com/kosa6053/toolpick/releases