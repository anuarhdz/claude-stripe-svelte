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

	const isSuccess = data.fulfillmentResult?.success;
</script>

<div class="container mx-auto px-4 py-16">
	<div class="max-w-2xl mx-auto">
		{#if isSuccess}
			<!-- Success State -->
			<Card class="border-green-200 bg-green-50">
				<CardHeader>
					<div class="flex items-center gap-3">
						<div class="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
							<svg
								class="h-6 w-6 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								></path>
							</svg>
						</div>
						<div>
							<CardTitle class="text-green-900">Payment Successful!</CardTitle>
							<CardDescription class="text-green-700">
								Your subscription is now active
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="text-green-900">
					<div class="space-y-4">
						<p class="text-lg">
							Thank you for subscribing! Your payment has been processed successfully.
						</p>

						{#if data.alreadyFulfilled}
							<div class="bg-white/50 rounded-lg p-4 border border-green-300">
								<p class="text-sm text-green-800">
									<strong>Note:</strong> Your subscription was already activated. This page can be
									safely refreshed.
								</p>
							</div>
						{:else}
							<div class="bg-white/50 rounded-lg p-4 border border-green-300">
								<p class="text-sm text-green-800">
									<strong>What's next?</strong> Your account has been upgraded and you now have
									access to all premium features.
								</p>
							</div>
						{/if}

						{#if data.status?.data}
							<div class="bg-white/50 rounded-lg p-4 border border-green-300">
								<h3 class="font-semibold mb-2 text-green-900">Order Details</h3>
								<dl class="space-y-1 text-sm">
									<div class="flex justify-between">
										<dt class="text-green-700">Session ID:</dt>
										<dd class="font-mono text-xs text-green-900">
											{data.sessionId.slice(0, 20)}...
										</dd>
									</div>
									{#if data.status.data.session_data?.amount_total}
										<div class="flex justify-between">
											<dt class="text-green-700">Amount:</dt>
											<dd class="text-green-900">
												{(data.status.data.session_data.amount_total / 100).toFixed(2)}
												{data.status.data.session_data.currency?.toUpperCase()}
											</dd>
										</div>
									{/if}
									<div class="flex justify-between">
										<dt class="text-green-700">Fulfilled:</dt>
										<dd class="text-green-900">
											{new Date(data.status.data.fulfilled_at).toLocaleString()}
										</dd>
									</div>
								</dl>
							</div>
						{/if}
					</div>
				</CardContent>
				<CardFooter class="flex gap-3">
					<Button onclick={() => (window.location.href = '/dashboard')}>
						Go to Dashboard
					</Button>
					<Button variant="outline" onclick={() => (window.location.href = '/')}>
						Back to Home
					</Button>
				</CardFooter>
			</Card>
		{:else}
			<!-- Error State -->
			<Card class="border-yellow-200 bg-yellow-50">
				<CardHeader>
					<div class="flex items-center gap-3">
						<div class="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
							<svg
								class="h-6 w-6 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								></path>
							</svg>
						</div>
						<div>
							<CardTitle class="text-yellow-900">Payment Processing</CardTitle>
							<CardDescription class="text-yellow-700">
								Your payment is being processed
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="text-yellow-900">
					<p class="mb-4">
						We've received your payment, but it's still being processed. This can happen with
						certain payment methods like bank transfers.
					</p>
					<div class="bg-white/50 rounded-lg p-4 border border-yellow-300">
						<p class="text-sm text-yellow-800">
							You'll receive an email confirmation once your payment is complete and your
							subscription is activated.
						</p>
					</div>
					{#if data.fulfillmentResult?.error}
						<div class="mt-4 bg-white/50 rounded-lg p-4 border border-yellow-300">
							<p class="text-sm text-yellow-800">
								<strong>Technical details:</strong>
								{data.fulfillmentResult.error}
							</p>
						</div>
					{/if}
				</CardContent>
				<CardFooter class="flex gap-3">
					<Button variant="outline" onclick={() => (window.location.href = '/dashboard')}>
						Go to Dashboard
					</Button>
					<Button variant="outline" onclick={() => (window.location.href = '/')}>
						Back to Home
					</Button>
				</CardFooter>
			</Card>
		{/if}

		<!-- Additional Help Section -->
		<div class="mt-8 text-center text-sm text-muted-foreground">
			<p>
				Have questions? Contact our support team at
				<a href="mailto:support@example.com" class="text-primary hover:underline">
					support@example.com
				</a>
			</p>
		</div>
	</div>
</div>
