<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
		children?: Snippet;
		class?: string;
		tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, children, tag = 'h3', ...restProps }: CardTitleProps = $props();
</script>

<svelte:element
	this={tag}
	class={cn('text-2xl font-semibold leading-none tracking-tight', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
