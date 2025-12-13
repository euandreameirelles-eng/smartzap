import type { Node } from "@xyflow/react";
import { z } from "zod";
import type {
	NodeSharedDefinition,
	ValidationContext,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";

const contactSchema = z.object({
	// Name - required, max 256 chars
	name: z.string().max(256, "Máximo 256 caracteres"),
	// Phones - at least one required, E.164 format
	phones: z.array(z.string().max(20, "Máximo 20 caracteres")),
	// Emails - optional, max 256 chars each
	emails: z.array(z.string().max(256, "Máximo 256 caracteres")).optional(),
	// Organization - max 256 chars
	organization: z.string().max(256, "Máximo 256 caracteres").optional(),
});

export const contactsNodeDataSchema = z.object({
	status: z.enum(["processing", "error", "success", "idle"]).optional(),
	label: z.string().optional(),
	contacts: z.array(contactSchema).optional(),
	validationErrors: z.array(z.any()).optional(),
});

export type ContactsNodeData = z.infer<typeof contactsNodeDataSchema>;
export type ContactsNode = Node<ContactsNodeData, "contacts">;

function validateContactsNode(
	node: ContactsNode,
	context: ValidationContext,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const { edges } = context;

	const incomingEdges = edges.filter((e) => e.target === node.id);
	if (incomingEdges.length === 0) {
		errors.push({
			type: "invalid-node-config",
			severity: "warning",
			message: "Nó de contatos não tem conexão de entrada",
			node: { id: node.id },
		});
	}

	if (!node.data.contacts?.length) {
		errors.push({
			type: "invalid-node-config",
			severity: "error",
			message: "Pelo menos um contato é obrigatório",
			node: { id: node.id },
		});
	}

	// Validar cada contato
	for (const contact of node.data.contacts || []) {
		if (!contact.name?.trim()) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: "Nome do contato é obrigatório",
				node: { id: node.id },
			});
		}
		if (contact.name && contact.name.length > 256) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: "Nome do contato excede 256 caracteres",
				node: { id: node.id },
			});
		}
		if (!contact.phones?.length) {
			errors.push({
				type: "invalid-node-config",
				severity: "error",
				message: "Pelo menos um telefone é obrigatório",
				node: { id: node.id },
			});
		}
	}

	return errors;
}

export const contactsSharedDefinition: NodeSharedDefinition<ContactsNode> = {
	type: "contacts",
	dataSchema: contactsNodeDataSchema,
	validate: validateContactsNode,
};
