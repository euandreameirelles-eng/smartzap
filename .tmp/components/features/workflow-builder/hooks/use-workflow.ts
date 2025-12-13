import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { createWithEqualityFn } from "zustand/traditional";

// Performance: implementação inline do debounce (evita dependência externa)
function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null = null;
	return (...args: Parameters<T>) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}
import { getNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes";
import {
	canConnectHandle,
	getErrorsForEdge,
	getErrorsForNode,
	isValidConnection,
	validateWorkflow as validateWorkflowFn,
} from "@/components/features/workflow-builder/lib/workflow/validation";
import type {
	FlowEdge,
	FlowNode,
	FlowNodeType,
	ValidationError,
} from "@/components/features/workflow-builder/types/workflow";
import { isNodeOfType } from "@/components/features/workflow-builder/types/workflow";
import { getLayoutedElements, type LayoutOptions } from "@/components/features/workflow-builder/lib/auto-layout";

export interface TestResult {
	success: boolean;
	executionId?: string;
	status?: string;
	nodesExecuted?: number;
	messagesSent?: number;
	error?: string;
	testContact?: { name?: string; phone: string };
}

export interface WorkflowState {
	nodes: FlowNode[];
	edges: FlowEdge[];
	validationState: {
		valid: boolean;
		errors: ValidationError[];
		warnings: ValidationError[];
		lastValidated: number | null;
	};

	// Metadata
	workflowId: string | null;
	workflowName: string;
	hasUnsavedChanges: boolean;
	isSaving: boolean;
	isActive: boolean;
	isPublishing: boolean;
	isTesting: boolean;
	lastTestResult: TestResult | null;

	onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
	onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
	onConnect: (connection: Connection) => void;
	getNodeById: (nodeId: string) => FlowNode | null;
	getWorkflowData: () => { nodes: FlowNode[]; edges: FlowEdge[] };
	createNode: (
		nodeType: FlowNode["type"],
		position: { x: number; y: number },
	) => FlowNode;
	updateNode: <T extends FlowNodeType>({
		id,
		nodeType,
		data,
	}: {
		id: string;
		nodeType: T;
		data: Partial<Extract<FlowNode, { type: T }>["data"]>;
	}) => void;

	deleteNode: (id: string) => void;
	deleteEdge: (id: string | string[]) => void;

	initializeWorkflow: ({
		nodes,
		edges,
	}: {
		nodes: FlowNode[];
		edges: FlowEdge[];
	}) => void;

	resetNodeStatuses: () => void;
	validateWorkflow: () => void;
	debouncedValidate: () => void; // Performance: versão debounced da validação
	canConnectHandle: (params: {
		nodeId: string;
		handleId: string;
		type: "source" | "target";
	}) => boolean;

	// Persistence
	setWorkflowName: (name: string) => void;
	saveWorkflow: () => Promise<{ id: string; name: string } | null>;
	loadWorkflow: (id: string) => Promise<boolean>;
	publishWorkflow: () => Promise<boolean>;
	unpublishWorkflow: () => Promise<boolean>;

	// Testing
	testWorkflow: () => Promise<TestResult>;

	// Layout
	autoLayout: (direction?: 'TB' | 'LR') => void;
}

const useWorkflow = createWithEqualityFn<WorkflowState>((set, get) => ({
	nodes: [],
	edges: [],
	validationState: {
		valid: true,
		errors: [],
		warnings: [],
		lastValidated: null,
	},

	// Metadata
	workflowId: null,
	workflowName: "Novo Workflow",
	hasUnsavedChanges: false,
	isSaving: false,
	isActive: false,
	isPublishing: false,
	isTesting: false,
	lastTestResult: null,

	initializeWorkflow: ({ nodes, edges }) => {
		set({ nodes: nodes, edges, hasUnsavedChanges: false });
		get().validateWorkflow();
	},
	onNodesChange: (changes) => {
		// Filtra mudanças de remoção do nó start
		const filteredChanges = changes.filter((change) => {
			if (change.type === "remove") {
				const node = get().nodes.find((n) => n.id === change.id);
				if (node?.type === "start") {
					return false;
				}
			}
			return true;
		});

		set({
			nodes: applyNodeChanges<FlowNode>(filteredChanges, get().nodes),
			hasUnsavedChanges: true,
		});

		// Only validate on meaningful structural changes (not position/selection)
		// Performance: evita revalidação durante drag
		const shouldValidate = changes.some(
			(change) => change.type === "add" || change.type === "remove",
		);

		if (shouldValidate) {
			// Debounce validation para evitar múltiplas chamadas
			get().debouncedValidate();
		}
	},
	onEdgesChange: (changes) => {
		set({
			edges: applyEdgeChanges(changes, get().edges),
			hasUnsavedChanges: true,
		});

		// Only validate on structural edge changes (not selection)
		// Performance: evita revalidação durante drag
		const shouldValidate = changes.some(
			(change) => change.type === "add" || change.type === "remove",
		);

		if (shouldValidate) {
			// Debounce validation para evitar múltiplas chamadas
			get().debouncedValidate();
		}
	},
	onConnect: (connection) => {
		const valid = isValidConnection({
			sourceNodeId: connection.source || "",
			sourceHandle: connection.sourceHandle ?? null,
			targetNodeId: connection.target || "",
			targetHandle: connection.targetHandle ?? null,
			nodes: get().nodes,
			edges: get().edges,
		});

		if (!valid) {
			return;
		}

		const newEdge = addEdge({ ...connection, type: "status" }, get().edges);

		if (!connection.sourceHandle) {
			throw new Error("Source handle not found");
		}

		set({
			edges: newEdge,
			hasUnsavedChanges: true,
		});
		// Usa debounce para validação após conexão
		get().debouncedValidate();
	},
	getNodeById: (nodeId) => {
		const node = get().nodes.find((node) => node.id === nodeId);
		return node || null;
	},
	getWorkflowData: () => ({
		nodes: get().nodes,
		edges: get().edges,
	}),
	createNode(nodeType, position) {
		const definition = getNodeDefinition(nodeType);
		if (!definition) {
			throw new Error(`Unknown node type: ${nodeType}`);
		}
		const newNode = definition.client.create(position);
		set((state) => ({
			nodes: [...state.nodes, newNode],
			hasUnsavedChanges: true,
		}));
		get().validateWorkflow();
		return newNode;
	},
	updateNode({ id, nodeType, data }) {
		set((state) => ({
			nodes: state.nodes.map((node) => {
				if (node.id === id && isNodeOfType(node, nodeType)) {
					return {
						...node,
						data: {
							...node.data,
							...data,
						},
					};
				}
				return node;
			}),
			hasUnsavedChanges: true,
		}));
		get().validateWorkflow();
	},
	deleteNode(id) {
		const node = get().nodes.find((n) => n.id === id);
		if (node?.type === "start") {
			return;
		}

		set({
			nodes: get().nodes.filter((node) => node.id !== id),
			edges: get().edges.filter(
				(edge) => edge.source !== id && edge.target !== id,
			),
			hasUnsavedChanges: true,
		});
		get().validateWorkflow();
	},
	deleteEdge(edgeId: string | string[]) {
		const idsToDelete = Array.isArray(edgeId) ? edgeId : [edgeId];
		set({
			edges: get().edges.filter((edge) => !idsToDelete.includes(edge.id)),
			hasUnsavedChanges: true,
		});
		get().validateWorkflow();
	},
	resetNodeStatuses: () => {
		set((state) => ({
			nodes: state.nodes.map((node) => ({
				...node,
				data: {
					...node.data,
					status: "idle",
				},
			})) as FlowNode[],
		}));
	},
	validateWorkflow: () => {
		const { nodes, edges } = get();
		const result = validateWorkflowFn(nodes, edges);

		const updatedNodes = nodes.map((node) => {
			const nodeErrors = getErrorsForNode(node.id, result.errors);
			return {
				...node,
				data: {
					...node.data,
					validationErrors:
						nodeErrors.length > 0 ? nodeErrors : undefined,
				},
			} as FlowNode;
		});

		const updatedEdges = edges.map((edge) => {
			const edgeErrors = getErrorsForEdge(edge.id, result.errors);
			return {
				...edge,
				data: {
					...edge.data,
					validationErrors:
						edgeErrors.length > 0 ? edgeErrors : undefined,
				},
			};
		});

		set({
			nodes: updatedNodes,
			edges: updatedEdges,
			validationState: {
				valid: result.valid,
				errors: result.errors,
				warnings: result.warnings,
				lastValidated: Date.now(),
			},
		});
	},
	// Performance: versão debounced da validação para evitar múltiplas chamadas
	debouncedValidate: debounce(() => {
		const { nodes, edges } = useWorkflow.getState();
		const result = validateWorkflowFn(nodes, edges);

		const updatedNodes = nodes.map((node) => {
			const nodeErrors = getErrorsForNode(node.id, result.errors);
			return {
				...node,
				data: {
					...node.data,
					validationErrors:
						nodeErrors.length > 0 ? nodeErrors : undefined,
				},
			} as FlowNode;
		});

		const updatedEdges = edges.map((edge) => {
			const edgeErrors = getErrorsForEdge(edge.id, result.errors);
			return {
				...edge,
				data: {
					...edge.data,
					validationErrors:
						edgeErrors.length > 0 ? edgeErrors : undefined,
				},
			};
		});

		useWorkflow.setState({
			nodes: updatedNodes,
			edges: updatedEdges,
			validationState: {
				valid: result.valid,
				errors: result.errors,
				warnings: result.warnings,
				lastValidated: Date.now(),
			},
		});
	}, 150),
	canConnectHandle: ({
		nodeId,
		handleId,
		type,
	}: {
		nodeId: string;
		handleId: string;
		type: "source" | "target";
	}) => {
		const { nodes, edges } = get();
		return canConnectHandle({ nodeId, handleId, type, nodes, edges });
	},

	// Persistence methods
	setWorkflowName: (name: string) => {
		set({ workflowName: name, hasUnsavedChanges: true });
	},

	saveWorkflow: async () => {
		const { workflowId, workflowName, nodes, edges } = get();

		set({ isSaving: true });

		try {
			if (workflowId) {
				// Update existing workflow
				const response = await fetch(`/api/flows/${workflowId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: workflowName, nodes, edges }),
				});

				if (!response.ok) throw new Error('Failed to save workflow');

				const data = await response.json();
				set({ hasUnsavedChanges: false, isSaving: false });
				return { id: data.id, name: data.name };
			} else {
				// Create new workflow
				const response = await fetch('/api/flows', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: workflowName, nodes, edges }),
				});

				if (!response.ok) throw new Error('Failed to create workflow');

				const data = await response.json();
				set({ workflowId: data.id, hasUnsavedChanges: false, isSaving: false });
				return { id: data.id, name: data.name };
			}
		} catch (error) {
			console.error('Error saving workflow:', error);
			set({ isSaving: false });
			return null;
		}
	},

	loadWorkflow: async (id: string) => {
		try {
			const response = await fetch(`/api/flows/${id}`);

			if (!response.ok) throw new Error('Failed to load workflow');

			const data = await response.json();

			set({
				workflowId: data.id,
				workflowName: data.name,
				nodes: data.nodes || [],
				edges: data.edges || [],
				hasUnsavedChanges: false,
				isActive: Boolean(data.isActive || data.is_active),
			});

			get().validateWorkflow();
			return true;
		} catch (error) {
			console.error('Error loading workflow:', error);
			return false;
		}
	},

	publishWorkflow: async () => {
		const { workflowId, hasUnsavedChanges, saveWorkflow } = get();

		// Salvar primeiro se tiver mudanças
		if (hasUnsavedChanges || !workflowId) {
			const saved = await saveWorkflow();
			if (!saved) return false;
		}

		const id = get().workflowId;
		if (!id) return false;

		set({ isPublishing: true });

		try {
			const response = await fetch(`/api/flows/${id}/activate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}), // Sem phoneNumberId = responde em qualquer número
			});

			if (!response.ok) throw new Error('Failed to publish workflow');

			set({ isActive: true, isPublishing: false });
			return true;
		} catch (error) {
			console.error('Error publishing workflow:', error);
			set({ isPublishing: false });
			return false;
		}
	},

	unpublishWorkflow: async () => {
		const { workflowId } = get();
		if (!workflowId) return false;

		set({ isPublishing: true });

		try {
			const response = await fetch(`/api/flows/${workflowId}/activate`, {
				method: 'DELETE',
			});

			if (!response.ok) throw new Error('Failed to unpublish workflow');

			set({ isActive: false, isPublishing: false });
			return true;
		} catch (error) {
			console.error('Error unpublishing workflow:', error);
			set({ isPublishing: false });
			return false;
		}
	},

	testWorkflow: async (): Promise<TestResult> => {
		const { workflowId, nodes, edges } = get();

		set({ isTesting: true, lastTestResult: null });

		try {
			// Buscar settings do localStorage
			const settingsStr = typeof window !== 'undefined'
				? localStorage.getItem('smartzap_settings')
				: null;

			const response = await fetch('/api/flows/test', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'x-settings': settingsStr || '{}',
				},
				body: JSON.stringify({
					flowId: workflowId,
					nodes,
					edges,
				}),
			});

			const data = await response.json();

			// Combinar error único com array de errors
			const errorMessage = data.error || (data.errors?.length > 0 ? data.errors.join('; ') : undefined);

			const result: TestResult = {
				success: data.success,
				executionId: data.executionId,
				status: data.status,
				nodesExecuted: data.nodesExecuted,
				messagesSent: data.messagesSent,
				error: errorMessage,
				testContact: data.testContact,
			};

			// Log para debug
			console.log('Test API response:', data);

			set({ isTesting: false, lastTestResult: result });
			return result;
		} catch (error) {
			console.error('Error testing workflow:', error);
			const result: TestResult = {
				success: false,
				error: error instanceof Error ? error.message : 'Erro ao executar teste',
			};
			set({ isTesting: false, lastTestResult: result });
			return result;
		}
	},

	// 🎯 Auto-layout: reorganiza nós automaticamente
	autoLayout: (direction: 'TB' | 'LR' = 'TB') => {
		const { nodes, edges } = get();
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			{ direction }
		);
		set({
			nodes: layoutedNodes as FlowNode[],
			edges: layoutedEdges as FlowEdge[],
			hasUnsavedChanges: true
		});
	},
}));

export { useWorkflow };
