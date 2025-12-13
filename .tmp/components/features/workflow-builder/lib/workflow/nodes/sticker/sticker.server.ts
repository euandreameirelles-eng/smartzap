import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { StickerNode } from "@/components/features/workflow-builder/lib/workflow/nodes/sticker/sticker.shared";

async function executeStickerNode(
	context: ExecutionContext<StickerNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { stickerUrl } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "sticker",
			status: "processing",
		},
	});

	// Simula envio do sticker (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "sticker",
			status: "success",
		},
	});

	return {
		result: {
			text: `[Sticker: ${stickerUrl}]`,
		},
		nextNodeId,
	};
}

export const stickerServerDefinition: NodeServerDefinition<StickerNode> = {
	execute: executeStickerNode,
};
