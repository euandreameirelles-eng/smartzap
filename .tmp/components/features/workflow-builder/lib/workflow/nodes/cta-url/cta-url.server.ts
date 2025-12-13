import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { CtaUrlNode } from "@/components/features/workflow-builder/lib/workflow/nodes/cta-url/cta-url.shared";

async function executeCtaUrlNode(
	context: ExecutionContext<CtaUrlNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { text, buttonText, url } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "cta-url",
			status: "processing",
		},
	});

	// Simula envio do CTA URL (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "cta-url",
			status: "success",
		},
	});

	return {
		result: {
			text: `${text || ""}\n[Botão: ${buttonText}] → ${url}`,
		},
		nextNodeId,
	};
}

export const ctaUrlServerDefinition: NodeServerDefinition<CtaUrlNode> = {
	execute: executeCtaUrlNode,
};
