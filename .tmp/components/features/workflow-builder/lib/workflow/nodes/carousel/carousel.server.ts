import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { CarouselNode } from "@/components/features/workflow-builder/lib/workflow/nodes/carousel/carousel.shared";

async function executeCarouselNode(
	context: ExecutionContext<CarouselNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { bodyText, cards } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "carousel",
			status: "processing",
		},
	});

	// Simula envio do carrossel (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "carousel",
			status: "success",
		},
	});

	const cardTitles = cards?.map((c) => c.title).join(", ") || "Sem cards";

	return {
		result: {
			text: `${bodyText || ""}\n[Carrossel: ${cardTitles}]`,
		},
		nextNodeId,
	};
}

export const carouselServerDefinition: NodeServerDefinition<CarouselNode> = {
	execute: executeCarouselNode,
};
