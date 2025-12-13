"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { List, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";

import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import type { ListNode, ListItem } from "./list.shared";

export interface ListNodeProps extends NodeProps<ListNode> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

function ListNodeComponent({ id, selected, data }: ListNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	return (
		<BaseNode
			selected={selected}
			category="message"
			icon={<List className="w-4 h-4" />}
			title="Lista"
			status={getNodeStatus(data.status)}
			className="min-w-[220px]"
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

			<div className="space-y-1">
				{data.body && (
					<p className="text-xs text-zinc-400 truncate max-w-[180px]">
						{data.body}
					</p>
				)}
				<div className="text-[10px] text-zinc-500">
					{(data.items || []).length} opções • {data.buttonText || "Ver opções"}
				</div>
			</div>

			{/* Handle para cada item */}
			{(data.items || []).map((item, index) => (
				<BaseHandle
					key={item.id}
					id={`item_${item.id}`}
					type="source"
					position={Position.Right}
					style={{ top: `${30 + index * 10}%` }}
					isConnectable={canConnectHandle({
						nodeId: id,
						handleId: `item_${item.id}`,
						type: "source",
					})}
				/>
			))}
		</BaseNode>
	);
}

export const ListNodeView = memo(ListNodeComponent);

// Panel de configuração
export function ListNodePanel({ node }: { node: ListNode }) {
	const updateNode = useWorkflow((store) => store.updateNode);

	function addItem() {
		if ((node.data.items || []).length >= 10) return;
		const newItems = [
			...(node.data.items || []),
			{ id: nanoid(8), title: `Opção ${(node.data.items || []).length + 1}` },
		];
		updateNode({
			id: node.id,
			nodeType: "list",
			data: { items: newItems },
		});
	}

	function removeItem(index: number) {
		const newItems = [...(node.data.items || [])];
		newItems.splice(index, 1);
		updateNode({
			id: node.id,
			nodeType: "list",
			data: { items: newItems },
		});
	}

	function updateItem(index: number, field: "title" | "description", value: string) {
		const newItems = [...(node.data.items || [])];
		newItems[index] = { ...newItems[index], [field]: value };
		updateNode({
			id: node.id,
			nodeType: "list",
			data: { items: newItems },
		});
	}

	return (
		<div className="space-y-4">
			<div>
				<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
					<List className="w-4 h-4 text-indigo-400" />
					Lista de Opções
				</h4>
				<p className="text-xs text-zinc-500 mb-3">
					Para 4-10 opções. Cada título pode ter até 24 caracteres.
				</p>
			</div>

			{/* Mensagem */}
			<div className="space-y-2">
				<Label className="text-xs">Mensagem</Label>
				<Textarea
					value={node.data.body || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "list",
							data: { body: e.target.value },
						})
					}
					placeholder="Escolha uma opção na lista:"
					className="min-h-[80px] text-sm bg-zinc-900 border-zinc-700"
				/>
			</div>

			{/* Texto do botão */}
			<div className="space-y-2">
				<Label className="text-xs">Texto do Botão</Label>
				<Input
					value={node.data.buttonText || "Ver opções"}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "list",
							data: { buttonText: e.target.value },
						})
					}
					maxLength={20}
					placeholder="Ver opções"
					className="h-8 text-xs bg-zinc-900 border-zinc-700"
				/>
				<span className="text-[10px] text-zinc-500">
					{(node.data.buttonText || "Ver opções").length}/20
				</span>
			</div>

			{/* Items */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-xs">Opções ({(node.data.items || []).length}/10)</Label>
					<Button
						variant="ghost"
						size="sm"
						onClick={addItem}
						disabled={(node.data.items || []).length >= 10}
						className="h-6 text-xs"
					>
						<Plus className="w-3 h-3 mr-1" />
						Adicionar
					</Button>
				</div>

				<div className="space-y-3 max-h-[300px] overflow-y-auto">
					{(node.data.items || []).map((item: ListItem, index: number) => (
						<div key={item.id} className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-xs text-zinc-500 w-4">{index + 1}.</span>
								<Input
									value={item.title}
									onChange={(e) => updateItem(index, "title", e.target.value)}
									maxLength={24}
									placeholder="Título"
									className="flex-1 h-7 text-xs bg-zinc-800 border-zinc-700"
								/>
								<span className="text-[10px] text-zinc-500 w-8">
									{item.title.length}/24
								</span>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeItem(index)}
									className="h-6 w-6 text-zinc-500 hover:text-red-400"
									disabled={(node.data.items || []).length <= 1}
								>
									<Trash2 className="w-3 h-3" />
								</Button>
							</div>
							<Input
								value={item.description || ""}
								onChange={(e) => updateItem(index, "description", e.target.value)}
								maxLength={72}
								placeholder="Descrição (opcional)"
								className="h-7 text-xs bg-zinc-800 border-zinc-700"
							/>
						</div>
					))}
				</div>
			</div>

			{/* Dica */}
			<div className="text-[10px] text-zinc-500 p-2 bg-zinc-900/50 rounded border border-zinc-800">
				💡 Use lista quando tiver mais de 3 opções. Para 1-3 opções, prefira botões.
			</div>
		</div>
	);
}

// Factory function
export function createListNode(position: { x: number; y: number }): ListNode {
	return {
		id: nanoid(),
		type: "list",
		position,
		data: {
			body: "",
			buttonText: "Ver opções",
			items: [
				{ id: nanoid(8), title: "Opção 1" },
				{ id: nanoid(8), title: "Opção 2" },
				{ id: nanoid(8), title: "Opção 3" },
				{ id: nanoid(8), title: "Opção 4" },
			],
		},
	};
}

// Export definition
export const listClientDefinition: NodeClientDefinition<ListNode> = {
	component: ListNodeView,
	panelComponent: ListNodePanel,
	create: createListNode,
	meta: {
		label: "Lista",
		icon: List,
		description: "Envia lista com até 10 opções",
	},
};
