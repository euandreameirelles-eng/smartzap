import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const ctaUrlNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	// Body text - max 1024 chars
	text: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	// Button text - max 25 chars (WhatsApp limit for CTA buttons)
	buttonText: z.string().max(25, "Máximo 25 caracteres").optional(),
	// URL - max 2000 chars
	url: z.string().max(2000, "URL excede 2000 caracteres").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type CtaUrlNodeData = z.infer<typeof ctaUrlNodeDataSchema>;
export type CtaUrlNode = Node<CtaUrlNodeData, "cta-url">;

function validateCtaUrlNode(
	node: CtaUrlNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de CTA não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.text?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto da mensagem é obrigatório",
			node: { id: node.id },
		});
	}

	if (!node.data.buttonText?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto do botão é obrigatório",
			node: { id: node.id },
		});
	}

	if (!node.data.url?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "URL é obrigatória",
			node: { id: node.id },
		});
	}

	if (node.data.buttonText && node.data.buttonText.length > 25) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto do botão deve ter no máximo 25 caracteres",
			node: { id: node.id },
		});
	}

	// Text max 1024 chars
	if (node.data.text && node.data.text.length > 1024) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto excede 1024 caracteres",
			node: { id: node.id },
		});
	}

	// URL max 2000 chars
	if (node.data.url && node.data.url.length > 2000) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "URL excede 2000 caracteres",
			node: { id: node.id },
		});
	}

	return errors;
}

export const ctaUrlSharedDefinition: NodeSharedDefinition<CtaUrlNode> = {
	type: "cta-url",
	dataSchema: ctaUrlNodeDataSchema,
	validate: validateCtaUrlNode,
};
