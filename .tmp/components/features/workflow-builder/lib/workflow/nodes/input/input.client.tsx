"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { FormInput } from "lucide-react";
import { nanoid } from "nanoid";
import { memo } from "react";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { InputNode as InputNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/input/input.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface InputNodeProps extends NodeProps<InputNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

export const InputNode = memo(function InputNode({ id, selected, data }: InputNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	return (
		<BaseNode
			selected={selected}
			category="flow"
			icon={<FormInput className="w-4 h-4" />}
			title={data.label || "Coleta"}
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

			{/* Preview */}
			<div className="mt-2 px-1 space-y-1">
				{data.question ? (
					<p className="text-xs text-muted-foreground line-clamp-2">
						{data.question}
					</p>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Sem pergunta
					</p>
				)}
				{data.variableName && (
					<p className="text-xs text-amber-400">
						→ {`{{${data.variableName}}}`}
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

export function InputNodePanel({ node }: { node: InputNodeType }) {
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
							nodeType: "input",
							data: { label: e.target.value },
						})
					}
					placeholder="Coleta de Nome"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="question">Pergunta</Label>
				<Textarea
					id="question"
					value={node.data.question || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "input",
							data: { question: e.target.value },
						})
					}
					placeholder="Qual é o seu nome?"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="variableName">Salvar em Variável</Label>
				<Input
					id="variableName"
					value={node.data.variableName || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "input",
							data: { variableName: e.target.value },
						})
					}
					placeholder="nome"
					className="mt-1"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Use {`{{${node.data.variableName || "nome"}}}`} para acessar depois
				</p>
			</div>

			<div>
				<Label htmlFor="inputType">Tipo de Entrada</Label>
				<Select
					value={node.data.inputType || "text"}
					onValueChange={(value) =>
						updateNode({
							id: node.id,
							nodeType: "input",
							data: { inputType: value as InputNodeType["data"]["inputType"] },
						})
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione o tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="text">Texto</SelectItem>
						<SelectItem value="number">Número</SelectItem>
						<SelectItem value="email">E-mail</SelectItem>
						<SelectItem value="phone">Telefone</SelectItem>
						<SelectItem value="date">Data</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

export function createInputNode(position: {
	x: number;
	y: number;
}): InputNodeType {
	return {
		id: nanoid(),
		type: "input",
		position,
		data: {
			label: "Coleta",
			question: "",
			variableName: "",
			inputType: "text",
		},
	};
}

export const inputClientDefinition: NodeClientDefinition<InputNodeType> = {
	component: InputNode,
	panelComponent: InputNodePanel,
	create: createInputNode,
	meta: {
		label: "Coleta",
		icon: FormInput,
		description: "Coleta resposta do usuário",
	},
};
