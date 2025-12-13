import { ctaUrlClientDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/cta-url/cta-url.client";
import { ctaUrlServerDefinition } from "@/components/features/workflow-builder/lib/workflow/nodes/cta-url/cta-url.server";
import {
	type CtaUrlNode,
	ctaUrlSharedDefinition,
} from "@/components/features/workflow-builder/lib/workflow/nodes/cta-url/cta-url.shared";
import type { NodeDefinition } from "@/components/features/workflow-builder/types/workflow";

export const ctaUrlNodeDefinition = {
	shared: ctaUrlSharedDefinition,
	client: ctaUrlClientDefinition,
	server: ctaUrlServerDefinition,
} as NodeDefinition<CtaUrlNode>;
