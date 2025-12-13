/**
 * List Node - WhatsApp List Message
 */

import { listClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/list/list.client";
import { listServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/list/list.server";
import {
	type ListNode,
	listSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/list/list.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export * from "./list.shared";
export * from "./list.client";
export * from "./list.server";

export const listNodeDefinition = {
	shared: listSharedDefinition,
	client: listClientDefinition,
	server: listServerDefinition,
} as NodeDefinition<ListNode>;
