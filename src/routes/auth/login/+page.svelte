<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin() {
		loading = true;
		error = null;

		try {
			const { error: signInError } = await data.supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) {
				error = signInError.message;
			} else {
				window.location.href = '/dashboard';
			}
		} catch (e) {
			error = 'An unexpected error occurred';
			console.error(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-16">
	<div class="max-w-md mx-auto">
		<Card>
			<CardHeader>
				<CardTitle>Sign In</CardTitle>
				<CardDescription>Enter your credentials to access your account</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
					{#if error}
						<div class="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
							{error}
						</div>
					{/if}

					<div class="space-y-2">
						<label for="email" class="text-sm font-medium">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="you@example.com"
						/>
					</div>

					<div class="space-y-2">
						<label for="password" class="text-sm font-medium">Password</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="••••••••"
						/>
					</div>

					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</Button>

					<p class="text-sm text-center text-muted-foreground">
						Don't have an account? <a href="/auth/signup" class="text-primary hover:underline"
							>Sign up</a
						>
					</p>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
