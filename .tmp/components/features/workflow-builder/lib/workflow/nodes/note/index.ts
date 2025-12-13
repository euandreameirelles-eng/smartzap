import { noteClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/note/note.client";
import { noteServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/note/note.server";
import {
	type NoteNode,
	noteSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/note/note.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const noteNodeDefinition: NodeDefinition<NoteNode> = {
	shared: noteSharedDefinition,
	client: noteClientDefinition,
	server: noteServerDefinition,
};
