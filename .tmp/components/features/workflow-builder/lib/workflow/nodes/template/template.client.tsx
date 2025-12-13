"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { FileText, Check, AlertCircle, Loader2, Clock, Link2, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { nanoid } from "nanoid";
import { memo, useEffect, useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import {
	NodeHeader,
	NodeHeaderIcon,
	NodeHeaderTitle,
} from "@/components/features/workflow-builder/components/workflow/primitives/node-header";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import type { TemplateNode, TemplateVariable, TemplateButton } from "./template.shared";

// Interface para componentes do template
interface TemplateComponent {
	type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
	format?: string;
	text?: string;
	buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
}

// Interface para templates
interface Template {
	id: string;
	name: string;
	status: "APPROVED" | "PENDING" | "REJECTED";
	category: string;
	content: string;
	preview: string;
	language: string;
	components?: TemplateComponent[];
}

export interface TemplateNodeProps extends NodeProps<TemplateNode> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

// Ícone do botão baseado no tipo
function ButtonIcon({ type }: { type: string }) {
	switch (type) {
		case "URL":
			return <Link2 className="w-3 h-3 text-blue-400" />;
		case "PHONE_NUMBER":
			return <Phone className="w-3 h-3 text-green-400" />;
		case "QUICK_REPLY":
			return <MessageCircle className="w-3 h-3 text-purple-400" />;
		default:
			return <ExternalLink className="w-3 h-3 text-zinc-400" />;
	}
}

function TemplateNodeComponent({ id, selected, data }: TemplateNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);

	// Botões do template para renderizar handles dinâmicos
	const buttons = data.buttons || [];
	const hasButtons = buttons.length > 0;

	// Calcular altura do nó baseado nos botões
	// Cada botão tem ~28px de altura + espaçamento
	const buttonSectionHeight = hasButtons ? (buttons.length * 28) + 16 : 0;

	return (
		<BaseNode
			selected={selected}
			category="data"
			icon={<FileText className="w-4 h-4" />}
			title="Template"
			status={statusMap[data.status || "idle"]}
			className="min-w-[220px]"
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

			<div className="mt-2 text-xs text-zinc-400">
				{data.templateName ? (
					<div className="flex items-center gap-1.5">
						<span className="font-medium text-zinc-200 truncate max-w-[140px]">
							{data.templateName}
						</span>
						{data.templateStatus === "APPROVED" && (
							<Check className="w-3 h-3 text-green-400" />
						)}
						{data.templateStatus === "PENDING" && (
							<Clock className="w-3 h-3 text-yellow-400" />
						)}
						{data.templateStatus === "REJECTED" && (
							<AlertCircle className="w-3 h-3 text-red-400" />
						)}
					</div>
				) : (
					<span className="text-zinc-500 italic">Selecione um template</span>
				)}
			</div>

			{/* Seção de Botões com Handles Dinâmicos */}
			{hasButtons && (
				<div className="mt-3 pt-2 border-t border-zinc-700/50 space-y-1">
					{buttons.map((button) => (
						<div
							key={button.id}
							className="flex items-center gap-2 py-1 text-xs"
						>
							<ButtonIcon type={button.type} />
							<span className="text-zinc-300 truncate max-w-[140px]">
								{button.text}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Handles de saída para botões - posicionados fora do fluxo */}
			{hasButtons ? (
				buttons.map((button, index) => {
					// Cálculo da posição vertical para cada botão:
					// - Padding p-2: 8px
					// - NodeHeader: ~32px
					// - Template name section (mt-2 + conteúdo): ~28px
					// - Seção botões (mt-3 + pt-2): 20px
					// - Cada botão: 28px (py-1 + text + gap)
					// - Centro do botão: 14px (metade de 28px)
					const baseOffset = 8 + 32 + 28 + 20; // 88px até o primeiro botão
					const buttonHeight = 28;
					const buttonCenter = 14;
					const topPosition = baseOffset + (index * buttonHeight) + buttonCenter;

					return (
						<BaseHandle
							key={button.id}
							id={button.id}
							type="source"
							position={Position.Right}
							dynamic
							isConnectable={canConnectHandle({
								nodeId: id,
								handleId: button.id,
								type: "source",
							})}
							style={{
								top: `${topPosition}px`,
							}}
						/>
					);
				})
			) : (
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
			)}
		</BaseNode>
	);
}

export const TemplateNodeView = memo(TemplateNodeComponent);

// Panel de configuração
export function TemplateNodePanel({ node }: { node: TemplateNode }) {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
	const updateNode = useWorkflow((store) => store.updateNode);

	// Carregar templates da Meta
	useEffect(() => {
		async function loadTemplates() {
			try {
				const response = await fetch("/api/templates");
				if (response.ok) {
					const data = await response.json();
					setTemplates(data);

					// Se já tem template selecionado, encontrar
					if (node.data.templateName) {
						const found = data.find((t: Template) => t.name === node.data.templateName);
						if (found) setSelectedTemplate(found);
					}
				}
			} catch (error) {
				console.error("Erro ao carregar templates:", error);
			} finally {
				setLoading(false);
			}
		}
		loadTemplates();
	}, [node.data.templateName]);

	// Extrair variáveis do template
	function extractVariables(content: string): string[] {
		const regex = /\{\{(\d+)\}\}/g;
		const matches: string[] = [];
		let match;
		while ((match = regex.exec(content)) !== null) {
			matches.push(`{{${match[1]}}}`); // Captura {{1}}, {{2}}, etc.
		}
		return [...new Set(matches)].sort();
	}

	// Quando seleciona um template
	function handleTemplateChange(templateName: string) {
		const template = templates.find((t) => t.name === templateName);
		if (!template) return;

		setSelectedTemplate(template);

		// Extrair variáveis do conteúdo
		const vars = extractVariables(template.content);
		const bodyVariables: TemplateVariable[] = vars.map((v) => ({
			name: v,
			value: "",
			type: "fixed" as const,
		}));

		// Extrair botões do template para criar handles dinâmicos
		const buttonsComponent = template.components?.find(c => c.type === "BUTTONS");
		const buttons: TemplateButton[] = (buttonsComponent?.buttons || []).map((btn, index) => ({
			id: `button-${index}`,
			type: btn.type as "URL" | "PHONE_NUMBER" | "QUICK_REPLY" | "COPY_CODE",
			text: btn.text,
			url: btn.url,
			phoneNumber: btn.phone_number,
		}));

		updateNode({
			id: node.id,
			nodeType: "template",
			data: {
				templateName: template.name,
				templateId: template.id,
				templateStatus: template.status,
				category: template.category as "MARKETING" | "UTILITY" | "AUTHENTICATION",
				preview: template.preview,
				language: template.language,
				bodyVariables,
				buttons,
			},
		});
	}

	// Atualizar variável
	function handleVariableChange(index: number, value: string) {
		const newVars = [...(node.data.bodyVariables || [])];
		newVars[index] = { ...newVars[index], value };
		updateNode({
			id: node.id,
			nodeType: "template",
			data: { bodyVariables: newVars },
		});
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
			</div>
		);
	}

	const approvedTemplates = templates.filter((t) => t.status === "APPROVED");

	return (
		<div className="space-y-4">
			<div>
				<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
					<FileText className="w-4 h-4 text-purple-400" />
					Template WhatsApp
				</h4>
				<p className="text-xs text-zinc-500 mb-3">
					Use templates aprovados pela Meta para mensagens fora da janela de 24h.
				</p>
			</div>

			{/* Seletor de Template */}
			<div className="space-y-2">
				<Label className="text-xs">Template</Label>
				<Select value={node.data.templateName || ""} onValueChange={handleTemplateChange}>
					<SelectTrigger className="bg-zinc-900 border-zinc-700">
						<SelectValue placeholder="Selecione um template aprovado" />
					</SelectTrigger>
					<SelectContent className="bg-zinc-900 border-zinc-700">
						{approvedTemplates.length === 0 ? (
							<div className="px-2 py-4 text-center text-zinc-500 text-xs">
								<AlertCircle className="w-4 h-4 mx-auto mb-1" />
								Nenhum template aprovado
							</div>
						) : (
							approvedTemplates.map((template) => (
								<SelectItem key={template.id} value={template.name}>
									<div className="flex items-center gap-2">
										<span>{template.name}</span>
										<Badge variant="outline" className="text-[10px] px-1 py-0">
											{template.category}
										</Badge>
									</div>
								</SelectItem>
							))
						)}
					</SelectContent>
				</Select>
			</div>

			{/* Preview do template */}
			{selectedTemplate && (
				<div className="space-y-3">
					<div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700">
						<div className="flex items-center gap-2 mb-2">
							<Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">
								<Check className="w-3 h-3 mr-1" />
								Aprovado
							</Badge>
							<Badge variant="outline" className="text-[10px]">
								{selectedTemplate.language}
							</Badge>
						</div>
						<p className="text-xs text-zinc-300 whitespace-pre-wrap">
							{selectedTemplate.content || selectedTemplate.preview}
						</p>

						{/* Botões do template */}
						{selectedTemplate.components && (() => {
							const buttonsComponent = selectedTemplate.components.find(c => c.type === "BUTTONS");
							if (!buttonsComponent?.buttons?.length) return null;
							return (
								<div className="mt-3 pt-3 border-t border-zinc-700 space-y-1.5">
									<div className="flex items-center gap-2">
										<span className="text-[10px] text-zinc-500 uppercase tracking-wider">Botões</span>
										<span className="text-[9px] text-primary-400/70 italic">• cada botão tem sua própria saída</span>
									</div>
									{buttonsComponent.buttons.map((btn, idx) => (
										<div
											key={idx}
											className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded text-xs text-zinc-300"
										>
											{btn.type === "URL" && <span className="text-blue-400">🔗</span>}
											{btn.type === "PHONE_NUMBER" && <span className="text-green-400">📞</span>}
											{btn.type === "QUICK_REPLY" && <span className="text-purple-400">💬</span>}
											<span>{btn.text}</span>
										</div>
									))}
								</div>
							);
						})()}
					</div>

					{/* Variáveis do template */}
					{(() => {
						// Usar variáveis do node.data ou extrair do template selecionado
						let vars = node.data.bodyVariables || [];

						// Se não tem variáveis no node mas tem template selecionado, extrair dele
						if (vars.length === 0 && selectedTemplate?.content) {
							const regex = /\{\{(\d+)\}\}/g;
							const matches: string[] = [];
							let match;
							while ((match = regex.exec(selectedTemplate.content)) !== null) {
								matches.push(`{{${match[1]}}}`);
							}
							vars = [...new Set(matches)].sort().map(v => ({
								name: v,
								value: "",
								type: "fixed" as const,
							}));
						}

						if (vars.length === 0) return null;

						return (
							<div className="space-y-2">
								<Label className="text-xs">Variáveis</Label>
								<p className="text-[10px] text-zinc-500">
									Preencha os valores ou use {"{{variavel}}"} para dados coletados
								</p>

								{vars.map((variable: TemplateVariable, index: number) => (
									<div key={index} className="flex items-center gap-2">
										<span className="text-xs text-zinc-500 w-12">{variable.name}</span>
										<Input
											value={variable.value}
											onChange={(e) => handleVariableChange(index, e.target.value)}
											placeholder={`Ex: {{nome}} ou texto fixo`}
											className="flex-1 h-8 text-xs bg-zinc-900 border-zinc-700"
										/>
									</div>
								))}
							</div>
						);
					})()}
				</div>
			)}

			{/* Dica */}
			<div className="text-[10px] text-zinc-500 p-2 bg-zinc-900/50 rounded border border-zinc-800">
				💡 Templates são obrigatórios para mensagens fora da janela de 24h.
			</div>
		</div>
	);
}

// Factory function
export function createTemplateNode(position: { x: number; y: number }): TemplateNode {
	return {
		id: nanoid(),
		type: "template",
		position,
		data: {
			language: "pt_BR",
			headerVariables: [],
			bodyVariables: [],
			buttonVariables: [],
			buttons: [],
		},
	};
}

// Export definition
export const templateClientDefinition: NodeClientDefinition<TemplateNode> = {
	component: TemplateNodeView,
	panelComponent: TemplateNodePanel,
	create: createTemplateNode,
	meta: {
		label: "Template",
		icon: FileText,
		description: "Envia template aprovado pela Meta",
	},
};
