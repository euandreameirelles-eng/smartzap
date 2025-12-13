"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { ExternalLink } from "lucide-react";
import { memo } from "react";
import { nanoid } from "nanoid";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { CtaUrlNode as CtaUrlNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/cta-url/cta-url.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface CtaUrlNodeProps extends NodeProps<CtaUrlNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

function CtaUrlNodeComponent({ id, selected, data }: CtaUrlNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasContent = !!data.text?.trim() && !!data.url?.trim();

	return (
		<BaseNode
			selected={selected}
			category="message"
			icon={<ExternalLink className="w-4 h-4" />}
			title={data.label || "CTA URL"}
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

			<div className="mt-2 px-1 space-y-1">
				{hasContent ? (
					<>
						<p className="text-xs text-muted-foreground line-clamp-2">
							{data.text}
						</p>
						<div className="flex items-center gap-1 text-xs text-indigo-400">
							<ExternalLink className="w-3 h-3" />
							<span className="truncate max-w-[140px]">{data.buttonText}</span>
						</div>
					</>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Sem conteúdo
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
}

export const CtaUrlNode = memo(CtaUrlNodeComponent);

export function CtaUrlNodePanel({ node }: { node: CtaUrlNodeType }) {
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
							nodeType: "cta-url",
							data: { label: e.target.value },
						})
					}
					placeholder="Link para site"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="text">Texto da Mensagem</Label>
				<Textarea
					id="text"
					value={node.data.text || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "cta-url",
							data: { text: e.target.value },
						})
					}
					placeholder="Clique no botão abaixo para acessar nosso site"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="buttonText">Texto do Botão</Label>
				<Input
					id="buttonText"
					value={node.data.buttonText || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "cta-url",
							data: { buttonText: e.target.value },
						})
					}
					placeholder="Acessar Site"
					maxLength={25}
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Máximo 25 caracteres ({node.data.buttonText?.length || 0}/25)
				</p>
			</div>

			<div>
				<Label htmlFor="url">URL</Label>
				<Input
					id="url"
					type="url"
					value={node.data.url || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "cta-url",
							data: { url: e.target.value },
						})
					}
					placeholder="https://www.exemplo.com"
					className="mt-1"
				/>
			</div>
		</div>
	);
}

export function createCtaUrlNode(position: {
	x: number;
	y: number;
}): CtaUrlNodeType {
	return {
		id: nanoid(),
		type: "cta-url",
		position,
		data: {
			label: "CTA URL",
			text: "",
			buttonText: "",
			url: "",
		},
	};
}

export const ctaUrlClientDefinition: NodeClientDefinition<CtaUrlNodeType> = {
	component: CtaUrlNode,
	panelComponent: CtaUrlNodePanel,
	create: createCtaUrlNode,
	meta: {
		label: "CTA URL",
		icon: ExternalLink,
		description: "Mensagem com botão que abre um link",
	},
};
