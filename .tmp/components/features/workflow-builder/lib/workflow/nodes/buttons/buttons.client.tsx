"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { MousePointer2, Plus, Trash2 } from "lucide-react";
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
import type { ButtonsNode, ButtonOption } from "./buttons.shared";

export interface ButtonsNodeProps extends NodeProps<ButtonsNode> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

function ButtonsNodeComponent({ id, selected, data }: ButtonsNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	return (
		<BaseNode
			selected={selected}
			category="message"
			icon={<MousePointer2 className="w-4 h-4" />}
			title="Botões"
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
				<div className="flex flex-wrap gap-1">
					{(data.buttons || []).map((btn, i) => (
						<span
							key={btn.id}
							className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30"
						>
							{btn.title}
						</span>
					))}
				</div>
			</div>

			{/* Handle para cada botão */}
			{(data.buttons || []).map((btn, index) => (
				<BaseHandle
					key={btn.id}
					id={`button_${btn.id}`}
					type="source"
					position={Position.Right}
					style={{ top: `${50 + index * 20}%` }}
					isConnectable={canConnectHandle({
						nodeId: id,
						handleId: `button_${btn.id}`,
						type: "source",
					})}
				/>
			))}
		</BaseNode>
	);
}

export const ButtonsNodeView = memo(ButtonsNodeComponent);

// Panel de configuração
export function ButtonsNodePanel({ node }: { node: ButtonsNode }) {
	const updateNode = useWorkflow((store) => store.updateNode);

	function addButton() {
		if ((node.data.buttons || []).length >= 3) return;
		const newButtons = [
			...(node.data.buttons || []),
			{ id: nanoid(8), title: `Opção ${(node.data.buttons || []).length + 1}` },
		];
		updateNode({
			id: node.id,
			nodeType: "buttons",
			data: { buttons: newButtons },
		});
	}

	function removeButton(index: number) {
		const newButtons = [...(node.data.buttons || [])];
		newButtons.splice(index, 1);
		updateNode({
			id: node.id,
			nodeType: "buttons",
			data: { buttons: newButtons },
		});
	}

	function updateButton(index: number, title: string) {
		const newButtons = [...(node.data.buttons || [])];
		newButtons[index] = { ...newButtons[index], title };
		updateNode({
			id: node.id,
			nodeType: "buttons",
			data: { buttons: newButtons },
		});
	}

	return (
		<div className="space-y-4">
			<div>
				<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
					<MousePointer2 className="w-4 h-4 text-blue-400" />
					Botões de Resposta Rápida
				</h4>
				<p className="text-xs text-zinc-500 mb-3">
					Envia até 3 botões clicáveis. Cada botão pode ter até 20 caracteres.
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
							nodeType: "buttons",
							data: { body: e.target.value },
						})
					}
					placeholder="Escolha uma opção abaixo:"
					className="min-h-[80px] text-sm bg-zinc-900 border-zinc-700"
				/>
			</div>

			{/* Botões */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-xs">Botões ({(node.data.buttons || []).length}/3)</Label>
					<Button
						variant="ghost"
						size="sm"
						onClick={addButton}
						disabled={(node.data.buttons || []).length >= 3}
						className="h-6 text-xs"
					>
						<Plus className="w-3 h-3 mr-1" />
						Adicionar
					</Button>
				</div>

				<div className="space-y-2">
					{(node.data.buttons || []).map((btn: ButtonOption, index: number) => (
						<div key={btn.id} className="flex items-center gap-2">
							<span className="text-xs text-zinc-500 w-4">{index + 1}.</span>
							<Input
								value={btn.title}
								onChange={(e) => updateButton(index, e.target.value)}
								maxLength={20}
								placeholder="Texto do botão"
								className="flex-1 h-8 text-xs bg-zinc-900 border-zinc-700"
							/>
							<span className="text-[10px] text-zinc-500 w-8">
								{btn.title.length}/20
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeButton(index)}
								className="h-6 w-6 text-zinc-500 hover:text-red-400"
								disabled={(node.data.buttons || []).length <= 1}
							>
								<Trash2 className="w-3 h-3" />
							</Button>
						</div>
					))}
				</div>
			</div>

			{/* Footer opcional */}
			<div className="space-y-2">
				<Label className="text-xs">Rodapé (opcional)</Label>
				<Input
					value={node.data.footer || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "buttons",
							data: { footer: e.target.value },
						})
					}
					maxLength={60}
					placeholder="Texto do rodapé"
					className="h-8 text-xs bg-zinc-900 border-zinc-700"
				/>
				<span className="text-[10px] text-zinc-500">
					{(node.data.footer || "").length}/60
				</span>
			</div>

			{/* Dica */}
			<div className="text-[10px] text-zinc-500 p-2 bg-zinc-900/50 rounded border border-zinc-800">
				💡 Cada botão cria uma saída separada no fluxo. Conecte cada saída ao próximo passo correspondente.
			</div>
		</div>
	);
}

// Factory function
export function createButtonsNode(position: { x: number; y: number }): ButtonsNode {
	return {
		id: nanoid(),
		type: "buttons",
		position,
		data: {
			body: "",
			buttons: [
				{ id: nanoid(8), title: "Sim" },
				{ id: nanoid(8), title: "Não" },
			],
		},
	};
}

// Export definition
export const buttonsClientDefinition: NodeClientDefinition<ButtonsNode> = {
	component: ButtonsNodeView,
	panelComponent: ButtonsNodePanel,
	create: createButtonsNode,
	meta: {
		label: "Botões",
		icon: MousePointer2,
		description: "Envia até 3 botões de resposta",
	},
};
