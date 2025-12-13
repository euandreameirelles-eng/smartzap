import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

const carouselCardSchema = z.object({
	id: z.string(),
	imageUrl: z.string(),
	// Title - max 200 chars
	title: z.string().max(200, "Máximo 200 caracteres"),
	// Description - max 100 chars
	description: z.string().max(100, "Máximo 100 caracteres").optional(),
	// Button text - max 25 chars
	buttonText: z.string().max(25, "Máximo 25 caracteres").optional(),
	// Button URL - max 2000 chars
	buttonUrl: z.string().max(2000, "URL excede 2000 caracteres").optional(),
});

export const carouselNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	// Header - max 60 chars
	headerText: z.string().max(60, "Máximo 60 caracteres").optional(),
	// Body - max 1024 chars
	bodyText: z.string().max(1024, "Máximo 1024 caracteres").optional(),
	// Max 10 cards
	cards: z.array(carouselCardSchema).max(10, "Máximo 10 cards").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type CarouselCard = z.infer<typeof carouselCardSchema>;
export type CarouselNodeData = z.infer<typeof carouselNodeDataSchema>;
export type CarouselNode = Node<CarouselNodeData, "carousel">;

function validateCarouselNode(
	node: CarouselNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de carrossel não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.cards?.length) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Pelo menos um card é obrigatório",
			node: { id: node.id },
		});
	}

	if (node.data.cards && node.data.cards.length > 10) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Máximo de 10 cards permitido",
			node: { id: node.id },
		});
	}

	// Validar header
	if (node.data.headerText && node.data.headerText.length > 60) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Header excede 60 caracteres",
			node: { id: node.id },
		});
	}

	// Validar body
	if (node.data.bodyText && node.data.bodyText.length > 1024) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Texto excede 1024 caracteres",
			node: { id: node.id },
		});
	}

	// Validar cada card
	for (const card of node.data.cards || []) {
		if (card.title.length > 200) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: `Título "${card.title.substring(0, 20)}..." excede 200 caracteres`,
				node: { id: node.id },
			});
		}
		if (card.description && card.description.length > 100) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: "Descrição do card excede 100 caracteres",
				node: { id: node.id },
			});
		}
		if (card.buttonText && card.buttonText.length > 25) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: "Texto do botão excede 25 caracteres",
				node: { id: node.id },
			});
		}
		if (card.buttonUrl && card.buttonUrl.length > 2000) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: "URL do botão excede 2000 caracteres",
				node: { id: node.id },
			});
		}
	}

	return errors;
}

export const carouselSharedDefinition: NodeSharedDefinition<CarouselNode> = {
	type: "carousel",
	dataSchema: carouselNodeDataSchema,
	validate: validateCarouselNode,
};
