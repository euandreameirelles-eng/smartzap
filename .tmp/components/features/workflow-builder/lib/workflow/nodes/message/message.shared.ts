import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const messageNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	// Text message - max 4096 chars (WhatsApp limit for text messages)
	text: z.string().max(4096, "Máximo 4096 caracteres").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type MessageNodeData = z.infer<typeof messageNodeDataSchema>;
export type MessageNode = Node<MessageNodeData, "message">;

function validateMessageNode(
	node: MessageNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	// Deve ter pelo menos uma conexão de entrada
	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de mensagem não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	// Deve ter texto
	if (!node.data.text?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Mensagem não pode estar vazia",
			node: { id: node.id },
		});
	}

	// Text max 4096 chars
	if (node.data.text && node.data.text.length > 4096) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Mensagem excede 4096 caracteres",
			node: { id: node.id },
		});
	}

	return errors;
}

export const messageSharedDefinition: NodeSharedDefinition<MessageNode> = {
	type: "message",
	dataSchema: messageNodeDataSchema,
	validate: validateMessageNode,
};
