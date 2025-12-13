/**
 * List Node - WhatsApp List Message
 * 
 * Envia mensagem com lista de até 10 opções
 * Limites: 24 chars título, 72 chars descrição, 10 items
 */

import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

// Schema para cada item da lista
export const listItemSchema = z.object({
	id: z.string(),
	title: z.string().max(24, "Máximo 24 caracteres"),
	description: z.string().max(72, "Máximo 72 caracteres").optional(),
});

// Schema principal
export const listNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	// Texto do corpo da mensagem - max 1024 chars
	body: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	// Header (apenas texto para listas) - max 60 chars
	header: z.string().max(60, "Máximo 60 caracteres").optional(),
	// Footer opcional (max 60 chars)
	footer: z.string().max(60).optional(),
	// Texto do botão que abre a lista (max 20 chars)
	buttonText: z.string().max(20).default("Ver opções"),
	// Items da lista (max 10)
	items: z.array(listItemSchema).max(10).default([
		{ id: "item_1", title: "Opção 1" },
	]),
	validationErrors: z.array(z.any()).optional(),
});

export type ListItem = z.infer<typeof listItemSchema>;
export type ListNodeData = z.infer<typeof listNodeDataSchema>;
export type ListNode = Node<ListNodeData, "list">;

function validateListNode(
	node: ListNode,
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
			message: "Nó de lista não tem conexão de entrada",
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

	// Header max 60 chars
	if (node.data.header && node.data.header.length > 60) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Header excede 60 caracteres",
			node: { id: node.id },
		});
	}

	// Deve ter pelo menos 1 item
	if (!node.data.items || node.data.items.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Adicione pelo menos 1 item",
			node: { id: node.id },
		});
	}

	// Máximo 10 items
	if (node.data.items && node.data.items.length > 10) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Máximo 10 items permitidos",
			node: { id: node.id },
		});
	}

	// Validar tamanho dos títulos
	for (const item of node.data.items || []) {
		if (item.title.length > 24) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: `Item "${item.title.substring(0, 10)}..." excede 24 caracteres`,
				node: { id: node.id },
			});
		}
		if (item.description && item.description.length > 72) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: `Descrição excede 72 caracteres`,
				node: { id: node.id },
			});
		}
	}

	// Validar texto do botão
	if (node.data.buttonText && node.data.buttonText.length > 20) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto do botão excede 20 caracteres",
			node: { id: node.id },
		});
	}

	return errors;
}

export const listSharedDefinition: NodeSharedDefinition<ListNode> = {
	type: "list",
	dataSchema: listNodeDataSchema,
	validate: validateListNode,
};
