"use client";

import React, { memo } from "react";
import { type NodeProps, Position } from "@xyflow/react";
import { MessageSquare } from "lucide-react";
import { nanoid } from "nanoid";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { MessageNode as MessageNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/message/message.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface MessageNodeProps extends NodeProps<MessageNodeType> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

export const MessageNode = memo(function MessageNode({ id, selected, data }: MessageNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasContent = !!data.text?.trim();

	return (
		<BaseNode
			selected={selected}
			category="message"
			icon={<MessageSquare className="w-4 h-4" />}
			title={data.label || "Mensagem"}
			status={getNodeStatus(data.status)}
			className="min-w-[200px]"
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

			{/* Preview */}
			{hasContent ? (
				<p className="text-xs text-muted-foreground line-clamp-2">
					{data.text}
				</p>
			) : (
				<p className="text-xs text-muted-foreground/50 italic">
					Sem conteúdo
				</p>
			)}

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

export function MessageNodePanel({ node }: { node: MessageNodeType }) {
	const updateNode = useWorkflow((store) => store.updateNode);

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
							nodeType: "message",
							data: { label: e.target.value },
						})
					}
					placeholder="Mensagem de boas-vindas"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="text">Texto da Mensagem</Label>
				<Textarea
					id="text"
					value={node.data.text || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "message",
							data: { text: e.target.value },
						})
					}
					placeholder="Olá! Como posso ajudar você hoje?"
					className="mt-1 min-h-[100px]"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Use {"{{nome}}"} para personalizar com variáveis
				</p>
			</div>
		</div>
	);
}

export function createMessageNode(position: {
	x: number;
	y: number;
}): MessageNodeType {
	return {
		id: nanoid(),
		type: "message",
		position,
		data: {
			label: "Mensagem",
			text: "",
		},
	};
}

export const messageClientDefinition: NodeClientDefinition<MessageNodeType> = {
	component: MessageNode as React.ComponentType<NodeProps<MessageNodeType>>,
	panelComponent: MessageNodePanel,
	create: createMessageNode,
	meta: {
		label: "Mensagem",
		icon: MessageSquare,
		description: "Envia uma mensagem de texto",
	},
};
