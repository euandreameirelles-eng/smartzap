import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { DelayNode } from "@/components/features/workflow-builder/lib/workflow/nodes/delay/delay.shared";

async function executeDelayNode(
	context: ExecutionContext<DelayNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { delaySeconds = 1, delayType = "seconds" } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "delay",
			status: "processing",
		},
	});

	// Converter para milissegundos
	let delayMs = delaySeconds * 1000;
	if (delayType === "minutes") {
		delayMs = delaySeconds * 60 * 1000;
	} else if (delayType === "hours") {
		delayMs = delaySeconds * 60 * 60 * 1000;
	}

	// Aguarda o delay
	await new Promise((resolve) => setTimeout(resolve, delayMs));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "delay",
			status: "success",
		},
	});

	const unitLabel = delayType === "seconds" ? "segundo(s)" : delayType === "minutes" ? "minuto(s)" : "hora(s)";

	return {
		result: {
			text: `[Aguardou ${delaySeconds} ${unitLabel}]`,
		},
		nextNodeId,
	};
}

export const delayServerDefinition: NodeServerDefinition<DelayNode> = {
	execute: executeDelayNode,
};
