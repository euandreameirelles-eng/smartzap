"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Users, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { ContactsNode as ContactsNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/contacts/contacts.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ContactsNodeProps extends NodeProps<ContactsNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const ContactsNode = memo(function ContactsNode({ id, selected, data }: ContactsNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasContacts = !!data.contacts?.length;

	return (
		<BaseNode
			selected={selected}
			category="data"
			icon={<Users className="w-4 h-4" />}
			title={data.label || "Contatos"}
			status={statusMap[data.status || "idle"]}
		>
			<BaseHandle
				id="input"
				type="target"
				position={Position.Left}
				isConnectable={canConnectHandle({
					nodeId: id,
					handleId: "input",
					type: "target",
				})}
			/>

			<div className="mt-2 px-1">
				{hasContacts ? (
					<p className="text-xs text-muted-foreground">
						{data.contacts!.length} contato(s)
					</p>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Nenhum contato
					</p>
				)}
			</div>

			<BaseHandle
				id="output"
				type="source"
				position={Position.Right}
				isConnectable={canConnectHandle({
					nodeId: id,
					handleId: "output",
					type: "source",
				})}
			/>
		</BaseNode>
	);
});

export function ContactsNodePanel({ node }: { node: ContactsNodeType }) {
	const updateNode = useWorkflow((store) => store.updateNode);
	const contacts = node.data.contacts || [];

	const addContact = () => {
		updateNode({
			id: node.id,
			nodeType: "contacts",
			data: {
				contacts: [
					...contacts,
					{ name: "", phones: [""], emails: [], organization: "" },
				],
			},
		});
	};

	const removeContact = (index: number) => {
		updateNode({
			id: node.id,
			nodeType: "contacts",
			data: {
				contacts: contacts.filter((_, i) => i !== index),
			},
		});
	};

	const updateContact = (index: number, field: string, value: string) => {
		const updated = [...contacts];
		if (field === "phone") {
			updated[index] = { ...updated[index], phones: [value] };
		} else if (field === "email") {
			updated[index] = { ...updated[index], emails: [value] };
		} else {
			updated[index] = { ...updated[index], [field]: value };
		}
		updateNode({
			id: node.id,
			nodeType: "contacts",
			data: { contacts: updated },
		});
	};

	return (
		<div className="space-y-4">
			<div>
				<Label htmlFor="label">Nome do Nó</Label>
				<Input
					id="label"
					value={node.data.label || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "contacts",
							data: { label: e.target.value },
						})
					}
					placeholder="Contato do suporte"
					className="mt-1"
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Contatos</Label>
					<Button size="sm" variant="outline" onClick={addContact}>
						<Plus className="w-4 h-4 mr-1" />
						Adicionar
					</Button>
				</div>

				{contacts.map((contact, index) => (
					<div key={index} className="p-3 border rounded-lg space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Contato {index + 1}</span>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => removeContact(index)}
							>
								<Trash2 className="w-4 h-4 text-destructive" />
							</Button>
						</div>
						<Input
							placeholder="Nome"
							value={contact.name}
							onChange={(e) => updateContact(index, "name", e.target.value)}
						/>
						<Input
							placeholder="Telefone (+5511999999999)"
							value={contact.phones[0] || ""}
							onChange={(e) => updateContact(index, "phone", e.target.value)}
						/>
						<Input
							placeholder="Email (opcional)"
							value={contact.emails?.[0] || ""}
							onChange={(e) => updateContact(index, "email", e.target.value)}
						/>
						<Input
							placeholder="Empresa (opcional)"
							value={contact.organization || ""}
							onChange={(e) =>
								updateContact(index, "organization", e.target.value)
							}
						/>
					</div>
				))}

				{contacts.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-4">
						Clique em Adicionar para criar um contato
					</p>
				)}
			</div>
		</div>
	);
}

export function createContactsNode(position: {
	x: number;
	y: number;
}): ContactsNodeType {
	return {
		id: nanoid(),
		type: "contacts",
		position,
		data: {
			label: "Contatos",
			contacts: [],
		},
	};
}

export const contactsClientDefinition: NodeClientDefinition<ContactsNodeType> = {
	component: ContactsNode,
	panelComponent: ContactsNodePanel,
	create: createContactsNode,
	meta: {
		label: "Contatos",
		icon: Users,
		description: "Envia um cartão de contato",
	},
};
