import { stickerClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/sticker/sticker.client";
import { stickerServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/sticker/sticker.server";
import {
	type StickerNode,
	stickerSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/sticker/sticker.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const stickerNodeDefinition = {
	shared: stickerSharedDefinition,
	client: stickerClientDefinition,
	server: stickerServerDefinition,
} as NodeDefinition<StickerNode>;
