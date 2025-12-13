/**
 * Buttons Node - WhatsApp Reply Buttons
 */

import { buttonsClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/buttons/buttons.client";
import { buttonsServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/buttons/buttons.server";
import {
	type ButtonsNode,
	buttonsSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/buttons/buttons.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export * from "./buttons.shared";
export * from "./buttons.client";
export * from "./buttons.server";

export const buttonsNodeDefinition = {
	shared: buttonsSharedDefinition,
	client: buttonsClientDefinition,
	server: buttonsServerDefinition,
} as NodeDefinition<ButtonsNode>;
