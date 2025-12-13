import { agentClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/agent/agent.client";
import { agentServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/agent/agent.server";
import {
	type AgentNode,
	agentSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/agent/agent.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const agentNodeDefinition: NodeDefinition<AgentNode> = {
	shared: agentSharedDefinition,
	client: agentClientDefinition,
	server: agentServerDefinition,
};
