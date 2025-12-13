import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { AudioNode } from "@/components/features/workflow-builder/lib/workflow/nodes/audio/audio.shared";

async function executeAudioNode(
	context: ExecutionContext<AudioNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { audioUrl } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "audio",
			status: "processing",
		},
	});

	// Simula envio do áudio (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "audio",
			status: "success",
		},
	});

	return {
		result: {
			text: `[Áudio: ${audioUrl}]`,
		},
		nextNodeId,
	};
}

export const audioServerDefinition: NodeServerDefinition<AudioNode> = {
	execute: executeAudioNode,
};
