import type { NoteNode } from "@/components/features/workflow-builder/lib/workflow/nodes/note/note.shared";
import type {
	ExecutionContext,
	NodeExecutionResult,
	NodeServerDefinition,
} from "@/components/features/workflow-builder/types/workflow";

function executeNoteNode(
	_context: ExecutionContext<NoteNode>,
): NodeExecutionResult {
	throw new Error("Note nodes should not be executed");
}

export const noteServerDefinition: NodeServerDefinition<NoteNode> = {
	execute: executeNoteNode,
};
