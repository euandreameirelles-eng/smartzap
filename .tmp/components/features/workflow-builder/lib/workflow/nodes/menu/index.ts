import { menuClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/menu/menu.client";
import { menuServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/menu/menu.server";
import {
	type MenuNode,
	menuSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/menu/menu.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const menuNodeDefinition = {
	shared: menuSharedDefinition,
	client: menuClientDefinition,
	server: menuServerDefinition,
} as NodeDefinition<MenuNode>;
