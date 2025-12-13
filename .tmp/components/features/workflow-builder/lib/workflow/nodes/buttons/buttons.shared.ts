/**
 * Buttons Node - WhatsApp Reply Buttons
 * 
 * Envia mensagem com até 3 botões de resposta rápida
 * Limites: Max 3 botões, 20 caracteres por botão
 */

import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

// Schema para cada botão
export const buttonSchema = z.object({
	id: z.string(),
	title: z.string().max(20, "Máximo 20 caracteres"),
});

// Schema principal
export const buttonsNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	// Texto do corpo da mensagem - max 1024 chars (WhatsApp limit)
	body: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	// Header opcional
	header: z.object({
		type: z.enum(["text", "image", "video", "document"]),
		text: z.string().optional(),
		mediaUrl: z.string().optional(),
		mediaId: z.string().optional(),
	}).optional(),
	// Footer opcional (max 60 chars)
	footer: z.string().max(60).optional(),
	// Botões (max 3)
	buttons: z.array(buttonSchema).max(3).default([
		{ id: "btn_1", title: "Opção 1" },
	]),
	validationErrors: z.array(z.any()).optional(),
});

export type ButtonOption = z.infer<typeof buttonSchema>;
export type ButtonsNodeData = z.infer<typeof buttonsNodeDataSchema>;
export type ButtonsNode = Node<ButtonsNodeData, "buttons">;

function validateButtonsNode(
	node: ButtonsNode,
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
			message: "Nó de botões não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	// Deve ter texto no body
	if (!node.data.body?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Mensagem não pode estar vazia",
			node: { id: node.id },
		});
	}

	// Body max 1024 chars
	if (node.data.body && node.data.body.length > 1024) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Mensagem excede 1024 caracteres",
			node: { id: node.id },
		});
	}

	// Deve ter pelo menos 1 botão
	if (!node.data.buttons || node.data.buttons.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Adicione pelo menos 1 botão",
			node: { id: node.id },
		});
	}

	// Máximo 3 botões
	if (node.data.buttons && node.data.buttons.length > 3) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Máximo 3 botões permitidos",
			node: { id: node.id },
		});
	}

	// Validar tamanho dos títulos
	for (const button of node.data.buttons || []) {
		if (button.title.length > 20) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: `Botão "${button.title.substring(0, 10)}..." excede 20 caracteres`,
				node: { id: node.id },
			});
		}
	}

	// Validar footer
	if (node.data.footer && node.data.footer.length > 60) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Footer excede 60 caracteres",
			node: { id: node.id },
		});
	}

	return errors;
}

export const buttonsSharedDefinition: NodeSharedDefinition<ButtonsNode> = {
	type: "buttons",
	dataSchema: buttonsNodeDataSchema,
	validate: validateButtonsNode,
};
