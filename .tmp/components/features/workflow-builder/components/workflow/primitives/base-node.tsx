import { memo, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NodeCategory =
	| "trigger"    // Start, webhook (orange)
	| "message"    // Message, buttons, list, etc (emerald)
	| "ai"         // AI responses, agents (violet)
	| "flow"       // Conditions, delays (blue)
	| "media"      // Images, audio, video (pink)
	| "data";      // Templates, variables (cyan)

export interface BaseNodeProps extends ComponentProps<"div"> {
	selected?: boolean;
	category?: NodeCategory;
	icon?: ReactNode;
	title?: string;
	status?: "success" | "error" | "warning" | "running";
}

export const BaseNode = memo(function BaseNode({
	className,
	selected,
	category = "message",
	icon,
	title,
	status,
	children,
	...props
}: BaseNodeProps) {
	const categoryClass = `node-category-${category}`;

	return (
		<div
			className={cn(
				"langflow-node",
				categoryClass,
				className,
				selected && "selected",
			)}
			tabIndex={0}
			{...props}
		>
			{/* Status indicator (top-right dot) */}
			{status && (
				<div className={cn("node-status", `node-status-${status}`)} />
			)}

			{/* Header with icon and title */}
			{(icon || title) && (
				<div className="langflow-node-header">
					{icon && (
						<div className="langflow-node-icon">
							{icon}
						</div>
					)}
					{title && (
						<span className="langflow-node-title">{title}</span>
					)}
				</div>
			)}

			{/* Node content */}
			{children && (
				<div className="langflow-node-content">
					{children}
				</div>
			)}
		</div>
	);
});
