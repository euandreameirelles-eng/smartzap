"use client";

/**
 * CanvasControls - Controles customizados do canvas (Estilo Langflow)
 * 
 * Features:
 * - Zoom controls
 * - Fit view
 * - Save workflow
 * - Settings
 */

import { useReactFlow } from "@xyflow/react";
import { 
	ZoomIn, 
	ZoomOut, 
	Maximize2, 
	Settings,
	Download,
	Upload,
	Save,
	Loader2,
	Circle,
	Home,
	Power,
	Play,
	AlertCircle,
	CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import { useState, useEffect } from "react";
import Link from "next/link";

export function CanvasControls() {
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const [showNameInput, setShowNameInput] = useState(false);
	const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	
	const { 
		workflowName, 
		setWorkflowName, 
		hasUnsavedChanges, 
		isSaving, 
		saveWorkflow,
		isActive,
		isPublishing,
		publishWorkflow,
		unpublishWorkflow,
		isTesting,
		lastTestResult,
		testWorkflow,
		validationState,
	} = useWorkflow(
		(state) => ({
			workflowName: state.workflowName,
			setWorkflowName: state.setWorkflowName,
			hasUnsavedChanges: state.hasUnsavedChanges,
			isSaving: state.isSaving,
			saveWorkflow: state.saveWorkflow,
			isActive: state.isActive,
			isPublishing: state.isPublishing,
			publishWorkflow: state.publishWorkflow,
			unpublishWorkflow: state.unpublishWorkflow,
			isTesting: state.isTesting,
			lastTestResult: state.lastTestResult,
			testWorkflow: state.testWorkflow,
			validationState: state.validationState,
		})
	);

	// Auto-hide test message after 5 seconds
	useEffect(() => {
		if (testMessage) {
			const timer = setTimeout(() => setTestMessage(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [testMessage]);

	const handleSave = async () => {
		const result = await saveWorkflow();
		if (result) {
			console.log('Workflow salvo:', result);
		}
	};

	const handlePublish = async () => {
		if (isActive) {
			await unpublishWorkflow();
		} else {
			await publishWorkflow();
		}
	};

	const handleTest = async () => {
		console.log('Validation state:', validationState);
		const result = await testWorkflow();
		console.log('Teste executado:', result);
		
		// Show feedback message
		if (result.success) {
			setTestMessage({
				type: 'success',
				text: `✓ ${result.messagesSent || 0} mensagem(s) enviada(s) para ${result.testContact || 'contato de teste'}`
			});
		} else {
			setTestMessage({
				type: 'error',
				text: result.error || 'Erro ao executar teste'
			});
		}
	};

	return (
		<>
			{/* Toast de feedback do teste */}
			{testMessage && (
				<div className={cn(
					"fixed top-20 left-1/2 -translate-x-1/2 z-50",
					"flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg",
					"animate-in slide-in-from-top-2 fade-in-0 duration-300",
					testMessage.type === 'success' 
						? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300" 
						: "bg-red-500/20 border border-red-500/50 text-red-300"
				)}>
					{testMessage.type === 'success' ? (
						<CheckCircle className="h-4 w-4" />
					) : (
						<AlertCircle className="h-4 w-4" />
					)}
					<span className="text-sm">{testMessage.text}</span>
					<button 
						onClick={() => setTestMessage(null)}
						className="ml-2 hover:opacity-70"
					>
						×
					</button>
				</div>
			)}
			
			<div className={cn(
				"flex items-center gap-1 p-1",
				"bg-zinc-800/90 backdrop-blur-sm",
				"border border-zinc-700 rounded-lg shadow-xl"
			)}>
				{/* Botão Voltar */}
				<Link href="/">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
					title="Voltar ao Dashboard"
				>
					<Home className="h-4 w-4" />
				</Button>
			</Link>

			<Separator orientation="vertical" className="h-6 bg-zinc-700" />

			{/* Nome do workflow */}
			{showNameInput ? (
				<Input
					value={workflowName}
					onChange={(e) => setWorkflowName(e.target.value)}
					onBlur={() => setShowNameInput(false)}
					onKeyDown={(e) => e.key === 'Enter' && setShowNameInput(false)}
					className="h-8 w-40 text-sm bg-zinc-900 border-zinc-600"
					autoFocus
				/>
			) : (
				<button
					onClick={() => setShowNameInput(true)}
					className="px-2 h-8 text-sm text-zinc-300 hover:text-zinc-100 truncate max-w-40"
					title="Clique para editar nome"
				>
					{workflowName}
				</button>
			)}

			{/* Indicador de alterações não salvas */}
			{hasUnsavedChanges && (
				<Circle className="h-2 w-2 fill-amber-400 text-amber-400" />
			)}

			{/* Indicador de ativo */}
			{isActive && (
				<span className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded flex items-center gap-1">
					<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
					Ativo
				</span>
			)}

			<Separator orientation="vertical" className="h-6 bg-zinc-700" />

			{/* Botão Salvar */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handleSave}
				disabled={isSaving || !hasUnsavedChanges}
				className={cn(
					"h-8 w-8 hover:bg-zinc-700",
					hasUnsavedChanges 
						? "text-primary-400 hover:text-primary-300" 
						: "text-zinc-400 hover:text-zinc-100"
				)}
				title={hasUnsavedChanges ? "Salvar workflow" : "Sem alterações"}
			>
				{isSaving ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Save className="h-4 w-4" />
				)}
			</Button>

			{/* Botão Publicar */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handlePublish}
				disabled={isPublishing}
				className={cn(
					"h-8 w-8 hover:bg-zinc-700",
					isActive 
						? "text-emerald-400 hover:text-red-400" 
						: "text-zinc-400 hover:text-emerald-400"
				)}
				title={isActive ? "Desativar workflow" : "Publicar workflow"}
			>
				{isPublishing ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Power className="h-4 w-4" />
				)}
			</Button>

			{/* Botão Testar */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handleTest}
				disabled={isTesting}
				className={cn(
					"h-8 w-8 hover:bg-zinc-700",
					lastTestResult?.success
						? "text-emerald-400"
						: lastTestResult?.error
							? "text-red-400"
							: "text-primary-400 hover:text-primary-300"
				)}
				title={
					lastTestResult?.success 
						? `✓ ${lastTestResult.messagesSent || 0} msgs enviadas`
						: lastTestResult?.error || "Testar fluxo"
				}
			>
				{isTesting ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Play className="h-4 w-4" />
				)}
			</Button>

			<Separator orientation="vertical" className="h-6 bg-zinc-700" />

			<Button
				variant="ghost"
				size="icon"
				onClick={() => zoomIn()}
				className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				title="Aumentar zoom"
			>
				<ZoomIn className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onClick={() => zoomOut()}
				className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				title="Diminuir zoom"
			>
				<ZoomOut className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onClick={() => fitView({ padding: 0.2 })}
				className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				title="Ajustar à tela"
			>
				<Maximize2 className="h-4 w-4" />
			</Button>

			<Separator orientation="vertical" className="h-6 bg-zinc-700" />

			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				title="Exportar workflow"
			>
				<Download className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				title="Importar workflow"
			>
				<Upload className="h-4 w-4" />
			</Button>

			<Separator orientation="vertical" className="h-6 bg-zinc-700" />

			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
				title="Configurações"
			>
				<Settings className="h-4 w-4" />
			</Button>
		</div>
		</>
	);
}
