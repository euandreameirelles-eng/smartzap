"use client";

/**
 * FlowCanvas - Canvas principal do ReactFlow (Estilo Langflow)
 * 
 * Features:
 * - Canvas ocupa 100% do espaço disponível
 * - Controles flutuantes
 * - Minimap opcional
 * - Drop de componentes da sidebar
 * - Seleção de nós com painel de edição
 * - Delete de nós e edges via tecla Delete/Backspace
 * 
 * Performance Optimizations (Langflow patterns):
 * - Constantes extraídas para fora do componente
 * - Componentes do ReactFlow memoizados
 * - onlyRenderVisibleElements para workflows grandes
 */

import { useCallback, useState, useRef, useEffect, memo } from "react";
import { useSearchParams } from "next/navigation";
import {
	ReactFlow,
	Background,
	BackgroundVariant,
	Controls,
	MiniMap,
	Panel,
	useReactFlow,
	type OnSelectionChangeParams,
	useOnSelectionChange,
	SelectionMode,
	type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import { nodeRegistry, getNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes";
import type { FlowNode, FlowNodeType } from "@/components/features/workflow-builder/types/workflow";
import { StatusEdge } from "@/components/features/workflow-builder/components/workflow/status-edge";
import { NodeEditorPanel } from "./node-editor-panel";
import { CanvasControls } from "./canvas-controls";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

// ============================================================================
// CONSTANTES MEMOIZADAS (Performance: evita recriação a cada render)
// ============================================================================

// Monta nodeTypes dinamicamente a partir do registry
const nodeTypes = Object.fromEntries(
	Object.entries(nodeRegistry).map(([type, def]) => [type, def.client.component])
);

// Edge types
const edgeTypes = {
	status: StatusEdge,
};

// Opções padrão de edges (extraído para evitar recriação)
const DEFAULT_EDGE_OPTIONS = {
	type: "status" as const,
	animated: true,
};

// Opções de fitView (extraído para evitar recriação)
const FIT_VIEW_OPTIONS = { padding: 0.2 };

// Função de cor para MiniMap (extraída para evitar recriação)
const getNodeColor = (node: Node) => {
	switch (node.type) {
		case "start":
			return "#f59e0b";
		case "message":
		case "template":
		case "buttons":
		case "list":
			return "#10b981";
		case "simple-ai":
			return "#8b5cf6";
		case "condition":
			return "#3b82f6";
		default:
			return "#71717a";
	}
};

// ============================================================================
// COMPONENTES MEMOIZADOS (Padrão Langflow)
// ============================================================================
const MemoizedBackground = memo(Background);
const MemoizedControls = memo(Controls);
const MemoizedMiniMap = memo(MiniMap);

export function FlowCanvas() {
	const reactFlowInstance = useReactFlow();
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const { open: sidebarOpen } = useSidebar();
	const searchParams = useSearchParams();
	const workflowId = searchParams.get('id');

	// Estado do workflow (Zustand)
	const store = useWorkflow();
	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		createNode,
		deleteNode,
		deleteEdge,
		initializeWorkflow,
		loadWorkflow,
	} = store;

	// Última seleção (para delete via teclado - igual Langflow)
	const lastSelectionRef = useRef<OnSelectionChangeParams | null>(null);

	// Inicializa ou carrega workflow
	useEffect(() => {
		if (workflowId) {
			// Carregar workflow existente
			loadWorkflow(workflowId);
		} else {
			// Novo workflow com nó start
			initializeWorkflow({
				nodes: [{
					id: "start-1",
					type: "start",
					position: { x: 100, y: 200 },
					data: {
						sourceType: { type: "text" as const },
					},
				}],
				edges: [],
			});
		}
	}, [workflowId, initializeWorkflow, loadWorkflow]);

	// Nó selecionado para edição (apenas o ID, o panel busca do store)
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	// Callback para rastrear seleção (nodes E edges) - igual Langflow
	const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
		lastSelectionRef.current = params;

		// Atualiza o painel de edição apenas para nós
		if (params.nodes.length === 1) {
			setSelectedNodeId(params.nodes[0].id);
		} else {
			setSelectedNodeId(null);
		}
	}, []);

	useOnSelectionChange({
		onChange: handleSelectionChange,
	});

	// Drop de componentes da sidebar
	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			const type = event.dataTransfer.getData("application/reactflow") as FlowNodeType;
			if (!type) return;

			// Verificar se o tipo existe no registry
			try {
				getNodeDefinition(type);
			} catch {
				return;
			}

			const position = reactFlowInstance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			createNode(type, position);
		},
		[reactFlowInstance, createNode]
	);

	// Fecha painel de edição
	const closeEditorPanel = useCallback(() => {
		setSelectedNodeId(null);
	}, []);

	// Handler para verificar se evento veio de um elemento com classe (igual Langflow: isWrappedWithClass)
	const isWrappedWithClass = useCallback((element: HTMLElement | null, className: string) => {
		return element?.closest?.(`.${className}`);
	}, []);

	// Handler de delete igual Langflow - usa lastSelection para deletar nodes e edges
	const handleDelete = useCallback((e: KeyboardEvent) => {
		const target = e.target as HTMLElement;

		// Não deleta se estiver em input, textarea, ou elemento com classe "nodelete"
		if (isWrappedWithClass(target, "nodelete")) return;
		if (isWrappedWithClass(target, "noflow")) return;

		const tagName = target.tagName.toLowerCase();
		if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) return;

		const selection = lastSelectionRef.current;
		if (!selection) return;

		// Tem algo selecionado?
		if (selection.nodes.length === 0 && selection.edges.length === 0) return;

		e.preventDefault();

		// Deleta nodes (exceto start)
		if (selection.nodes.length > 0) {
			selection.nodes.forEach(node => {
				if (node.type !== 'start') {
					deleteNode(node.id);
				}
			});
		}

		// Deleta edges
		if (selection.edges.length > 0) {
			deleteEdge(selection.edges.map(edge => edge.id));
		}
	}, [deleteNode, deleteEdge, isWrappedWithClass]);

	// Registra listener de teclado global (igual Langflow usa useHotkeys)
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Delete' || e.key === 'Backspace') {
				handleDelete(e);
			}
		};

		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [handleDelete]);

	return (
		<div ref={reactFlowWrapper} className="h-full w-full relative bg-zinc-950">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onDragOver={onDragOver}
				onDrop={onDrop}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				selectionMode={SelectionMode.Partial}
				// Permite seleção e reconexão de edges
				edgesFocusable={true}
				edgesReconnectable={true}
				// Desabilita delete padrão - usamos handler customizado igual Langflow
				deleteKeyCode={[]}
				fitView
				fitViewOptions={FIT_VIEW_OPTIONS}
				minZoom={0.1}
				maxZoom={2}
				colorMode="dark"
				defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
				// Performance: só renderiza elementos visíveis (para workflows grandes)
				onlyRenderVisibleElements
				proOptions={{ hideAttribution: true }}
				className="bg-zinc-950"
			>
				{/* Background com grid - Memoizado para performance */}
				<MemoizedBackground
					variant={BackgroundVariant.Dots}
					gap={20}
					size={1}
					color="#27272a"
					className="bg-zinc-950"
				/>

				{/* Controles flutuantes - Memoizados para performance */}
				<MemoizedControls
					position="bottom-left"
					showInteractive={false}
					className="bg-zinc-800/90! border-zinc-700! shadow-xl! [&>button]:bg-zinc-800! [&>button]:border-zinc-700! [&>button:hover]:bg-zinc-700! [&>button>svg]:fill-zinc-300!"
				/>

				{/* MiniMap - Memoizado com função de cor extraída */}
				<MemoizedMiniMap
					position="bottom-right"
					nodeColor={getNodeColor}
					maskColor="rgba(0, 0, 0, 0.8)"
					className="bg-zinc-800/90! border-zinc-700!"
					pannable
					zoomable
				/>

				{/* Trigger da sidebar quando fechada */}
				{!sidebarOpen && (
					<Panel position="top-left" className="m-4">
						<SidebarTrigger className="p-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-lg shadow-lg">
							<Menu className="w-5 h-5 text-zinc-300" />
						</SidebarTrigger>
					</Panel>
				)}

				{/* Controles customizados - canto superior direito */}
				<Panel position="top-right" className="m-4">
					<CanvasControls />
				</Panel>
			</ReactFlow>

			{/* Painel de edição FORA do ReactFlow para evitar captura de eventos */}
			{selectedNodeId && (
				<div className="absolute top-4 right-4 mt-12 z-50">
					<NodeEditorPanel
						nodeId={selectedNodeId}
						onClose={closeEditorPanel}
					/>
				</div>
			)}
		</div>
	);
}
