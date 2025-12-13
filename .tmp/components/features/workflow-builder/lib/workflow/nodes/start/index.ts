import { startClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/start/start.client";
import { startServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/start/start.server";
import {
	type StartNode,
	startSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/start/start.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const startNodeDefinition: NodeDefinition<StartNode> = {
	shared: startSharedDefinition,
	client: startClientDefinition,
	server: startServerDefinition,
};
