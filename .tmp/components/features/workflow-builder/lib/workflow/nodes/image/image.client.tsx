"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { ImageIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { ImageNode as ImageNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/image/image.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ImageNodeProps extends NodeProps<ImageNodeType> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

export const ImageNode = memo(function ImageNode({ id, selected, data }: ImageNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasImage = !!data.imageUrl?.trim();

	return (
		<BaseNode
			selected={selected}
			category="media"
			icon={<ImageIcon className="w-4 h-4" />}
			title={data.label || "Imagem"}
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

			{hasImage ? (
				<div className="space-y-1">
					<div className="w-full h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
						<img
							src={data.imageUrl}
							alt="Preview"
							className="max-w-full max-h-full object-contain"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = 'none';
							}}
						/>
					</div>
					{data.caption && (
						<p className="text-xs text-muted-foreground line-clamp-1">
							{data.caption}
						</p>
					)}
				</div>
			) : (
				<p className="text-xs text-muted-foreground/50 italic">
					Sem imagem
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

export function ImageNodePanel({ node }: { node: ImageNodeType }) {
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
							nodeType: "image",
							data: { label: e.target.value },
						})
					}
					placeholder="Imagem do produto"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="imageUrl">URL da Imagem</Label>
				<Input
					id="imageUrl"
					type="url"
					value={node.data.imageUrl || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "image",
							data: { imageUrl: e.target.value },
						})
					}
					placeholder="https://exemplo.com/imagem.jpg"
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Formatos suportados: JPEG, PNG (máx 5MB)
				</p>
			</div>

			<div>
				<Label htmlFor="caption">Legenda (opcional)</Label>
				<Textarea
					id="caption"
					value={node.data.caption || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "image",
							data: { caption: e.target.value },
						})
					}
					placeholder="Descrição da imagem..."
					className="mt-1"
				/>
			</div>
		</div>
	);
}

export function createImageNode(position: {
	x: number;
	y: number;
}): ImageNodeType {
	return {
		id: nanoid(),
		type: "image",
		position,
		data: {
			label: "Imagem",
			imageUrl: "",
			caption: "",
		},
	};
}

export const imageClientDefinition: NodeClientDefinition<ImageNodeType> = {
	component: ImageNode,
	panelComponent: ImageNodePanel,
	create: createImageNode,
	meta: {
		label: "Imagem",
		icon: ImageIcon,
		description: "Envia uma imagem",
	},
};
