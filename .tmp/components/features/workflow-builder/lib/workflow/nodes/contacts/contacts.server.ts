import type {
	NodeServerDefinition,
	ExecutionContext,
	NodeExecutionResult,
} from "@/components/features/workflow-builder/types/workflow";
import type { ContactsNode } from "@/components/features/workflow-builder/lib/workflow/nodes/contacts/contacts.shared";

async function executeContactsNode(
	context: ExecutionContext<ContactsNode>,
): Promise<NodeExecutionResult> {
	const { node, edges, writer } = context;
	const { contacts } = node.data;

	// Emite status de processamento
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "contacts",
			status: "processing",
		},
	});

	// Simula envio dos contatos (em produção, isso seria via WhatsApp API)
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Encontra próximo nó
	const outgoingEdge = edges.find((e) => e.source === node.id);
	const nextNodeId = outgoingEdge?.target || null;

	// Emite status de sucesso
	writer.write({
		type: "data-node-execution-status",
		data: {
			nodeId: node.id,
			nodeType: "contacts",
			status: "success",
		},
	});

	const contactNames = contacts?.map((c) => c.name).join(", ") || "Nenhum contato";

	return {
		result: {
			text: `[Contatos: ${contactNames}]`,
		},
		nextNodeId,
	};
}

export const contactsServerDefinition: NodeServerDefinition<ContactsNode> = {
	execute: executeContactsNode,
};
