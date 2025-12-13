import { inputClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/input/input.client";
import { inputServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/input/input.server";
import {
	type InputNode,
	inputSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/input/input.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const inputNodeDefinition = {
	shared: inputSharedDefinition,
	client: inputClientDefinition,
	server: inputServerDefinition,
} as NodeDefinition<InputNode>;
