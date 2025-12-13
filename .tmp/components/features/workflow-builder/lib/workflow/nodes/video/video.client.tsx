"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Video } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { VideoNode as VideoNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/video/video.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface VideoNodeProps extends NodeProps<VideoNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const VideoNode = memo(function VideoNode({ id, selected, data }: VideoNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasVideo = !!data.videoUrl?.trim();

	return (
		<BaseNode
			selected={selected}
			category="media"
			icon={<Video className="w-4 h-4" />}
			title={data.label || "Vídeo"}
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
				{hasVideo ? (
					<div className="space-y-1">
						<div className="w-full h-16 bg-muted rounded flex items-center justify-center">
							<Video className="w-8 h-8 text-muted-foreground" />
						</div>
						{data.caption && (
							<p className="text-xs text-muted-foreground line-clamp-1">
								{data.caption}
							</p>
						)}
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Sem vídeo
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

export function VideoNodePanel({ node }: { node: VideoNodeType }) {
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
							nodeType: "video",
							data: { label: e.target.value },
						})
					}
					placeholder="Vídeo tutorial"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="videoUrl">URL do Vídeo</Label>
				<Input
					id="videoUrl"
					type="url"
					value={node.data.videoUrl || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "video",
							data: { videoUrl: e.target.value },
						})
					}
					placeholder="https://exemplo.com/video.mp4"
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Formatos suportados: MP4, 3GPP (máx 16MB)
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
							nodeType: "video",
							data: { caption: e.target.value },
						})
					}
					placeholder="Descrição do vídeo..."
					className="mt-1"
				/>
			</div>
		</div>
	);
}

export function createVideoNode(position: {
	x: number;
	y: number;
}): VideoNodeType {
	return {
		id: nanoid(),
		type: "video",
		position,
		data: {
			label: "Vídeo",
			videoUrl: "",
			caption: "",
		},
	};
}

export const videoClientDefinition: NodeClientDefinition<VideoNodeType> = {
	component: VideoNode,
	panelComponent: VideoNodePanel,
	create: createVideoNode,
	meta: {
		label: "Vídeo",
		icon: Video,
		description: "Envia um vídeo",
	},
};
