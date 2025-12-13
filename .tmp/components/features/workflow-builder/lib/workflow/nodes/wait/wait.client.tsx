"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Clock } from "lucide-react";
import { memo } from "react";
import { nanoid } from "nanoid";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { WaitNode as WaitNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/wait/wait.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";

export interface WaitNodeProps extends NodeProps<WaitNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

function WaitNodeComponent({ selected, data, id }: WaitNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	const isSourceConnectable = canConnectHandle({
		nodeId: id,
		handleId: "output",
		type: "source",
	});
	const isTargetConnectable = canConnectHandle({
		nodeId: id,
		handleId: "input",
		type: "target",
	});

	return (
		<BaseNode
			selected={selected}
			category="flow"
			icon={<Clock className="w-4 h-4" />}
			title="Wait"
			status={statusMap[data.status || "idle"]}
		>
			<div className="text-left text text-muted-foreground px-1 mt-1 max-w-[200px] truncate">
				{data.duration} {data.unit}
			</div>

			<BaseHandle
				id="input"
				type="target"
				position={Position.Left}
				isConnectable={isTargetConnectable}
			/>

			<BaseHandle
				id="output"
				type="source"
				position={Position.Right}
				isConnectable={isSourceConnectable}
			/>
		</BaseNode>
	);
}

export const WaitNode = memo(WaitNodeComponent);

export function WaitNodePanel({ node }: { node: WaitNodeType }) {
	const updateNode = useWorkflow((state) => state.updateNode);

	return (
		<div className="space-y-4">
			<div>
				<h4 className="font-medium text-sm mb-2">Configuration</h4>
				<div className="space-y-3">
					<div>
						<label
							htmlFor={`duration-${node.id}`}
							className="block text-xs font-medium mb-1"
						>
							Duration
						</label>
						<Input
							id={`duration-${node.id}`}
							type="number"
							min="1"
							max={
								node.data.unit === "hours"
									? "24"
									: node.data.unit === "minutes"
										? "60"
										: "3600"
							}
							value={node.data.duration}
							onChange={(e) => {
								const value = Number.parseInt(
									e.target.value,
									10,
								);
								if (!Number.isNaN(value) && value >= 1) {
									updateNode({
										id: node.id,
										nodeType: "wait",
										data: {
											duration: value,
										},
									});
								}
							}}
							placeholder="Enter duration..."
							className="text-xs"
						/>
					</div>
					<div>
						<label
							htmlFor={`unit-${node.id}`}
							className="block text-xs font-medium mb-1"
						>
							Unit
						</label>
						<Select
							value={node.data.unit}
							onValueChange={(
								value: "seconds" | "minutes" | "hours",
							) => {
								updateNode({
									id: node.id,
									nodeType: "wait",
									data: {
										unit: value,
									},
								});
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select unit" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="seconds">Seconds</SelectItem>
								<SelectItem value="minutes">Minutes</SelectItem>
								<SelectItem value="hours">Hours</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
			<div>
				<h4 className="font-medium text-sm mb-2">Description</h4>
				<p className="text-xs text-muted-foreground">
					The wait node pauses workflow execution for the specified
					duration before passing data to the next node.
				</p>
			</div>
		</div>
	);
}

export function createWaitNode(position: {
	x: number;
	y: number;
}): WaitNodeType {
	return {
		id: nanoid(),
		type: "wait",
		position,
		data: {
			status: "idle",
			duration: 5,
			unit: "seconds",
		},
	};
}

export const waitClientDefinition: NodeClientDefinition<WaitNodeType> = {
	component: WaitNode,
	panelComponent: WaitNodePanel,
	create: createWaitNode,
	meta: {
		label: "Wait",
		icon: Clock,
		description: "Pause workflow execution for a specified duration",
	},
};
