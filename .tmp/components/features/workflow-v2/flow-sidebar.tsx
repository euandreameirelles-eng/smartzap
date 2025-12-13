"use client";

/**
 * FlowSidebar - Sidebar estilo Langflow
 * 
 * Features:
 * - Collapsible "offcanvas" - colapsa para ícones
 * - Busca de componentes
 * - Categorias expansíveis
 * - Componentes arrastáveis
 */

import { useState, useMemo } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { 
	Search, 
	MessageSquare, 
	Bot, 
	Split, 
	Clock, 
	Webhook,
	FileText,
	ListChecks,
	MousePointer2,
	ChevronDown,
	ChevronRight,
	Menu as MenuIcon,
	Keyboard,
	PlayCircle,
	StopCircle,
	StickyNote,
	Timer,
	Image,
	Video,
	Music,
	File,
	MapPin,
	Smile,
	Contact2,
	ExternalLink,
	GalleryHorizontalEnd,
	Hourglass,
} from "lucide-react";
import { nodeRegistry, getNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes";
import type { FlowNodeType } from "@/components/features/workflow-builder/types/workflow";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Tipos de nós disponíveis no registry
const AVAILABLE_NODE_TYPES: FlowNodeType[] = [
	"start", "message", "menu", "input", "template", 
	"buttons", "list", "if-else", "wait", "delay", "agent", "end", "note",
	"image", "video", "audio", "document", "location", "sticker", "contacts",
	"cta-url", "carousel"
];

// Categorias de nós (estilo Langflow) - usando tipos do registry
const NODE_CATEGORIES: { id: string; label: string; icon: React.ElementType; color: string; nodes: FlowNodeType[] }[] = [
	{
		id: "triggers",
		label: "Gatilhos",
		icon: Webhook,
		color: "text-amber-500",
		nodes: ["start"],
	},
	{
		id: "messages",
		label: "Mensagens",
		icon: MessageSquare,
		color: "text-emerald-500",
		nodes: ["message", "template"],
	},
	{
		id: "interactive",
		label: "Interativos",
		icon: MousePointer2,
		color: "text-pink-500",
		nodes: ["buttons", "list", "menu", "cta-url", "carousel"],
	},
	{
		id: "media",
		label: "Mídia",
		icon: Image,
		color: "text-orange-500",
		nodes: ["image", "video", "audio", "document", "sticker"],
	},
	{
		id: "location-contacts",
		label: "Localização & Contatos",
		icon: MapPin,
		color: "text-red-500",
		nodes: ["location", "contacts"],
	},
	{
		id: "input",
		label: "Entrada",
		icon: Keyboard,
		color: "text-cyan-500",
		nodes: ["input"],
	},
	{
		id: "ai",
		label: "Inteligência",
		icon: Bot,
		color: "text-purple-500",
		nodes: ["agent"],
	},
	{
		id: "flow",
		label: "Fluxo",
		icon: Split,
		color: "text-blue-500",
		nodes: ["if-else", "wait", "delay"],
	},
	{
		id: "utility",
		label: "Utilidades",
		icon: StickyNote,
		color: "text-zinc-400",
		nodes: ["note", "end"],
	},
];

// Ícones por tipo de nó
const NODE_ICONS: Record<FlowNodeType, React.ElementType> = {
	start: PlayCircle,
	message: MessageSquare,
	template: FileText,
	buttons: MousePointer2,
	list: ListChecks,
	menu: MenuIcon,
	input: Keyboard,
	agent: Bot,
	"if-else": Split,
	wait: Timer,
	delay: Hourglass,
	end: StopCircle,
	note: StickyNote,
	image: Image,
	video: Video,
	audio: Music,
	document: File,
	location: MapPin,
	sticker: Smile,
	contacts: Contact2,
	"cta-url": ExternalLink,
	carousel: GalleryHorizontalEnd,
};

interface DraggableNodeProps {
	type: FlowNodeType;
	label: string;
	description: string;
	icon: React.ElementType;
}

function DraggableNode({ type, label, description, icon: Icon }: DraggableNodeProps) {
	const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
		event.dataTransfer.setData("application/reactflow", type);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<div
			draggable
			onDragStart={onDragStart}
			className={cn(
				"flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab",
				"bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50",
				"transition-all duration-150",
				"hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10",
				"active:cursor-grabbing active:scale-95"
			)}
			title={description}
		>
			<div className="p-1.5 rounded-md bg-zinc-700/50">
				<Icon className="w-4 h-4 text-zinc-400" />
			</div>
			<span className="text-sm text-zinc-300">{label}</span>
		</div>
	);
}

export function FlowSidebar() {
	const [searchQuery, setSearchQuery] = useState("");
	const [openCategories, setOpenCategories] = useState<string[]>(["messages", "ai"]);

	// Filtra nós baseado na busca
	const filteredCategories = useMemo(() => {
		if (!searchQuery.trim()) return NODE_CATEGORIES;

		const query = searchQuery.toLowerCase();
		return NODE_CATEGORIES.map(category => ({
			...category,
			nodes: category.nodes.filter(nodeType => {
				try {
					const definition = getNodeDefinition(nodeType);
					if (!definition) return false;
					return (
						definition.client.meta.label.toLowerCase().includes(query) ||
						nodeType.toLowerCase().includes(query)
					);
				} catch {
					return false;
				}
			}),
		})).filter(category => category.nodes.length > 0);
	}, [searchQuery]);

	const toggleCategory = (categoryId: string) => {
		setOpenCategories(prev =>
			prev.includes(categoryId)
				? prev.filter(id => id !== categoryId)
				: [...prev, categoryId]
		);
	};

	return (
		<Sidebar collapsible="offcanvas" className="border-r border-zinc-800">
			<SidebarHeader className="border-b border-zinc-800 p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-zinc-100">Componentes</h2>
					<SidebarTrigger className="text-zinc-400 hover:text-zinc-100" />
				</div>
				
				{/* Barra de busca */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
					<Input
						placeholder="Buscar componentes..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
					/>
				</div>
			</SidebarHeader>

			<SidebarContent className="p-2">
				{filteredCategories.map((category) => {
					const isOpen = openCategories.includes(category.id);
					const CategoryIcon = category.icon;

					return (
						<Collapsible
							key={category.id}
							open={isOpen}
							onOpenChange={() => toggleCategory(category.id)}
						>
							<SidebarGroup>
								<CollapsibleTrigger asChild>
									<SidebarGroupLabel 
										className={cn(
											"flex items-center justify-between w-full px-3 py-2",
											"hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors"
										)}
									>
										<div className="flex items-center gap-2">
											<CategoryIcon className={cn("w-4 h-4", category.color)} />
											<span className="text-sm font-medium text-zinc-300">
												{category.label}
											</span>
											<span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
												{category.nodes.length}
											</span>
										</div>
										{isOpen ? (
											<ChevronDown className="w-4 h-4 text-zinc-500" />
										) : (
											<ChevronRight className="w-4 h-4 text-zinc-500" />
										)}
									</SidebarGroupLabel>
								</CollapsibleTrigger>

								<CollapsibleContent>
									<SidebarGroupContent className="mt-2 space-y-1.5 px-1">
										{category.nodes.map((nodeType) => {
											let definition;
											try {
												definition = getNodeDefinition(nodeType);
											} catch {
												return null;
											}
											if (!definition) return null;

											const Icon = NODE_ICONS[nodeType] || MessageSquare;
											const { label, description } = definition.client.meta;

											return (
												<DraggableNode
													key={nodeType}
													type={nodeType}
													label={label}
													description={description}
													icon={Icon}
												/>
											);
										})}
									</SidebarGroupContent>
								</CollapsibleContent>
							</SidebarGroup>
						</Collapsible>
					);
				})}

				{filteredCategories.length === 0 && (
					<div className="text-center py-8 text-zinc-500">
						<Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">Nenhum componente encontrado</p>
					</div>
				)}
			</SidebarContent>
		</Sidebar>
	);
}
