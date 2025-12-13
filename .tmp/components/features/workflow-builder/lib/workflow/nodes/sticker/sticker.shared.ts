import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const stickerNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	stickerUrl: z.string().optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type StickerNodeData = z.infer<typeof stickerNodeDataSchema>;
export type StickerNode = Node<StickerNodeData, "sticker">;

function validateStickerNode(
	node: StickerNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de sticker não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.stickerUrl?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "URL do sticker é obrigatória",
			node: { id: node.id },
		});
	}

	return errors;
}

export const stickerSharedDefinition: NodeSharedDefinition<StickerNode> = {
	type: "sticker",
	dataSchema: stickerNodeDataSchema,
	validate: validateStickerNode,
};
