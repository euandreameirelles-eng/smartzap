"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Square } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { EndNode as EndNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/end/end.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";

export interface EndNodeProps extends NodeProps<EndNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const EndNode = memo(function EndNode({ selected, data, id }: EndNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	const isTargetConnectable = canConnectHandle({
		nodeId: id,
		handleId: "input",
		type: "target",
	});

	return (
		<BaseNode
			selected={selected}
			category="flow"
			icon={<Square className="w-4 h-4" />}
			title="End"
			status={statusMap[data.status || "idle"]}
		>
			<BaseHandle
				id="input"
				type="target"
				position={Position.Left}
				isConnectable={isTargetConnectable}
			/>
		</BaseNode>
	);
});

export function EndNodePanel({ node: _node }: { node: EndNodeType }) {
	return (
		<div className="space-y-4">
			<div>
				<h4 className="font-medium text-sm mb-2">End Node</h4>
				<p className="text-xs text-gray-600">
					This node terminates the workflow execution.
				</p>
			</div>
		</div>
	);
}

export function createEndNode(position: { x: number; y: number }): EndNodeType {
	return {
		id: nanoid(),
		type: "end",
		position,
		data: {},
	};
}

export const endClientDefinition: NodeClientDefinition<EndNodeType> = {
	component: EndNode,
	panelComponent: EndNodePanel,
	create: createEndNode,
	meta: {
		label: "End",
		icon: Square,
		description: "Terminates the workflow execution",
	},
};
