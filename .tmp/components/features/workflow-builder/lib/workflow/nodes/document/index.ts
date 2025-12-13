import { documentClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/document/document.client";
import { documentServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/document/document.server";
import {
	type DocumentNode,
	documentSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/document/document.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const documentNodeDefinition = {
	shared: documentSharedDefinition,
	client: documentClientDefinition,
	server: documentServerDefinition,
} as NodeDefinition<DocumentNode>;
