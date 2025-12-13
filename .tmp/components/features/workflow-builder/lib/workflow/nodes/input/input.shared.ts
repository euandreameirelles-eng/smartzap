import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const inputNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	// Question - max 4096 chars (sent as text message)
	question: z.string().max(4096, "Máximo 4096 caracteres").optional(),
	// Variable name - alphanumeric and underscore only
	variableName: z.string().max(64, "Máximo 64 caracteres").optional(),
	inputType: z.enum(["text", "number", "email", "phone", "date"]).optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type InputNodeData = z.infer<typeof inputNodeDataSchema>;
export type InputNode = Node<InputNodeData, "input">;

function validateInputNode(
	node: InputNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de coleta não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.question?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Pergunta não pode estar vazia",
			node: { id: node.id },
		});
	}

	// Question max 4096 chars
	if (node.data.question && node.data.question.length > 4096) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Pergunta excede 4096 caracteres",
			node: { id: node.id },
		});
	}

	if (!node.data.variableName?.trim()) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Nome da variável é obrigatório",
			node: { id: node.id },
		});
	}

	return errors;
}

export const inputSharedDefinition: NodeSharedDefinition<InputNode> = {
	type: "input",
	dataSchema: inputNodeDataSchema,
	validate: validateInputNode,
};
