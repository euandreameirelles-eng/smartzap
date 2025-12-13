import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

export const locationNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	// Latitude: -90 to 90
	latitude: z.number().min(-90).max(90).optional(),
	// Longitude: -180 to 180
	longitude: z.number().min(-180).max(180).optional(),
	// Name - max 100 chars (recommended)
	name: z.string().max(100, "Máximo 100 caracteres").optional(),
	// Address - max 500 chars (recommended)
	address: z.string().max(500, "Máximo 500 caracteres").optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type LocationNodeData = z.infer<typeof locationNodeDataSchema>;
export type LocationNode = Node<LocationNodeData, "location">;

function validateLocationNode(
	node: LocationNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de localização não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (node.data.latitude === undefined || node.data.longitude === undefined) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Latitude e longitude são obrigatórias",
			node: { id: node.id },
		});
	}

	// Validar range de latitude
	if (node.data.latitude !== undefined && (node.data.latitude < -90 || node.data.latitude > 90)) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Latitude deve estar entre -90 e 90",
			node: { id: node.id },
		});
	}

	// Validar range de longitude
	if (node.data.longitude !== undefined && (node.data.longitude < -180 || node.data.longitude > 180)) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Longitude deve estar entre -180 e 180",
			node: { id: node.id },
		});
	}

	// Validar name
	if (node.data.name && node.data.name.length > 100) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Nome excede 100 caracteres",
			node: { id: node.id },
		});
	}

	// Validar address
	if (node.data.address && node.data.address.length > 500) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Endereço excede 500 caracteres",
			node: { id: node.id },
		});
	}

	return errors;
}

export const locationSharedDefinition: NodeSharedDefinition<LocationNode> = {
	type: "location",
	dataSchema: locationNodeDataSchema,
	validate: validateLocationNode,
};
