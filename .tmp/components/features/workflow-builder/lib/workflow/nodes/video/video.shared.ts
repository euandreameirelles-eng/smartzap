import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const videoNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	videoUrl: z.string().optional(),
	// Caption - max 1024 chars (WhatsApp limit for media captions)
	caption: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type VideoNodeData = z.infer<typeof videoNodeDataSchema>;
export type VideoNode = Node<VideoNodeData, "video">;

function validateVideoNode(
	node: VideoNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de vídeo não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.videoUrl?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "URL do vídeo é obrigatória",
			node: { id: node.id },
		});
	}

	// Caption max 1024 chars
	if (node.data.caption && node.data.caption.length > 1024) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Legenda excede 1024 caracteres",
			node: { id: node.id },
		});
	}

	return errors;
}

export const videoSharedDefinition: NodeSharedDefinition<VideoNode> = {
	type: "video",
	dataSchema: videoNodeDataSchema,
	validate: validateVideoNode,
};
