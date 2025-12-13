import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const imageNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	imageUrl: z.string().optional(),
	// Caption - max 1024 chars (WhatsApp limit for media captions)
	caption: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type ImageNodeData = z.infer<typeof imageNodeDataSchema>;
export type ImageNode = Node<ImageNodeData, "image">;

function validateImageNode(
	node: ImageNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de imagem não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.imageUrl?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "URL da imagem é obrigatória",
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

export const imageSharedDefinition: NodeSharedDefinition<ImageNode> = {
	type: "image",
	dataSchema: imageNodeDataSchema,
	validate: validateImageNode,
};
