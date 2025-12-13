"use client";

import type { NodeProps } from "@xyflow/react";
import { FileText } from "lucide-react";
import { memo } from "react";
import { nanoid } from "nanoid";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ResizableNode } from "@/components/features/workflow-builder/components/workflow/primitives/resizable-node";
import { useWorkflow } from "@/components/features/workflow-builder/hooks/use-workflow";
import type { NoteNode as NoteNodeType } from "@/components/features/workflow-builder/lib/workflow/nodes/note/note.shared";
import type { NodeClientDefinition } from "@/components/features/workflow-builder/types/workflow";

export interface NoteNodeProps extends NodeProps<NoteNodeType> {}

function NoteNodeComponent({ id, selected, data }: NoteNodeProps) {
	const updateNode = useWorkflow((store) => store.updateNode);

	const handleContentChange = (content: string) => {
		updateNode({
			id,
			nodeType: "note",
			data: { content },
		});
	};

	return (
		<ResizableNode selected={selected} className="p-4">
			<Textarea
				value={data.content}
				onChange={(e) => handleContentChange(e.target.value)}
				placeholder="Enter your note here..."
				className={cn(
					"h-full w-full resize-none border-none bg-transparent dark:bg-transparent focus-visible:ring-0 p-0 shadow-none",
					"placeholder:text-muted-foreground/50 text-sm",
					"nodrag nopan nowheel cursor-auto",
				)}
			/>
		</ResizableNode>
	);
}

export const NoteNode = memo(NoteNodeComponent);

export function NoteNodePanel() {
	return null;
}

export function createNoteNode(position: {
	x: number;
	y: number;
}): NoteNodeType {
	return {
		id: nanoid(),
		type: "note",
		position,
		data: {
			content: "",
		},
	};
}

export const noteClientDefinition: NodeClientDefinition<NoteNodeType> = {
	component: NoteNode,
	panelComponent: NoteNodePanel,
	create: createNoteNode,
	meta: {
		label: "Note",
		icon: FileText,
		description: "A resizable text note",
	},
};
