"use client";

/**
 * NodeEditorPanel - Painel de edição do nó selecionado (Estilo Langflow)
 * 
 * Renderiza o panelComponent do nó selecionado com
 * acesso ao updateNode do store.
 */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import { getNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes";
import type { FlowNode, FlowNodeType } from "@/components/features/workflow-builder/types/workflow";

interface NodeEditorPanelProps {
	nodeId: string;
	onClose: () => void;
}

export function NodeEditorPanel({ nodeId, onClose }: NodeEditorPanelProps) {
	const { deleteNode, nodes } = useWorkflow();
	
	// Busca o nó atualizado do store (não da prop estática)
	const node = nodes.find(n => n.id === nodeId) as FlowNode | undefined;
	
	if (!node) {
		return null;
	}

	// Busca a definição do nó
	const definition = getNodeDefinition(node.type as FlowNodeType);
	if (!definition) {
		return null;
	}

	const { meta, panelComponent: PanelComponent } = definition.client;

	// Função de exclusão
	const handleDelete = () => {
		deleteNode(node.id);
		onClose();
	};

	return (
		<div
			className={cn(
				"w-80 max-h-[70vh]",
				"bg-zinc-900/95 backdrop-blur-sm",
				"border border-zinc-700 rounded-xl shadow-2xl",
				"flex flex-col overflow-hidden",
				// Classe noflow para o Langflow pattern
				"noflow"
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-zinc-700">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-primary-500/20">
						<meta.icon className="w-4 h-4 text-primary-400" />
					</div>
					<div>
						<h3 className="text-sm font-semibold text-zinc-100">
							{meta.label}
						</h3>
						<p className="text-xs text-zinc-500">{meta.description}</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Content - Panel Component do nó */}
			<ScrollArea className="flex-1 p-4">
				<PanelComponent node={node} />
			</ScrollArea>

			{/* Footer com ações */}
			{node.type !== "start" && (
				<div className="p-4 border-t border-zinc-700">
					<Button
						variant="ghost"
						onClick={handleDelete}
						className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
					>
						Excluir nó
					</Button>
				</div>
			)}
		</div>
	);
}
