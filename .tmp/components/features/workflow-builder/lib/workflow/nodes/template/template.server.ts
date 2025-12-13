/**
 * Template Node - Server Execution
 * 
 * Envia mensagem usando template aprovado pela Meta
 */

import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";
import type { TemplateNode } from "./template.shared";

async function executeTemplateNode(
	context: ExecutionContext<TemplateNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { templateName, bodyVariables, headerVariables, language } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "template",
			status: "processing",
		},
	});

	if (!templateName) {
		writer.write({
			type: "data-node-execution-status",
			data: {
				nodeId: node.id,
				nodeType: "template" as const,
				status: "error",
			},
		});
		return {
			result: { text: "Erro: Template não selecionado" },
			nextNodeId: null,
		};
	}

	// Montar parâmetros do template
	const parameters: { type: string; text: string }[] = [];

	// Header variables
	for (const variable of headerVariables || []) {
		if (variable.value) {
			parameters.push({ type: "text", text: variable.value });
		}
	}

	// Body variables
	for (const variable of bodyVariables || []) {
		if (variable.value) {
			parameters.push({ type: "text", text: variable.value });
		}
	}

	// Simula envio do template
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "template",
			status: "success",
		},
	});

	return {
		result: {
			text: JSON.stringify({
				type: "template",
				templateName,
				parameters,
				language: language || "pt_BR",
			}),
		},
		nextNodeId,
	};
}

export const templateServerDefinition: NodeServerDefinition<TemplateNode> = {
	execute: executeTemplateNode,
};
