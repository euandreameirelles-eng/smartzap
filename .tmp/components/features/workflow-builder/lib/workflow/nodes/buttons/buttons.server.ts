/**
 * Buttons Node - Server Execution
 */

import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";
import type { ButtonsNode } from "./buttons.shared";

async function executeButtonsNode(
	context: ExecutionContext<ButtonsNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { body, buttons, footer, header } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "buttons" as const,
			status: "processing",
		},
	});

	// Simula envio
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Para botões, aguarda resposta do usuário
	// O próximo nó será determinado pelo botão clicado
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "buttons" as const,
			status: "success",
		},
	});

	return {
		result: {
			text: JSON.stringify({
				type: "interactive",
				interactiveType: "button",
				body,
				buttons: buttons?.map((b) => ({ id: b.id, title: b.title })),
				footer,
				header,
			}),
		},
		nextNodeId,
	};
}

export const buttonsServerDefinition: NodeServerDefinition<ButtonsNode> = {
	execute: executeButtonsNode,
};
