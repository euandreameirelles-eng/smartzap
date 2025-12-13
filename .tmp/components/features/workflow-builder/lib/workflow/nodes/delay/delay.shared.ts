import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const delayNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	delaySeconds: z.number().optional(),
	delayType: z.enum(["seconds", "minutes", "hours"]).optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type DelayNodeData = z.infer<typeof delayNodeDataSchema>;
export type DelayNode = Node<DelayNodeData, "delay">;

function validateDelayNode(
	node: DelayNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de delay não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.delaySeconds || node.data.delaySeconds < 1) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Tempo de delay deve ser pelo menos 1",
			node: { id: node.id },
		});
	}

	return errors;
}

export const delaySharedDefinition: NodeSharedDefinition<DelayNode> = {
	type: "delay",
	dataSchema: delayNodeDataSchema,
	validate: validateDelayNode,
};
