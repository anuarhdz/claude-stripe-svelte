<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state<string | null>(null);

	async function handleSubscribe(priceId: string) {
		loading = priceId;
		try {
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ priceId })
			});

			if (!response.ok) {
				throw new Error('Failed to create checkout session');
			}

			const { url } = await response.json();

			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			console.error('Error creating checkout session:', error);
			alert('Failed to create checkout session. Please try again.');
		} finally {
			loading = null;
		}
	}

	function formatPrice(amount: number | null, currency: string) {
		if (amount === null) return 'Free';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency.toUpperCase(),
			minimumFractionDigits: 0
		}).format(amount / 100);
	}
</script>

<div class="container mx-auto px-4 py-16">
	<div class="text-center mb-12">
		<h1 class="text-4xl font-bold mb-4">Choose Your Plan</h1>
		<p class="text-lg text-muted-foreground">
			Select the perfect plan for your needs. Cancel anytime.
		</p>
	</div>

	{#if data.products && data.products.length > 0}
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
			{#each data.products as product}
				{#if product.prices && product.prices.length > 0}
					{#each product.prices as price}
						<Card class="flex flex-col">
							<CardHeader>
								<CardTitle>{product.name}</CardTitle>
								{#if product.description}
									<CardDescription>{product.description}</CardDescription>
								{/if}
							</CardHeader>
							<CardContent class="flex-grow">
								<div class="mb-4">
									<span class="text-4xl font-bold">
										{formatPrice(price.unit_amount, price.currency)}
									</span>
									{#if price.type === 'recurring' && price.interval}
										<span class="text-muted-foreground">
											/{price.interval}
										</span>
									{/if}
								</div>
								{#if price.trial_period_days}
									<p class="text-sm text-muted-foreground mb-4">
										{price.trial_period_days} day free trial
									</p>
								{/if}
							</CardContent>
							<CardFooter>
								<Button
									class="w-full"
									onclick={() => handleSubscribe(price.id)}
									disabled={loading === price.id || !data.user}
								>
									{#if loading === price.id}
										Loading...
									{:else if !data.user}
										Sign in to subscribe
									{:else}
										Subscribe
									{/if}
								</Button>
							</CardFooter>
						</Card>
					{/each}
				{/if}
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-muted-foreground">
				No pricing plans available at the moment. Please check back later.
			</p>
		</div>
	{/if}

	{#if !data.user}
		<div class="text-center mt-8">
			<p class="text-sm text-muted-foreground">
				You must be signed in to subscribe. <a href="/auth/login" class="text-primary hover:underline"
					>Sign in</a
				>
			</p>
		</div>
	{/if}
</div>
