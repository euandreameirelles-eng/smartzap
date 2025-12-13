import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { LocationNode } from "@/components/features/workflow-builder/lib/workflow/nodes/location/location.shared";

async function executeLocationNode(
	context: ExecutionContext<LocationNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { latitude, longitude, name, address } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "location",
			status: "processing",
		},
	});

	// Simula envio da localização (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "location",
			status: "success",
		},
	});

	return {
		result: {
			text: `[Localização: ${name || `${latitude}, ${longitude}`}]${address ? ` - ${address}` : ""}`,
		},
		nextNodeId,
	};
}

export const locationServerDefinition: NodeServerDefinition<LocationNode> = {
	execute: executeLocationNode,
};
