import { messageClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/message/message.client";
import { messageServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/message/message.server";
import {
	type MessageNode,
	messageSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/message/message.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const messageNodeDefinition = {
	shared: messageSharedDefinition,
	client: messageClientDefinition,
	server: messageServerDefinition,
} as NodeDefinition<MessageNode>;
