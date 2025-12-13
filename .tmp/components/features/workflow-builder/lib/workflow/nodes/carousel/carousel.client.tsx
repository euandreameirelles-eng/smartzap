"use client";

import { type NodeProps, Position } from "@xyflow/react";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import { nanoid } from "nanoid";
import { BaseHandle } from "@/components/features/workflow-builder/components/workflow/primitives/base-handle";
import { BaseNode } from "@/components/features/workflow-builder/components/workflow/primitives/base-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { CarouselNode as CarouselNodeType, CarouselCard } from "@/components/features/workflow-builder/lib/workflow/nodes/carousel/carousel.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface CarouselNodeProps extends NodeProps<CarouselNodeType> { }

const statusMap = {
	idle: undefined,
	processing: "running" as const,
	success: "success" as const,
	error: "error" as const,
};

function CarouselNodeComponent({ id, selected, data }: CarouselNodeProps) {
	const canConnectHandle = useWorkflow((store) => store.canConnectHandle);
	const hasCards = !!data.cards?.length;

	return (
		<BaseNode
			selected={selected}
			category="message"
			icon={<LayoutGrid className="w-4 h-4" />}
			title={data.label || "Carrossel"}
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
				{hasCards ? (
					<div className="flex gap-1">
						{data.cards!.slice(0, 3).map((card, i) => (
							<div key={i} className="w-8 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
								{i + 1}
							</div>
						))}
						{data.cards!.length > 3 && (
							<div className="w-8 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
								+{data.cards!.length - 3}
							</div>
						)}
					</div>
				) : (
					<p className="text-xs text-muted-foreground/50 italic">
						Nenhum card
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

export const CarouselNode = memo(CarouselNodeComponent);

export function CarouselNodePanel({ node }: { node: CarouselNodeType }) {
	const updateNode = useWorkflow((store) => store.updateNode);
	const cards = node.data.cards || [];

	const addCard = () => {
		const newCard: CarouselCard = {
			id: nanoid(),
			imageUrl: "",
			title: `Card ${cards.length + 1}`,
			description: "",
			buttonText: "",
			buttonUrl: "",
		};
		updateNode({
			id: node.id,
			nodeType: "carousel",
			data: { cards: [...cards, newCard] },
		});
	};

	const removeCard = (cardId: string) => {
		updateNode({
			id: node.id,
			nodeType: "carousel",
			data: { cards: cards.filter((c) => c.id !== cardId) },
		});
	};

	const updateCard = (cardId: string, field: keyof CarouselCard, value: string) => {
		updateNode({
			id: node.id,
			nodeType: "carousel",
			data: {
				cards: cards.map((c) =>
					c.id === cardId ? { ...c, [field]: value } : c
				),
			},
		});
	};

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
							nodeType: "carousel",
							data: { label: e.target.value },
						})
					}
					placeholder="Produtos em destaque"
					className="mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="bodyText">Texto da Mensagem</Label>
				<Textarea
					id="bodyText"
					value={node.data.bodyText || ""}
					onChange={(e) =>
						updateNode({
							id: node.id,
							nodeType: "carousel",
							data: { bodyText: e.target.value },
						})
					}
					placeholder="Confira nossos produtos:"
					className="mt-1"
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Cards ({cards.length}/10)</Label>
					<Button
						size="sm"
						variant="outline"
						onClick={addCard}
						disabled={cards.length >= 10}
					>
						<Plus className="w-4 h-4 mr-1" />
						Adicionar
					</Button>
				</div>

				<Accordion type="single" collapsible className="w-full">
					{cards.map((card, index) => (
						<AccordionItem key={card.id} value={card.id}>
							<AccordionTrigger className="hover:no-underline">
								<div className="flex items-center justify-between w-full pr-2">
									<span className="text-sm">{card.title || `Card ${index + 1}`}</span>
									<div
										role="button"
										tabIndex={0}
										className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"
										onClick={(e) => {
											e.stopPropagation();
											removeCard(card.id);
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.stopPropagation();
												removeCard(card.id);
											}
										}}
									>
										<Trash2 className="w-4 h-4 text-destructive" />
									</div>
								</div>
							</AccordionTrigger>
							<AccordionContent className="space-y-3 pt-2">
								<div>
									<Label>Imagem URL</Label>
									<Input
										value={card.imageUrl}
										onChange={(e) => updateCard(card.id, "imageUrl", e.target.value)}
										placeholder="https://exemplo.com/produto.jpg"
										className="mt-1"
									/>
								</div>
								<div>
									<Label>Título</Label>
									<Input
										value={card.title}
										onChange={(e) => updateCard(card.id, "title", e.target.value)}
										placeholder="Nome do produto"
										className="mt-1"
									/>
								</div>
								<div>
									<Label>Descrição</Label>
									<Textarea
										value={card.description || ""}
										onChange={(e) => updateCard(card.id, "description", e.target.value)}
										placeholder="Descrição do produto..."
										className="mt-1"
									/>
								</div>
								<div>
									<Label>Texto do Botão</Label>
									<Input
										value={card.buttonText || ""}
										onChange={(e) => updateCard(card.id, "buttonText", e.target.value)}
										placeholder="Ver mais"
										maxLength={25}
										className="mt-1"
									/>
								</div>
								<div>
									<Label>URL do Botão</Label>
									<Input
										value={card.buttonUrl || ""}
										onChange={(e) => updateCard(card.id, "buttonUrl", e.target.value)}
										placeholder="https://exemplo.com/produto/1"
										className="mt-1"
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>

				{cards.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-4">
						Clique em Adicionar para criar um card
					</p>
				)}
			</div>
		</div>
	);
}

export function createCarouselNode(position: {
	x: number;
	y: number;
}): CarouselNodeType {
	return {
		id: nanoid(),
		type: "carousel",
		position,
		data: {
			label: "Carrossel",
			bodyText: "",
			cards: [],
		},
	};
}

export const carouselClientDefinition: NodeClientDefinition<CarouselNodeType> = {
	component: CarouselNode,
	panelComponent: CarouselNodePanel,
	create: createCarouselNode,
	meta: {
		label: "Carrossel",
		icon: LayoutGrid,
		description: "Carrossel de produtos ou cards",
	},
};
