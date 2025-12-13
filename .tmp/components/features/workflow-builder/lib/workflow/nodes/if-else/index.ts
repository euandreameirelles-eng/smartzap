import { ifElseClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/if-else/if-else.client";
import { ifElseServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/if-else/if-else.server";
import {
	type IfElseNode,
	ifElseSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/if-else/if-else.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const ifElseNodeDefinition: NodeDefinition<IfElseNode> = {
	shared: ifElseSharedDefinition,
	client: ifElseClientDefinition,
	server: ifElseServerDefinition,
};
