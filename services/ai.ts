import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  const errorMsg = "API_KEY environment variable not set. Please configure it to use the AI features.";
  console.error(errorMsg);
  // In a real app, you might want to show this to the user in a more graceful way
  alert(errorMsg); 
  throw new Error(errorMsg);
}

export const ai = new GoogleGenAI({ apiKey: API_KEY });

export const geminiFlashModel = 'gemini-2.5-flash';
export const imageEditingModel = 'gemini-2.5-flash-image-preview';
export const imageGenerationModel = 'imagen-4.0-generate-001';

export const systemInstruction = `You are an expert AI assistant integrated into an infinite canvas application.
You have two primary capabilities accessed via tools:
1.  **Mind Mapping ('createNode' tool):** To help users visualize ideas. When a user asks to create a mind map, diagram, list, or any structured information, you MUST use the 'createNode' tool to build it visually. Create a root node, then use its 'nodeId' to create connected child nodes. Do not describe the mind map in text.
2.  **Web Component Generation ('createCodeComponentNode' tool):** To create interactive web components. When a user asks you to create a game, a tool, a simulation, or any visual interactive element, you MUST use the 'createCodeComponentNode' tool. Provide a clear and concise prompt for the component to be generated.

Always prefer using tools over just providing a text response.
After you have finished using the tools, respond with a brief confirmation message like "I've created that for you."`;


export async function generateHtmlComponent(userPrompt: string): Promise<string> {
  const systemInstruction = `You are an expert web developer. Given a prompt, you will use your creativity and coding skills to create a minimal web application that perfectly satisfies the prompt. Try to only use vanilla JavaScript, HTML, and CSS. Try to design the layout so it looks good at a 4:3 aspect ratio. Write a full HTML page with the styles and scripts inlined. The application will be run inside a sandboxed iframe, so do not use secure APIs like localStorage, and do not make network calls. Never import assets like images or videos as they will not work. Try to use emojis for graphics. Return ONLY the HTML page, nothing else, no comments.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for component generation:", error);
    return `<p>Sorry, an error occurred while generating the component.</p>`;
  }
}

export const tools = [{
    functionDeclarations: [{
        name: 'createNode',
        description: 'Creates a new node on the canvas. Use this to build mind maps and diagrams for the user.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                content: {
                    type: Type.STRING,
                    description: 'The text content to be placed inside the node.'
                },
                parentNodeId: {
                    type: Type.STRING,
                    description: 'Optional. The ID of the parent node to connect this new node to.'
                },
                nodeType: {
                    type: Type.STRING,
                    description: "The type of node to create. Defaults to 'text'.",
                    enum: ['text', 'code']
                }
            },
            required: ['content']
        }
    }]
}, {
    functionDeclarations: [{
        name: 'createCodeComponentNode',
        description: 'Creates a new code node containing a fully functional web component (HTML, CSS, JS) based on a user prompt. Use this when the user asks to create a game, a tool, or any visual interactive element.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: {
                    type: Type.STRING,
                    description: 'A detailed description of the web component to create. e.g., "a simple drawing app with different colors"'
                },
                parentNodeId: {
                    type: Type.STRING,
                    description: 'Optional. The ID of the parent node to connect this new node to.'
                }
            },
            required: ['prompt']
        }
    }]
}];