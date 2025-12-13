"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Timer } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { DelayNode as DelayNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/delay/delay.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DelayNodeProps extends NodeProps<DelayNodeType> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

export const DelayNode = memo(function DelayNode({ id, selected, data }: DelayNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasDelay = !!data.delaySeconds;

	const getDelayText = () => {
		if (!data.delaySeconds) return "Sem delay";
		const type = data.delayType || "seconds";
		const unit = type === "seconds" ? "seg" : type === "minutes" ? "min" : "h";
		return `${data.delaySeconds} ${unit}`;
	};

	return (
		<BaseNode
			selected={selected}
			category="flow"
			icon={<Timer className="w-4 h-4" />}
			title={data.label || "Delay"}
			status={getNodeStatus(data.status)}
			className="min-w-[160px]"
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

			<p className="text-sm font-medium text-muted-foreground text-center">
				{getDelayText()}
			</p>

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

export function DelayNodePanel({ node }: { node: DelayNodeType }) {
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
							nodeType: "delay",
							data: { label: e.target.value },
						})
					}
					placeholder="Aguardar"
					className="mt-1"
				/>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label htmlFor="delaySeconds">Tempo</Label>
					<Input
						id="delaySeconds"
						type="number"
						min={1}
						value={node.data.delaySeconds || ""}
						onChange={(e) =>
							updateNode({
								id: node.id,
								nodeType: "delay",
								data: { delaySeconds: parseInt(e.target.value) || undefined },
							})
						}
						placeholder="5"
						className="mt-1"
					/>
				</div>
				<div>
					<Label htmlFor="delayType">Unidade</Label>
					<Select
						value={node.data.delayType || "seconds"}
						onValueChange={(value: "seconds" | "minutes" | "hours") =>
							updateNode({
								id: node.id,
								nodeType: "delay",
								data: { delayType: value },
							})
						}
					>
						<SelectTrigger className="mt-1">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="seconds">Segundos</SelectItem>
							<SelectItem value="minutes">Minutos</SelectItem>
							<SelectItem value="hours">Horas</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<p className="text-xs text-muted-foreground">
				O fluxo irá pausar pelo tempo especificado antes de continuar.
			</p>
		</div>
	);
}

export function createDelayNode(position: {
	x: number;
	y: number;
}): DelayNodeType {
	return {
		id: nanoid(),
		type: "delay",
		position,
		data: {
			label: "Delay",
			delaySeconds: 5,
			delayType: "seconds",
		},
	};
}

export const delayClientDefinition: NodeClientDefinition<DelayNodeType> = {
	component: DelayNode,
	panelComponent: DelayNodePanel,
	create: createDelayNode,
	meta: {
		label: "Delay",
		icon: Timer,
		description: "Aguarda um tempo antes de continuar",
	},
};
