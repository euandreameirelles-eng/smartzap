import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";
import type { MessageNode } from "@/components/features/workflow-builder/lib/workflow/nodes/message/message.shared";

async function executeMessageNode(
	context: ExecutionContext<MessageNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const text = node.data.text || "";

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "message",
			status: "processing",
		},
	});

	// Simula envio da mensagem (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "message",
			status: "success",
		},
	});

	return {
		result: {
			text,
		},
		nextNodeId,
	};
}

export const messageServerDefinition: NodeServerDefinition<MessageNode> = {
	execute: executeMessageNode,
};
