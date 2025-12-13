"use client";

/**
 * FlowPage - Componente principal do Workflow 2.0 (Estilo Langflow)
 * 
 * Estrutura:
 * - FlowSidebar: Componentes arrastáveis (collapsible offcanvas)
 * - FlowCanvas: ReactFlow canvas com controles
 */

import { FlowSidebar } from "./flow-sidebar";
import { FlowCanvas } from "./flow-canvas";
import { SidebarInset } from "@/components/ui/sidebar";

export function FlowPage() {
	return (
		<>
			<FlowSidebar />
			<SidebarInset className="flex-1 overflow-hidden">
				<FlowCanvas />
			</SidebarInset>
		</>
	);
}
