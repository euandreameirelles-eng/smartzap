import {
	type Edge,
	type EdgeProps,
	BaseEdge as FlowBaseEdge,
	getBezierPath,
} from "@xyflow/react";
import { memo, type CSSProperties } from "react";
import type { ValidationError } from "@/components/features/workflow-builder/types/workflow";

export type StatusEdgeData = {
	execution?: {
		error?: {
			type: string;
			message: string;
			[key: string]: unknown;
		};
		running?: boolean;
	};
	validationErrors?: ValidationError[];
};

export type StatusEdge = Edge<StatusEdgeData, "status">;

export interface StatusEdgeProps extends EdgeProps<StatusEdge> { }

export const StatusEdge = memo(function StatusEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
	selected,
}: StatusEdgeProps) {
	const [edgePath] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const validationErrors = data?.validationErrors || [];
	const hasValidationError = validationErrors.length > 0;
	const isRunning = data?.execution?.running;

	const getEdgeColor = () => {
		if (hasValidationError) {
			return "#ef4444";
		}
		// Execution errors
		if (data?.execution?.error) {
			return "#f97316";
		}
		// Running state - use animated gradient
		if (isRunning) {
			return "url(#edge-gradient-animated)";
		}
		// Selected state
		if (selected) {
			return "#3b82f6";
		}
		return "#71717a";
	};

	const edgeStyle: CSSProperties = {
		stroke: getEdgeColor(),
		strokeWidth: hasValidationError ? 3 : selected || isRunning ? 3 : 2,
		strokeDasharray: hasValidationError ? "5,5" : "0",
		transition: "stroke 0.2s, stroke-width 0.2s, stroke-dasharray 0.2s",
	};

	return (
		<>
			{/* SVG Definitions for animated gradient */}
			<svg style={{ position: "absolute", width: 0, height: 0 }}>
				<defs>
					<linearGradient id="edge-gradient-animated" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#9c8aec">
							<animate
								attributeName="stop-color"
								values="#9c8aec;#ff82b8;#ffa564;#9c8aec"
								dur="3s"
								repeatCount="indefinite"
							/>
						</stop>
						<stop offset="50%" stopColor="#ff82b8">
							<animate
								attributeName="stop-color"
								values="#ff82b8;#ffa564;#9c8aec;#ff82b8"
								dur="3s"
								repeatCount="indefinite"
							/>
						</stop>
						<stop offset="100%" stopColor="#ffa564">
							<animate
								attributeName="stop-color"
								values="#ffa564;#9c8aec;#ff82b8;#ffa564"
								dur="3s"
								repeatCount="indefinite"
							/>
						</stop>
					</linearGradient>

					{/* Gradient for selected state */}
					<linearGradient id="edge-gradient-selected" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#3b82f6" />
						<stop offset="100%" stopColor="#8b5cf6" />
					</linearGradient>
				</defs>
			</svg>

			<FlowBaseEdge
				path={edgePath}
				style={edgeStyle}
				interactionWidth={20}
			/>
		</>
	);
});

