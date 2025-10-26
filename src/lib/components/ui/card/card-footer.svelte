<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: CardFooterProps = $props();
</script>

<div class={cn('flex items-center p-6 pt-0', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
