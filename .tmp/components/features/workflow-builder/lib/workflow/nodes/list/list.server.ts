/**
 * List Node - Server Execution
 */

import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";
import type { ListNode } from "./list.shared";

async function executeListNode(
	context: ExecutionContext<ListNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { body, items, buttonText, header, footer } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "list" as const,
			status: "processing",
		},
	});

	// Simula envio
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Para listas, aguarda resposta do usuário
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "list" as const,
			status: "success",
		},
	});

	return {
		result: {
			text: JSON.stringify({
				type: "interactive",
				interactiveType: "list",
				body,
				buttonText,
				items: items?.map((i) => ({ id: i.id, title: i.title, description: i.description })),
				header,
				footer,
			}),
		},
		nextNodeId,
	};
}

export const listServerDefinition: NodeServerDefinition<ListNode> = {
	execute: executeListNode,
};
