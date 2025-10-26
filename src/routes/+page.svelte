<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	async function handleLogout() {
		await fetch('/auth/logout', { method: 'POST' });
		window.location.href = '/';
	}
</script>

<div class="min-h-screen flex flex-col">
	<!-- Navigation -->
	<nav class="border-b">
		<div class="container mx-auto px-4 py-4 flex items-center justify-between">
			<a href="/" class="text-2xl font-bold">SaaS App</a>
			<div class="flex items-center gap-4">
				<a href="/pricing" class="text-sm hover:text-primary">Pricing</a>
				{#if data.user}
					<a href="/dashboard" class="text-sm hover:text-primary">Dashboard</a>
					<Button variant="outline" size="sm" onclick={handleLogout}>Sign Out</Button>
				{:else}
					<a href="/auth/login">
						<Button variant="outline" size="sm">Sign In</Button>
					</a>
					<a href="/auth/signup">
						<Button size="sm">Get Started</Button>
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<main class="grow">
		<div class="container mx-auto px-4 py-24 text-center">
			<h1 class="text-5xl font-bold mb-6">
				Build Your SaaS with <span class="text-primary">Stripe & Supabase</span>
			</h1>
			<p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
				A complete SvelteKit starter with Stripe subscriptions, Supabase authentication, and
				beautiful UI components.
			</p>
			<div class="flex gap-4 justify-center">
				{#if data.user}
					<a href="/dashboard">
						<Button size="lg">Go to Dashboard</Button>
					</a>
				{:else}
					<a href="/auth/signup">
						<Button size="lg">Get Started</Button>
					</a>
				{/if}
				<a href="/pricing">
					<Button variant="outline" size="lg">View Pricing</Button>
				</a>
			</div>
		</div>

		<!-- Features Section -->
		<div class="bg-secondary/50 py-24">
			<div class="container mx-auto px-4">
				<h2 class="text-3xl font-bold text-center mb-12">Features</h2>
				<div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
					<div class="text-center">
						<div class="text-4xl mb-4">💳</div>
						<h3 class="text-xl font-semibold mb-2">Stripe Integration</h3>
						<p class="text-muted-foreground">
							Complete subscription lifecycle with Stripe Checkout and webhooks
						</p>
					</div>
					<div class="text-center">
						<div class="text-4xl mb-4">🔐</div>
						<h3 class="text-xl font-semibold mb-2">Supabase Auth</h3>
						<p class="text-muted-foreground">
							Secure authentication and database with Row Level Security
						</p>
					</div>
					<div class="text-center">
						<div class="text-4xl mb-4">🎨</div>
						<h3 class="text-xl font-semibold mb-2">shadcn-svelte UI</h3>
						<p class="text-muted-foreground">
							Beautiful, accessible components built with Tailwind CSS
						</p>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t py-8">
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			<p>Built with SvelteKit, Stripe, Supabase, and shadcn-svelte</p>
		</div>
	</footer>
</div>
