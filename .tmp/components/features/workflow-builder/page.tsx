"use client";

import {
	Background,
	Controls,
	type EdgeTypes,
	MiniMap,
	type NodeTypes,
	Panel,
	ReactFlow,
	ReactFlowProvider,
	useOnSelectionChange,
	useReactFlow,
} from "@xyflow/react";
import { type DragEvent, useCallback, useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import "@xyflow/react/dist/style.css";
import { ChevronRight, LayoutGrid, Loader2, PanelLeftClose, Play, Plus, Power, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NodeEditorPanel } from "@/components/features/workflow-builder/components/node-editor-panel";
import { StatusEdge } from "@/components/features/workflow-builder/components/workflow/status-edge";
import { useWorkflow, type TestResult } from "@/components/features/workflow-builder/hooks/use-workflow";
import { getAllNodeDefinitions } from "@/components/features/workflow-builder/lib/workflow/nodes";
import type { FlowNode } from "@/components/features/workflow-builder/types/workflow";

const nodeDefinitions = getAllNodeDefinitions();
const nodeTypes: NodeTypes = {} as NodeTypes;
for (const definition of nodeDefinitions) {
	nodeTypes[definition.shared.type] = definition.client.component as unknown as NodeTypes[string];
}

const edgeTypes: EdgeTypes = {
	status: StatusEdge,
};

// Agrupa nós por categoria
const NODE_CATEGORIES = {
	"WhatsApp": ["message", "template", "buttons", "list", "menu"],
	"Fluxo": ["start", "end", "if-else", "wait"],
	"IA": ["agent", "input"],
	"Outros": ["note"],
};

// Sidebar de componentes estilo Langflow
function ComponentsSidebar({
	isOpen,
	onClose,
	onDragStart,
}: {
	isOpen: boolean;
	onClose: () => void;
	onDragStart: (event: React.DragEvent, nodeType: string) => void;
}) {
	const [search, setSearch] = useState("");
	const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(NODE_CATEGORIES));

	const toggleCategory = (category: string) => {
		setExpandedCategories(prev =>
			prev.includes(category)
				? prev.filter(c => c !== category)
				: [...prev, category]
		);
	};

	const filteredCategories = Object.entries(NODE_CATEGORIES).map(([category, types]) => {
		const filteredNodes = nodeDefinitions.filter(def => {
			const matchesCategory = types.includes(def.shared.type);
			const matchesSearch = search === "" ||
				def.client.meta.label.toLowerCase().includes(search.toLowerCase()) ||
				def.client.meta.description.toLowerCase().includes(search.toLowerCase());
			return matchesCategory && matchesSearch && def.shared.type !== "start";
		});
		return { category, nodes: filteredNodes };
	}).filter(({ nodes }) => nodes.length > 0);

	return (
		<div
			className={cn(
				"fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 z-50 transition-transform duration-300 flex flex-col",
				isOpen ? "translate-x-0" : "-translate-x-full",
				"w-64"
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
				<span className="text-sm font-semibold text-zinc-200">Componentes</span>
				<Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
					<PanelLeftClose className="w-4 h-4" />
				</Button>
			</div>

			{/* Search */}
			<div className="px-3 py-2 border-b border-zinc-800">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
					<Input
						placeholder="Buscar componentes..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8 h-8 text-sm bg-zinc-800 border-zinc-700"
					/>
				</div>
			</div>

			{/* Categories */}
			<div className="flex-1 overflow-y-auto py-2">
				{filteredCategories.map(({ category, nodes }) => (
					<div key={category} className="px-2 mb-1">
						<button
							onClick={() => toggleCategory(category)}
							className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
						>
							<ChevronRight className={cn(
								"w-3 h-3 transition-transform",
								expandedCategories.includes(category) && "rotate-90"
							)} />
							{category}
							<span className="ml-auto text-zinc-600">{nodes.length}</span>
						</button>

						{expandedCategories.includes(category) && (
							<div className="ml-3 mt-1 space-y-0.5">
								{nodes.map((def) => (
									<div
										key={def.shared.type}
										draggable
										onDragStart={(e) => onDragStart(e, def.shared.type)}
										className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab hover:bg-zinc-800 transition-colors group"
									>
										<def.client.meta.icon className="w-4 h-4 text-primary-400 group-hover:text-primary-300" />
										<span className="text-sm text-zinc-300 group-hover:text-zinc-100">
											{def.client.meta.label}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export function Flow() {
	const store = useWorkflow(
		(store) => ({
			nodes: store.nodes,
			edges: store.edges,
			onNodesChange: store.onNodesChange,
			onEdgesChange: store.onEdgesChange,
			onConnect: store.onConnect,
			createNode: store.createNode,
			initializeWorkflow: store.initializeWorkflow,
			updateNode: store.updateNode,
			// Persistence
			workflowName: store.workflowName,
			setWorkflowName: store.setWorkflowName,
			hasUnsavedChanges: store.hasUnsavedChanges,
			isSaving: store.isSaving,
			saveWorkflow: store.saveWorkflow,
			// Publish
			isActive: store.isActive,
			isPublishing: store.isPublishing,
			publishWorkflow: store.publishWorkflow,
			unpublishWorkflow: store.unpublishWorkflow,
			// Testing
			isTesting: store.isTesting,
			lastTestResult: store.lastTestResult,
			testWorkflow: store.testWorkflow,
			validationState: store.validationState,
			// Layout
			autoLayout: store.autoLayout,
		}),
		shallow,
	);

	const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]);
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const handleSelectionChange = useCallback(({ nodes }: { nodes: FlowNode[] | unknown[] }) => {
		setSelectedNodes(nodes as FlowNode[]);
	}, []);

	useOnSelectionChange({
		onChange: handleSelectionChange,
	});

	const handleClosePanel = useCallback(() => {
		setSelectedNodes([]);
	}, []);

	// Iniciar com canvas vazio (apenas nó start)
	useEffect(() => {
		store.initializeWorkflow({
			nodes: [{
				id: "start-1",
				type: "start",
				position: { x: 100, y: 250 },
				data: { sourceType: { type: "text" } },
			}],
			edges: [],
		});
	}, []);

	const { screenToFlowPosition } = useReactFlow();

	const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	}, []);

	const onDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(event: DragEvent) => {
			event.preventDefault();

			const type = event.dataTransfer.getData("application/reactflow") as FlowNode["type"];

			if (!type) return;

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			store.createNode(type, position);
		},
		[screenToFlowPosition, store.createNode],
	);

	return (
		<div className="w-full h-full bg-zinc-950 relative">
			{/* Sidebar de componentes */}
			<ComponentsSidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onDragStart={onDragStart}
			/>

			{/* Canvas */}
			<div className={cn(
				"w-full h-full transition-all duration-300",
				sidebarOpen && "pl-64"
			)}>
				<ReactFlow
					nodes={store.nodes}
					edges={store.edges}
					onNodesChange={store.onNodesChange}
					onEdgesChange={store.onEdgesChange}
					onConnect={store.onConnect}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onDragOver={onDragOver}
					onDrop={onDrop}
					fitView
					colorMode="dark"
					proOptions={{ hideAttribution: true }}
					className="bg-zinc-950"
					// 🧲 Magnetic handles - snap quando chega perto
					connectionRadius={50}
					// 📐 Snap to grid para alinhamento visual
					snapToGrid={true}
					snapGrid={[20, 20]}
					defaultEdgeOptions={{
						type: "status",
						animated: true,
					}}
				>
					<Background color="#27272a" gap={20} size={1} />
					<Controls
						className="bg-zinc-900 border-zinc-800 rounded-lg [&>button]:bg-zinc-900 [&>button]:border-zinc-700 [&>button]:text-zinc-400 [&>button:hover]:bg-zinc-800 [&>button:hover]:text-zinc-200"
						showInteractive={false}
					/>
					<MiniMap
						className="bg-zinc-900/80 border-zinc-800 rounded-lg"
						maskColor="rgba(0,0,0,0.8)"
						nodeColor="#3f3f46"
						nodeBorderRadius={8}
					/>

					{/* Botão para abrir sidebar quando fechada */}
					{!sidebarOpen && (
						<Panel position="top-left" className="m-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSidebarOpen(true)}
								className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 gap-2"
							>
								<Plus className="w-4 h-4" />
								Componentes
							</Button>
						</Panel>
					)}

					{/* Header com nome e botões */}
					<Panel position="top-right" className="m-3">
						<div className="flex items-center gap-3">
							{store.lastTestResult && (
								<span className={cn(
									"text-xs px-2 py-1 rounded flex items-center gap-1.5",
									store.lastTestResult.success
										? "text-emerald-400 bg-emerald-400/10"
										: "text-red-400 bg-red-400/10"
								)}>
									{store.lastTestResult.success
										? `✓ ${store.lastTestResult.messagesSent || 0} msgs enviadas`
										: store.lastTestResult.error
									}
								</span>
							)}
							{store.isActive && (
								<span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-400/10 rounded flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
									Ativo
								</span>
							)}
							{store.hasUnsavedChanges && (
								<span className="text-xs text-amber-400 px-2 py-1 bg-amber-400/10 rounded">
									Não salvo
								</span>
							)}
							<Input
								value={store.workflowName}
								onChange={(e) => store.setWorkflowName(e.target.value)}
								className="w-48 h-8 text-sm bg-zinc-900 border-zinc-700"
								placeholder="Nome do workflow"
							/>
							{/* 🎯 Auto Layout */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => store.autoLayout('TB')}
								className="gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
								title="Organizar nós automaticamente"
							>
								<LayoutGrid className="w-4 h-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => store.testWorkflow()}
								disabled={store.isTesting || !store.validationState.valid}
								className="gap-2 bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/20 text-primary-400"
								title={!store.validationState.valid ? "Corrija os erros antes de testar" : "Testar fluxo"}
							>
								{store.isTesting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Play className="w-4 h-4" />
								)}
								Testar
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => store.saveWorkflow()}
								disabled={store.isSaving || !store.hasUnsavedChanges}
								className="gap-2"
							>
								{store.isSaving ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								Salvar
							</Button>
							<Button
								variant={store.isActive ? "destructive" : "default"}
								size="sm"
								onClick={() => store.isActive ? store.unpublishWorkflow() : store.publishWorkflow()}
								disabled={store.isPublishing}
								className="gap-2"
							>
								{store.isPublishing ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Power className="w-4 h-4" />
								)}
								{store.isActive ? 'Desativar' : 'Publicar'}
							</Button>
						</div>
					</Panel>

					{/* Painel de edição do nó selecionado */}
					{selectedNodes.length === 1 && (
						<NodeEditorPanel nodeId={selectedNodes[0].id} onClose={handleClosePanel} />
					)}
				</ReactFlow>
			</div>
		</div>
	);
}

export default function Page() {
	return (
		<div className="w-screen h-screen overflow-hidden">
			<ReactFlowProvider>
				<Flow />
			</ReactFlowProvider>
		</div>
	);
}
