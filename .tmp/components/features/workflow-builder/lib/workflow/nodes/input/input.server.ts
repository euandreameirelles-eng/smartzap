import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";
import type { InputNode } from "@/components/features/workflow-builder/lib/workflow/nodes/input/input.shared";

async function executeInputNode(
	context: ExecutionContext<InputNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const question = node.data.question || "Por favor, responda:";

	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "input",
			status: "processing",
		},
	});

	// Em produção, aguardaria resposta do usuário
	await new Promise((resolve) => setTimeout(resolve, 500));

	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "input",
			status: "success",
		},
	});

	return {
		result: { text: question },
		nextNodeId,
	};
}

export const inputServerDefinition: NodeServerDefinition<InputNode> = {
	execute: executeInputNode,
};
