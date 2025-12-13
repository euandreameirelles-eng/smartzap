import { Handle } from "@xyflow/react";
import { memo, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface BaseHandleProps extends ComponentProps<typeof Handle> {
	/** Se true, o handle usa posição dinâmica via style.top */
	dynamic?: boolean;
}

/**
 * BaseHandle - Handle com área de clique grande estilo Langflow
 * 
 * Técnica: Handle invisível de 32x32px com círculo visual pequeno (10px)
 * Isso facilita muito a conexão entre nós!
 */
export const BaseHandle = memo(function BaseHandle({ 
	className,
	style,
	dynamic,
	...props 
}: BaseHandleProps) {
	return (
		<Handle 
			className={cn(
				// Handle invisível grande (hitbox) - fácil de clicar
				"w-8! h-8!",
				// Reset visual do handle padrão
				"bg-transparent! border-0!",
				// Cursor de mira para indicar conexão
				"cursor-crosshair",
				// O círculo visual é via pseudo-element
				"after:content-[''] after:absolute",
				"after:top-1/2 after:left-1/2",
				"after:-translate-x-1/2 after:-translate-y-1/2",
				// Tamanho do círculo visual (10px)
				"after:w-2.5 after:h-2.5",
				"after:rounded-full",
				// Cor do círculo
				"after:bg-primary-500",
				"after:border-2 after:border-zinc-900",
				// Efeitos de hover - cresce e brilha
				"after:transition-all after:duration-200",
				"hover:after:w-3.5 hover:after:h-3.5",
				"hover:after:shadow-[0_0_8px_2px_rgba(16,185,129,0.6)]",
				// Quando conectando - pulsa
				"in-[.connecting]:after:animate-pulse",
				"in-[.connecting]:after:w-4 in-[.connecting]:after:h-4",
				className
			)}
			style={{
				// Remove estilos padrão do ReactFlow
				background: "transparent",
				border: "none",
				...style,
			}}
			data-dynamic={dynamic ? "true" : undefined}
			{...props} 
		/>
	);
});
