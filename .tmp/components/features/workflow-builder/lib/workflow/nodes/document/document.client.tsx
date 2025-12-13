"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { FileText } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { DocumentNode as DocumentNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/document/document.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface DocumentNodeProps extends NodeProps<DocumentNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const DocumentNode = memo(function DocumentNode({ id, selected, data }: DocumentNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasDocument = !!data.documentUrl?.trim();

	return (
		<BaseNode
			selected={selected}
			category="media"
			icon={<FileText className="w-4 h-4" />}
			title={data.label || "Documento"}
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
				{hasDocument ? (
					<div className="space-y-1">
						<div className="w-full h-10 bg-muted rounded flex items-center justify-center gap-2">
							<FileText className="w-4 h-4 text-muted-foreground" />
							<span className="text-xs text-muted-foreground truncate max-w-[120px]">
								{data.filename || "documento.pdf"}
							</span>
						</div>
						{data.caption && (
							<p className="text-xs text-muted-foreground line-clamp-1">
								{data.caption}
							</p>
						)}
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Sem documento
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

export function DocumentNodePanel({ node }: { node: DocumentNodeType }) {
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
							nodeType: "document",
							data: { label: e.target.value },
						})
					}
					placeholder="Enviar contrato"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="documentUrl">URL do Documento</Label>
				<Input
					id="documentUrl"
					type="url"
					value={node.data.documentUrl || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "document",
							data: { documentUrl: e.target.value },
						})
					}
					placeholder="https://exemplo.com/documento.pdf"
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Formatos: PDF, DOC, DOCX, PPT, XLS, etc. (máx 100MB)
				</p>
			</div>

			<div>
				<Label htmlFor="filename">Nome do Arquivo</Label>
				<Input
					id="filename"
					value={node.data.filename || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "document",
							data: { filename: e.target.value },
						})
					}
					placeholder="contrato.pdf"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="caption">Legenda (opcional)</Label>
				<Textarea
					id="caption"
					value={node.data.caption || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "document",
							data: { caption: e.target.value },
						})
					}
					placeholder="Segue o documento solicitado..."
					className="mt-1"
				/>
			</div>
		</div>
	);
}

export function createDocumentNode(position: {
	x: number;
	y: number;
}): DocumentNodeType {
	return {
		id: nanoid(),
		type: "document",
		position,
		data: {
			label: "Documento",
			documentUrl: "",
			filename: "",
			caption: "",
		},
	};
}

export const documentClientDefinition: NodeClientDefinition<DocumentNodeType> = {
	component: DocumentNode,
	panelComponent: DocumentNodePanel,
	create: createDocumentNode,
	meta: {
		label: "Documento",
		icon: FileText,
		description: "Envia um documento (PDF, DOC, etc)",
	},
};
