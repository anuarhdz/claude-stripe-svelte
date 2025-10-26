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

	let loading = $state(false);

	async function handleManageSubscription() {
		loading = true;
		try {
			const response = await fetch('/api/stripe/portal', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to create portal session');
			}

			const { url } = await response.json();

			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			console.error('Error creating portal session:', error);
			alert('Failed to open customer portal. Please try again.');
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return 'N/A';

		const date = new Date(dateString);

		// Check if date is valid
		if (isNaN(date.getTime())) return 'N/A';

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'text-green-600';
			case 'trialing':
				return 'text-blue-600';
			case 'past_due':
				return 'text-yellow-600';
			case 'canceled':
			case 'incomplete_expired':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	function getStatusLabel(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
	}
</script>

<div class="container mx-auto px-4 py-16">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold mb-8">Dashboard</h1>

		{#if data.subscription}
			<Card class="mb-8">
				<CardHeader>
					<CardTitle>Subscription Status</CardTitle>
					<CardDescription>Manage your subscription and billing</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Status</p>
							<p class="font-medium {getStatusColor(data.subscription.status)}">
								{getStatusLabel(data.subscription.status)}
							</p>
						</div>
						<div>
							<p class="text-sm text-muted-foreground mb-1">Plan</p>
							<p class="font-medium">
								{data.subscription.prices?.products?.name || 'N/A'}
							</p>
						</div>
						<div>
							<p class="text-sm text-muted-foreground mb-1">Current Period Start</p>
							<p class="font-medium">
								{formatDate(data.subscription.current_period_start)}
							</p>
						</div>
						<div>
							<p class="text-sm text-muted-foreground mb-1">Current Period End</p>
							<p class="font-medium">
								{formatDate(data.subscription.current_period_end)}
							</p>
						</div>
						{#if data.subscription.trial_end}
							<div>
								<p class="text-sm text-muted-foreground mb-1">Trial Ends</p>
								<p class="font-medium">{formatDate(data.subscription.trial_end)}</p>
							</div>
						{/if}
						{#if data.subscription.cancel_at_period_end}
							<div class="md:col-span-2">
								<p class="text-sm text-muted-foreground mb-1">Cancellation</p>
								<p class="font-medium text-yellow-600">
									Your subscription will cancel on {formatDate(
										data.subscription.current_period_end
									)}
								</p>
							</div>
						{/if}
					</div>
				</CardContent>
				<CardFooter>
					<Button onclick={handleManageSubscription} disabled={loading}>
						{loading ? 'Loading...' : 'Manage Subscription'}
					</Button>
				</CardFooter>
			</Card>
		{:else}
			<Card>
				<CardHeader>
					<CardTitle>No Active Subscription</CardTitle>
					<CardDescription>You don't have an active subscription yet</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-muted-foreground mb-4">
						Subscribe to a plan to unlock all features and start using the platform.
					</p>
				</CardContent>
				<CardFooter>
					<Button onclick={() => (window.location.href = '/pricing')}>
						View Pricing Plans
					</Button>
				</CardFooter>
			</Card>
		{/if}

		<!-- Additional dashboard content can go here -->
		<div class="mt-8">
			<h2 class="text-2xl font-bold mb-4">Welcome, {data.user?.email || 'User'}!</h2>
			<p class="text-muted-foreground">
				This is your dashboard. Here you can manage your subscription, view your account details,
				and access all features.
			</p>
		</div>
	</div>
</div>
