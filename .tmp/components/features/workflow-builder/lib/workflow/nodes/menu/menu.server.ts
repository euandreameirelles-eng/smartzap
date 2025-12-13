import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";
import type { MenuNode } from "@/components/features/workflow-builder/lib/workflow/nodes/menu/menu.shared";

async function executeMenuNode(
	context: ExecutionContext<MenuNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const text = node.data.text || "Escolha uma opção:";

	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "menu",
			status: "processing",
		},
	});

	// Em produção, aguardaria resposta do usuário
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Por padrão, segue a primeira opção
	const firstOptionId = node.data.options?.[0]?.id;
	const outgoingEdge = edges.find(
		(e) => e.source === node.id && e.sourceHandle === firstOptionId
	);
	const nextNodeId = outgoingEdge?.target || null;

	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "menu",
			status: "success",
		},
	});

	return {
		result: { text },
		nextNodeId,
	};
}

export const menuServerDefinition: NodeServerDefinition<MenuNode> = {
	execute: executeMenuNode,
};
