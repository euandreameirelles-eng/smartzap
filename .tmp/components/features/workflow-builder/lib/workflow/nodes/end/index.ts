import { endClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/end/end.client";
import { endServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/end/end.server";
import {
	type EndNode,
	endSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/end/end.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const endNodeDefinition: NodeDefinition<EndNode> = {
	shared: endSharedDefinition,
	client: endClientDefinition,
	server: endServerDefinition,
};
