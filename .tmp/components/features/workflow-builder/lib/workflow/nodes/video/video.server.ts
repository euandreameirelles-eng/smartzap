import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { VideoNode } from "@/components/features/workflow-builder/lib/workflow/nodes/video/video.shared";

async function executeVideoNode(
	context: ExecutionContext<VideoNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { videoUrl, caption } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "video",
			status: "processing",
		},
	});

	// Simula envio do vídeo (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "video",
			status: "success",
		},
	});

	return {
		result: {
			text: `[Vídeo: ${videoUrl}]${caption ? ` - ${caption}` : ""}`,
		},
		nextNodeId,
	};
}

export const videoServerDefinition: NodeServerDefinition<VideoNode> = {
	execute: executeVideoNode,
};
