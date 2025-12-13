import { google } from "@ai-sdk/google";
import { customProvider } from "ai";

const languageModels = {
	"gemini-2.0-flash": google("gemini-2.0-flash"),
	"gemini-2.5-flash": google("gemini-2.5-flash-preview-05-20"),
	"gemini-2.5-pro": google("gemini-2.5-pro-preview-05-06"),
};

export const workflowModel = customProvider({ languageModels });

export const WORKFLOW_MODELS = Object.keys(languageModels) as workflowModelID[];

export type workflowModelID = keyof typeof languageModels;
