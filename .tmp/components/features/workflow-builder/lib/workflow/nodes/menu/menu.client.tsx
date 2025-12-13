"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { List, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { MenuNode as MenuNodeType, MenuOption } from "@/components/features/workflow-builder/lib/workflow/nodes/menu/menu.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface MenuNodeProps extends NodeProps<MenuNodeType> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

export const MenuNode = memo(function MenuNode({ id, selected, data }: MenuNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const options = data.options || [];

	return (
		<BaseNode
			selected={selected}
			category="message"
			icon={<List className="w-4 h-4" />}
			title={data.label || "Menu"}
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

			{/* Preview */}
			<div className="space-y-1">
				{data.text && (
					<p className="text-xs text-muted-foreground line-clamp-1">
						{data.text}
					</p>
				)}
				{options.length > 0 ? (
					<div className="space-y-1">
						{options.slice(0, 3).map((opt) => (
							<div
								key={opt.id}
								className="text-xs bg-emerald-500/10 rounded px-2 py-1 text-emerald-300"
							>
								{opt.label}
							</div>
						))}
						{options.length > 3 && (
							<p className="text-xs text-emerald-400">
								+{options.length - 3} mais
							</p>
						)}
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Nenhuma opção
					</p>
				)}
			</div>

			{/* Output handles for each option */}
			{options.map((opt, i) => (
				<BaseHandle
					key={opt.id}
					id={opt.id}
					type="source"
					position={Position.Right}
					isConnectable={canConnectHandle({
						nodeId: id,
						handleId: opt.id,
						type: "source",
					})}
					style={{ top: `${((i + 1) / (options.length + 1)) * 100}%` }}
				/>
			))}

			{options.length === 0 && (
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
			)}
		</BaseNode>
	);
});

export function MenuNodePanel({ node }: { node: MenuNodeType }) {
	const updateNode = useWorkflow((store) => store.updateNode);
	const options = node.data.options || [];

	const addOption = () => {
		const newOption: MenuOption = {
			id: nanoid(8),
			label: `Opção ${options.length + 1}`,
		};
		updateNode({
			id: node.id,
			nodeType: "menu",
			data: { options: [...options, newOption] },
		});
	};

	const updateOption = (optionId: string, label: string) => {
		const updated = options.map((opt) =>
			opt.id === optionId ? { ...opt, label } : opt
		);
		updateNode({
			id: node.id,
			nodeType: "menu",
			data: { options: updated },
		});
	};

	const removeOption = (optionId: string) => {
		const updated = options.filter((opt) => opt.id !== optionId);
		updateNode({
			id: node.id,
			nodeType: "menu",
			data: { options: updated },
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
							nodeType: "menu",
							data: { label: e.target.value },
						})
					}
					placeholder="Menu Principal"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="text">Texto do Menu</Label>
				<Textarea
					id="text"
					value={node.data.text || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "menu",
							data: { text: e.target.value },
						})
					}
					placeholder="Escolha uma opção:"
					className="mt-1"
				/>
			</div>

			<div>
				<div className="flex items-center justify-between mb-2">
					<Label>Opções</Label>
					<Button
						variant="outline"
						size="sm"
						onClick={addOption}
						className="h-7"
					>
						<Plus className="w-3 h-3 mr-1" />
						Adicionar
					</Button>
				</div>
				<div className="space-y-2">
					{options.map((opt) => (
						<div key={opt.id} className="flex items-center gap-2">
							<Input
								value={opt.label}
								onChange={(e) => updateOption(opt.id, e.target.value)}
								placeholder="Label da opção"
								className="flex-1"
							/>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeOption(opt.id)}
								className="h-8 w-8 text-red-400 hover:text-red-500"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function createMenuNode(position: {
	x: number;
	y: number;
}): MenuNodeType {
	return {
		id: nanoid(),
		type: "menu",
		position,
		data: {
			label: "Menu",
			text: "Escolha uma opção:",
			options: [
				{ id: nanoid(8), label: "Opção 1" },
				{ id: nanoid(8), label: "Opção 2" },
			],
		},
	};
}

export const menuClientDefinition: NodeClientDefinition<MenuNodeType> = {
	component: MenuNode,
	panelComponent: MenuNodePanel,
	create: createMenuNode,
	meta: {
		label: "Menu",
		icon: List,
		description: "Exibe opções para o usuário escolher",
	},
};
