import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { DocumentNode } from "@/components/features/workflow-builder/lib/workflow/nodes/document/document.shared";

async function executeDocumentNode(
	context: ExecutionContext<DocumentNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { documentUrl, filename, caption } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "document",
			status: "processing",
		},
	});

	// Simula envio do documento (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "document",
			status: "success",
		},
	});

	return {
		result: {
			text: `[Documento: ${filename || documentUrl}]${caption ? ` - ${caption}` : ""}`,
		},
		nextNodeId,
	};
}

export const documentServerDefinition: NodeServerDefinition<DocumentNode> = {
	execute: executeDocumentNode,
};
