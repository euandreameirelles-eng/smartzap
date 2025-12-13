import { videoClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/video/video.client";
import { videoServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/video/video.server";
import {
	type VideoNode,
	videoSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/video/video.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const videoNodeDefinition = {
	shared: videoSharedDefinition,
	client: videoClientDefinition,
	server: videoServerDefinition,
} as NodeDefinition<VideoNode>;
