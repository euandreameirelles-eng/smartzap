import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

const menuOptionSchema = z.object({
	id: z.string(),
	label: z.string().max(20, "Máximo 20 caracteres por opção"),
	description: z.string().max(72, "Máximo 72 caracteres").optional(),
});

export const menuNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	// Body text - max 1024 chars (WhatsApp limit)
	text: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	// Header opcional - max 60 chars
	header: z.string().max(60, "Máximo 60 caracteres").optional(),
	// Footer opcional - max 60 chars
	footer: z.string().max(60, "Máximo 60 caracteres").optional(),
	// Options - max 3 para botões, max 10 para lista
	options: z.array(menuOptionSchema).max(10, "Máximo 10 opções").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type MenuOption = z.infer<typeof menuOptionSchema>;
export type MenuNodeData = z.infer<typeof menuNodeDataSchema>;
export type MenuNode = Node<MenuNodeData, "menu">;

function validateMenuNode(
	node: MenuNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de menu não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	// Deve ter texto
	if (!node.data.text?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto da mensagem é obrigatório",
			node: { id: node.id },
		});
	}

	// Body max 1024 chars
	if (node.data.text && node.data.text.length > 1024) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto excede 1024 caracteres",
			node: { id: node.id },
		});
	}

	// Header max 60 chars
	if (node.data.header && node.data.header.length > 60) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Header excede 60 caracteres",
			node: { id: node.id },
		});
	}

	// Footer max 60 chars
	if (node.data.footer && node.data.footer.length > 60) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Footer excede 60 caracteres",
			node: { id: node.id },
		});
	}

	if (!node.data.options || node.data.options.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Menu deve ter pelo menos uma opção",
			node: { id: node.id },
		});
	}

	// Max 10 options
	if (node.data.options && node.data.options.length > 10) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Máximo 10 opções permitidas",
			node: { id: node.id },
		});
	}

	// Validar labels (max 20 chars para botões)
	for (const option of node.data.options || []) {
		if (option.label.length > 20) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: `Opção "${option.label.substring(0, 10)}..." excede 20 caracteres`,
				node: { id: node.id },
			});
		}
	}

	return errors;
}

export const menuSharedDefinition: NodeSharedDefinition<MenuNode> = {
	type: "menu",
	dataSchema: menuNodeDataSchema,
	validate: validateMenuNode,
};
