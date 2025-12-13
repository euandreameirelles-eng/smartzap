"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { MapPin } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { LocationNode as LocationNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/location/location.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LocationNodeProps extends NodeProps<LocationNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const LocationNode = memo(function LocationNode({ id, selected, data }: LocationNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasLocation = data.latitude !== undefined && data.longitude !== undefined;

	return (
		<BaseNode
			selected={selected}
			category="media"
			icon={<MapPin className="w-4 h-4" />}
			title={data.label || "Localização"}
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
				{hasLocation ? (
					<div className="space-y-1">
						<div className="w-full h-12 bg-muted rounded flex items-center justify-center gap-2">
							<MapPin className="w-4 h-4 text-green-500" />
							<div className="text-xs">
								<p className="text-muted-foreground font-medium truncate max-w-[120px]">
									{data.name || "Local"}
								</p>
								<p className="text-muted-foreground/70">
									{data.latitude?.toFixed(4)}, {data.longitude?.toFixed(4)}
								</p>
							</div>
						</div>
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Sem localização
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

export function LocationNodePanel({ node }: { node: LocationNodeType }) {
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
							nodeType: "location",
							data: { label: e.target.value },
						})
					}
					placeholder="Endereço da loja"
					className="mt-1"
				/>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<div>
					<Label htmlFor="latitude">Latitude</Label>
					<Input
						id="latitude"
						type="number"
						step="0.000001"
						value={node.data.latitude ?? ""}
						onChange={(e) =>
							updateNode({
								id: node.id,
								nodeType: "location",
								data: { latitude: parseFloat(e.target.value) || undefined },
							})
						}
						placeholder="-23.5505"
						className="mt-1"
					/>
				</div>
				<div>
					<Label htmlFor="longitude">Longitude</Label>
					<Input
						id="longitude"
						type="number"
						step="0.000001"
						value={node.data.longitude ?? ""}
						onChange={(e) =>
							updateNode({
								id: node.id,
								nodeType: "location",
								data: { longitude: parseFloat(e.target.value) || undefined },
							})
						}
						placeholder="-46.6333"
						className="mt-1"
					/>
				</div>
			</div>

			<div>
				<Label htmlFor="name">Nome do Local</Label>
				<Input
					id="name"
					value={node.data.name || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "location",
							data: { name: e.target.value },
						})
					}
					placeholder="Loja Centro"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="address">Endereço</Label>
				<Input
					id="address"
					value={node.data.address || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "location",
							data: { address: e.target.value },
						})
					}
					placeholder="Av. Paulista, 1000 - São Paulo"
					className="mt-1"
				/>
			</div>
		</div>
	);
}

export function createLocationNode(position: {
	x: number;
	y: number;
}): LocationNodeType {
	return {
		id: nanoid(),
		type: "location",
		position,
		data: {
			label: "Localização",
		},
	};
}

export const locationClientDefinition: NodeClientDefinition<LocationNodeType> = {
	component: LocationNode,
	panelComponent: LocationNodePanel,
	create: createLocationNode,
	meta: {
		label: "Localização",
		icon: MapPin,
		description: "Envia uma localização no mapa",
	},
};
