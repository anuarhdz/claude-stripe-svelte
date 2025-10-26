<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: CardDescriptionProps = $props();
</script>

<p class={cn('text-sm text-muted-foreground', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</p>
