import { contactsClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/contacts/contacts.client";
import { contactsServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/contacts/contacts.server";
import {
	type ContactsNode,
	contactsSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/contacts/contacts.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const contactsNodeDefinition = {
	shared: contactsSharedDefinition,
	client: contactsClientDefinition,
	server: contactsServerDefinition,
} as NodeDefinition<ContactsNode>;
