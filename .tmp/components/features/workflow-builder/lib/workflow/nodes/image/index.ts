import { imageClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/image/image.client";
import { imageServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/image/image.server";
import {
	type ImageNode,
	imageSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/image/image.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const imageNodeDefinition = {
	shared: imageSharedDefinition,
	client: imageClientDefinition,
	server: imageServerDefinition,
} as NodeDefinition<ImageNode>;
