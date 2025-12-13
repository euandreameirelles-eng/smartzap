import { delayClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/delay/delay.client";
import { delayServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/delay/delay.server";
import {
	type DelayNode,
	delaySharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/delay/delay.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const delayNodeDefinition = {
	shared: delaySharedDefinition,
	client: delayClientDefinition,
	server: delayServerDefinition,
} as NodeDefinition<DelayNode>;
