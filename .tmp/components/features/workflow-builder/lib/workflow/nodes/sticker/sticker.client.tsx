"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Smile } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { StickerNode as StickerNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/sticker/sticker.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface StickerNodeProps extends NodeProps<StickerNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const StickerNode = memo(function StickerNode({ id, selected, data }: StickerNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasSticker = !!data.stickerUrl?.trim();

	return (
		<BaseNode
			selected={selected}
			category="media"
			icon={<Smile className="w-4 h-4" />}
			title={data.label || "Sticker"}
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
				{hasSticker ? (
					<div className="w-12 h-12 mx-auto bg-muted rounded flex items-center justify-center overflow-hidden">
						<img
							src={data.stickerUrl}
							alt="Sticker"
							className="max-w-full max-h-full object-contain"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = 'none';
							}}
						/>
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic text-center">
						Sem sticker
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

export function StickerNodePanel({ node }: { node: StickerNodeType }) {
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
							nodeType: "sticker",
							data: { label: e.target.value },
						})
					}
					placeholder="Sticker de agradecimento"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="stickerUrl">URL do Sticker</Label>
				<Input
					id="stickerUrl"
					type="url"
					value={node.data.stickerUrl || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "sticker",
							data: { stickerUrl: e.target.value },
						})
					}
					placeholder="https://exemplo.com/sticker.webp"
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Formato: WebP estático ou animado (máx 100KB estático, 500KB animado)
				</p>
			</div>
		</div>
	);
}

export function createStickerNode(position: {
	x: number;
	y: number;
}): StickerNodeType {
	return {
		id: nanoid(),
		type: "sticker",
		position,
		data: {
			label: "Sticker",
			stickerUrl: "",
		},
	};
}

export const stickerClientDefinition: NodeClientDefinition<StickerNodeType> = {
	component: StickerNode,
	panelComponent: StickerNodePanel,
	create: createStickerNode,
	meta: {
		label: "Sticker",
		icon: Smile,
		description: "Envia um sticker",
	},
};
