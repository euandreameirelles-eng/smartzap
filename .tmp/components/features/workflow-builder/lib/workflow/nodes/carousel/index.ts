import { carouselClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/carousel/carousel.client";
import { carouselServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/carousel/carousel.server";
import {
	type CarouselNode,
	carouselSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/carousel/carousel.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const carouselNodeDefinition = {
	shared: carouselSharedDefinition,
	client: carouselClientDefinition,
	server: carouselServerDefinition,
} as NodeDefinition<CarouselNode>;
