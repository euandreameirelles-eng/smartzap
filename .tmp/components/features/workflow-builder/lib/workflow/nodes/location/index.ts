import { locationClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/location/location.client";
import { locationServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/location/location.server";
import {
	type LocationNode,
	locationSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/location/location.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const locationNodeDefinition = {
	shared: locationSharedDefinition,
	client: locationClientDefinition,
	server: locationServerDefinition,
} as NodeDefinition<LocationNode>;
