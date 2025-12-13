import { audioClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/audio/audio.client";
import { audioServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/audio/audio.server";
import {
	type AudioNode,
	audioSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/audio/audio.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const audioNodeDefinition = {
	shared: audioSharedDefinition,
	client: audioClientDefinition,
	server: audioServerDefinition,
} as NodeDefinition<AudioNode>;
