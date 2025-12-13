/**
 * Template Node - WhatsApp Message Templates
 * 
 * Barrel export para o nó de template
 */

import { templateClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/template/template.client";
import { templateServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/template/template.server";
import {
	type TemplateNode,
	templateSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/template/template.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export * from "./template.shared";
export * from "./template.client";
export * from "./template.server";

export const templateNodeDefinition = {
	shared: templateSharedDefinition,
	client: templateClientDefinition,
	server: templateServerDefinition,
} as NodeDefinition<TemplateNode>;
