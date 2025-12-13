import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const audioNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	audioUrl: z.string().optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type AudioNodeData = z.infer<typeof audioNodeDataSchema>;
export type AudioNode = Node<AudioNodeData, "audio">;

function validateAudioNode(
	node: AudioNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de áudio não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.audioUrl?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "URL do áudio é obrigatória",
			node: { id: node.id },
		});
	}

	return errors;
}

export const audioSharedDefinition: NodeSharedDefinition<AudioNode> = {
	type: "audio",
	dataSchema: audioNodeDataSchema,
	validate: validateAudioNode,
};
