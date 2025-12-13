import { Panel } from "@xyflow/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import { nodeRegistry } from "@/components/features/workflow-builder/lib/workflow/nodes";
import type { FlowNode } from "@/components/features/workflow-builder/types/workflow";

export function NodeEditorPanel({ nodeId, onClose }: { nodeId: FlowNode["id"]; onClose?: () => void }) {
	const node = useWorkflow((state) => state.getNodeById(nodeId));
	
	if (!node) {
		return null;
	}

	if (node.type === "note") {
		return null;
	}

	// Dynamic node type access - verified at runtime
	const definition = nodeRegistry[node.type as keyof typeof nodeRegistry];
	
	if (!definition) {
		return null;
	}

	const PanelComponent = definition.client.panelComponent;

	return (
		<Panel position="top-right" className="m-3 w-72">
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
					<div className="flex items-center gap-2">
						<definition.client.meta.icon className="w-4 h-4 text-primary-400" />
						<span className="text-sm font-medium text-zinc-200">{definition.client.meta.label}</span>
					</div>
					{onClose && (
						<Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-200" onClick={onClose}>
							<X className="w-4 h-4" />
						</Button>
					)}
				</div>
				{/* Content */}
				<div className="p-3 max-h-[calc(100vh-10rem)] overflow-y-auto">
					<PanelComponent node={node} />
				</div>
			</div>
		</Panel>
	);
}
