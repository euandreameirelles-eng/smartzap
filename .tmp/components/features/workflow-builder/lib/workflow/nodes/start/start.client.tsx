"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { Play, Plus, X } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { StartNode as StartNodeType, TriggerType } from "@/components/features/workflow-builder/lib/workflow/nodes/start/start.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface StartNodeProps extends NodeProps<StartNodeType> { }

// Map data.status to BaseNode status prop
const getNodeStatus = (status?: string) => {
	switch (status) {
		case "processing": return "running";
		case "success": return "success";
		case "error": return "error";
		default: return undefined;
	}
};

export const StartNode = memo(function StartNode({ id, selected, data }: StartNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	const isHandleConnectable = canConnectHandle({
		nodeId: id,
		handleId: "output",
		type: "source",
	});

	// Resumo do gatilho para exibir no nó
	const getTriggerSummary = () => {
		const trigger = data.trigger;
		if (!trigger) return "Qualquer mensagem";

		switch (trigger.type) {
			case "any_message":
				return "Qualquer mensagem";
			case "keyword":
				return trigger.keywords?.length
					? `Palavras: ${trigger.keywords.slice(0, 2).join(", ")}${trigger.keywords.length > 2 ? '...' : ''}`
					: "Configurar palavras-chave";
			case "starts_with":
				return trigger.keywords?.length
					? `Começa com: ${trigger.keywords[0]}${trigger.keywords.length > 1 ? '...' : ''}`
					: "Configurar prefixo";
			case "contains":
				return trigger.keywords?.length
					? `Contém: ${trigger.keywords[0]}${trigger.keywords.length > 1 ? '...' : ''}`
					: "Configurar termo";
			case "regex":
				return trigger.pattern ? `Regex: ${trigger.pattern.slice(0, 15)}...` : "Configurar regex";
			default:
				return "Configurar gatilho";
		}
	};

	return (
		<BaseNode
			selected={selected}
			category="trigger"
			icon={<Play className="w-4 h-4" />}
			title="Start"
			status={getNodeStatus(data.status)}
			className="min-w-[180px]"
		>
			{/* Preview do gatilho */}
			<p className="text-xs text-muted-foreground truncate">
				{getTriggerSummary()}
			</p>

			<BaseHandle
				id="output"
				type="source"
				position={Position.Right}
				isConnectable={isHandleConnectable}
			/>
		</BaseNode>
	);
});

const TRIGGER_OPTIONS: { value: TriggerType; label: string; description: string }[] = [
	{ value: "any_message", label: "Qualquer mensagem", description: "O fluxo inicia com qualquer mensagem recebida" },
	{ value: "keyword", label: "Palavra-chave exata", description: "Mensagem deve ser exatamente igual a uma das palavras" },
	{ value: "starts_with", label: "Começa com", description: "Mensagem deve começar com uma das palavras" },
	{ value: "contains", label: "Contém", description: "Mensagem deve conter uma das palavras" },
	{ value: "regex", label: "Expressão Regular", description: "Mensagem deve corresponder ao padrão regex" },
];

export function StartNodePanel({ node }: { node: StartNodeType }) {
	const updateNode = useWorkflow((store) => store.updateNode);

	const trigger = node.data.trigger || { type: "any_message" as TriggerType, keywords: [], caseSensitive: false };
	const keywords = trigger.keywords || [];

	const updateTrigger = (updates: Partial<typeof trigger>) => {
		updateNode({
			id: node.id,
			nodeType: "start",
			data: {
				trigger: { ...trigger, ...updates }
			},
		});
	};

	const addKeyword = () => {
		updateTrigger({ keywords: [...keywords, ""] });
	};

	const updateKeyword = (index: number, value: string) => {
		const newKeywords = [...keywords];
		newKeywords[index] = value;
		updateTrigger({ keywords: newKeywords });
	};

	const removeKeyword = (index: number) => {
		updateTrigger({ keywords: keywords.filter((_, i) => i !== index) });
	};

	return (
		<div className="space-y-4">
			{/* Tipo de Gatilho */}
			<div>
				<Label>Tipo de Gatilho</Label>
				<Select
					value={trigger.type}
					onValueChange={(value: TriggerType) => updateTrigger({ type: value })}
				>
					<SelectTrigger className="mt-1">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TRIGGER_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								<div className="flex flex-col">
									<span>{opt.label}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-xs text-muted-foreground mt-1">
					{TRIGGER_OPTIONS.find(o => o.value === trigger.type)?.description}
				</p>
			</div>

			{/* Palavras-chave (para keyword, starts_with, contains) */}
			{["keyword", "starts_with", "contains"].includes(trigger.type) && (
				<div>
					<div className="flex items-center justify-between mb-2">
						<Label>
							{trigger.type === "keyword" ? "Palavras-chave" :
								trigger.type === "starts_with" ? "Prefixos" : "Termos"}
						</Label>
						<Button
							variant="ghost"
							size="sm"
							onClick={addKeyword}
							className="h-6 px-2 text-xs"
						>
							<Plus className="w-3 h-3 mr-1" />
							Adicionar
						</Button>
					</div>

					<div className="space-y-2">
						{keywords.length === 0 ? (
							<p className="text-xs text-muted-foreground italic">
								Nenhuma palavra configurada. Clique em &quot;Adicionar&quot;.
							</p>
						) : (
							keywords.map((kw, index) => (
								<div key={index} className="flex items-center gap-2">
									<Input
										value={kw}
										onChange={(e) => updateKeyword(index, e.target.value)}
										placeholder={`Palavra ${index + 1}`}
										className="flex-1"
									/>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => removeKeyword(index)}
										className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
									>
										<X className="w-4 h-4" />
									</Button>
								</div>
							))
						)}
					</div>

					{keywords.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{keywords.filter(k => k.trim()).map((kw, i) => (
								<Badge key={i} variant="secondary" className="text-xs">
									{kw}
								</Badge>
							))}
						</div>
					)}
				</div>
			)}

			{/* Regex pattern */}
			{trigger.type === "regex" && (
				<div>
					<Label htmlFor="pattern">Padrão Regex</Label>
					<Input
						id="pattern"
						value={trigger.pattern || ""}
						onChange={(e) => updateTrigger({ pattern: e.target.value })}
						placeholder="^(oi|olá|hey)$"
						className="mt-1 font-mono text-sm"
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Expressão regular para corresponder à mensagem
					</p>
				</div>
			)}

			{/* Case sensitive */}
			{trigger.type !== "any_message" && (
				<div className="flex items-center justify-between">
					<Label htmlFor="caseSensitive" className="text-sm">
						Diferenciar maiúsculas/minúsculas
					</Label>
					<input
						id="caseSensitive"
						type="checkbox"
						checked={trigger.caseSensitive || false}
						onChange={(e) => updateTrigger({ caseSensitive: e.target.checked })}
						className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-primary-500"
					/>
				</div>
			)}
		</div>
	);
}

export function createStartNode(position: {
	x: number;
	y: number;
}): StartNodeType {
	return {
		id: nanoid(),
		type: "start",
		position,
		deletable: false,
		data: {
			sourceType: { type: "text" },
			trigger: {
				type: "any_message",
				keywords: [],
				caseSensitive: false,
			},
		},
	};
}

export const startClientDefinition: NodeClientDefinition<StartNodeType> = {
	component: StartNode,
	panelComponent: StartNodePanel,
	create: createStartNode,
	meta: {
		label: "Start",
		icon: Play,
		description: "Ponto de entrada do fluxo",
	},
};
