import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { ImageNode } from "@/components/features/workflow-builder/lib/workflow/nodes/image/image.shared";

async function executeImageNode(
	context: ExecutionContext<ImageNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { imageUrl, caption } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "image",
			status: "processing",
		},
	});

	// Simula envio da imagem (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "image",
			status: "success",
		},
	});

	return {
		result: {
			text: `[Imagem: ${imageUrl}]${caption ? ` - ${caption}` : ""}`,
		},
		nextNodeId,
	};
}

export const imageServerDefinition: NodeServerDefinition<ImageNode> = {
	execute: executeImageNode,
};
