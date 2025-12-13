"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Music } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { AudioNode as AudioNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/audio/audio.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AudioNodeProps extends NodeProps<AudioNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const AudioNode = memo(function AudioNode({ id, selected, data }: AudioNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasAudio = !!data.audioUrl?.trim();

	return (
		<BaseNode
			selected={selected}
			category="media"
			icon={<Music className="w-4 h-4" />}
			title={data.label || "Áudio"}
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
				{hasAudio ? (
					<div className="w-full h-10 bg-muted rounded flex items-center justify-center gap-2">
						<Music className="w-4 h-4 text-muted-foreground" />
						<span className="text-xs text-muted-foreground">Áudio configurado</span>
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Sem áudio
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

export function AudioNodePanel({ node }: { node: AudioNodeType }) {
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
							nodeType: "audio",
							data: { label: e.target.value },
						})
					}
					placeholder="Mensagem de voz"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="audioUrl">URL do Áudio</Label>
				<Input
					id="audioUrl"
					type="url"
					value={node.data.audioUrl || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "audio",
							data: { audioUrl: e.target.value },
						})
					}
					placeholder="https://exemplo.com/audio.mp3"
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Formatos suportados: AAC, MP4, AMR, MP3, OGG (máx 16MB)
				</p>
			</div>
		</div>
	);
}

export function createAudioNode(position: {
	x: number;
	y: number;
}): AudioNodeType {
	return {
		id: nanoid(),
		type: "audio",
		position,
		data: {
			label: "Áudio",
			audioUrl: "",
		},
	};
}

export const audioClientDefinition: NodeClientDefinition<AudioNodeType> = {
	component: AudioNode,
	panelComponent: AudioNodePanel,
	create: createAudioNode,
	meta: {
		label: "Áudio",
		icon: Music,
		description: "Envia um áudio ou mensagem de voz",
	},
};
