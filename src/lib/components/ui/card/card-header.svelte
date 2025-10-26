<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: CardHeaderProps = $props();
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
