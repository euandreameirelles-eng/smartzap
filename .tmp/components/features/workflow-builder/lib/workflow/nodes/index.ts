import { agentNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/agent";
import { audioNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/audio";
import { buttonsNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/buttons";
import { carouselNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/carousel";
import { contactsNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/contacts";
import { ctaUrlNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/cta-url";
import { delayNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/delay";
import { documentNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/document";
import { endNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/end";
import { ifElseNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/if-else";
import { imageNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/image";
import { inputNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/input";
import { listNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/list";
import { locationNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/location";
import { menuNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/menu";
import { messageNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/message";
import { noteNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/note";
import { startNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/start";
import { stickerNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/sticker";
import { templateNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/template";
import { videoNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/video";
import { waitNodeDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/wait";
import type {
	AnyNodeDefinition,
	FlowNodeType,
} from "@/components/features/workflow-builder/types/workflow";

const nodeDefinitions = {
	// Controle de fluxo
	start: startNodeDefinition,
	end: endNodeDefinition,
	"if-else": ifElseNodeDefinition,
	wait: waitNodeDefinition,
	delay: delayNodeDefinition,
	
	// Mensagens de texto
	message: messageNodeDefinition,
	template: templateNodeDefinition,
	
	// Interativos
	menu: menuNodeDefinition,
	buttons: buttonsNodeDefinition,
	list: listNodeDefinition,
	"cta-url": ctaUrlNodeDefinition,
	carousel: carouselNodeDefinition,
	
	// Mídia
	image: imageNodeDefinition,
	video: videoNodeDefinition,
	audio: audioNodeDefinition,
	document: documentNodeDefinition,
	sticker: stickerNodeDefinition,
	location: locationNodeDefinition,
	contacts: contactsNodeDefinition,
	
	// Avançado
	input: inputNodeDefinition,
	agent: agentNodeDefinition,
	
	// Utilitário
	note: noteNodeDefinition,
} as const;

export const nodeRegistry = nodeDefinitions;

export function getNodeDefinition<T extends FlowNodeType>(
	type: T,
): (typeof nodeRegistry)[T] {
	return nodeRegistry[type];
}

export function getAllNodeDefinitions(): AnyNodeDefinition[] {
	return Object.values(nodeRegistry);
}
