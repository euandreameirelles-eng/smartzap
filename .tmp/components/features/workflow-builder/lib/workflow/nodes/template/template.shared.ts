/**
 * Template Node - WhatsApp Message Templates
 * 
 * Usa templates aprovados pela Meta para mensagens fora da janela de 24h
 */

import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

// Schema para variáveis do template
export const templateVariableSchema = z.object({
	name: z.string(),
	value: z.string(),
	type: z.enum(["fixed", "variable"]).default("fixed"),
});

// Schema para botões do template (para criar handles dinâmicos)
export const templateButtonSchema = z.object({
	id: z.string(), // ID único para o handle (ex: "button-0", "button-1")
	type: z.enum(["URL", "PHONE_NUMBER", "QUICK_REPLY", "COPY_CODE", "OTP", "FLOW", "CATALOG", "MPM", "VOICE_CALL"]),
	// Button text - max 25 chars (WhatsApp limit)
	text: z.string().max(25, "Máximo 25 caracteres"),
	// URL - max 2000 chars
	url: z.string().max(2000, "URL excede 2000 caracteres").optional(),
	phoneNumber: z.string().optional(),
});

// Schema principal
export const templateNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	templateName: z.string().optional(),
	templateId: z.string().optional(),
	templateStatus: z.enum(["APPROVED", "PENDING", "REJECTED"]).optional(),
	language: z.string().default("pt_BR"),
	category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).optional(),
	preview: z.string().optional(),
	// Variáveis
	headerVariables: z.array(templateVariableSchema).default([]),
	bodyVariables: z.array(templateVariableSchema).default([]),
	buttonVariables: z.array(templateVariableSchema).default([]),
	// Botões do template (para handles dinâmicos)
	buttons: z.array(templateButtonSchema).default([]),
	validationErrors: z.array(z.any()).optional(),
});

export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type TemplateButton = z.infer<typeof templateButtonSchema>;
export type TemplateNodeData = z.infer<typeof templateNodeDataSchema>;
export type TemplateNode = Node<TemplateNodeData, "template">;

function validateTemplateNode(
	node: TemplateNode,
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
			message: "Nó de template não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	// Deve ter template selecionado
	if (!node.data.templateName) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Selecione um template aprovado",
			node: { id: node.id },
		});
	}

	// Template deve estar aprovado
	if (node.data.templateStatus === "PENDING") {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Template ainda não foi aprovado pela Meta",
			node: { id: node.id },
		});
	}

	if (node.data.templateStatus === "REJECTED") {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Template foi rejeitado pela Meta",
			node: { id: node.id },
		});
	}

	return errors;
}

export const templateSharedDefinition: NodeSharedDefinition<TemplateNode> = {
	type: "template",
	dataSchema: templateNodeDataSchema,
	validate: validateTemplateNode,
};
