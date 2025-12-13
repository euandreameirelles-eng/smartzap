import { waitClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/wait/wait.client";
import { waitServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/wait/wait.server";
import {
	type WaitNode,
	waitSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/wait/wait.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const waitNodeDefinition: NodeDefinition<WaitNode> = {
	shared: waitSharedDefinition,
	client: waitClientDefinition,
	server: waitServerDefinition,
};
