<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSignup() {
		loading = true;
		error = null;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		try {
			const { error: signUpError } = await data.supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (signUpError) {
				error = signUpError.message;
			} else {
				success = true;
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
				<CardTitle>Create Account</CardTitle>
				<CardDescription>Sign up to get started with your subscription</CardDescription>
			</CardHeader>
			<CardContent>
				{#if success}
					<div class="bg-green-50 text-green-800 px-4 py-3 rounded-md">
						<p class="font-medium">Account created successfully!</p>
						<p class="text-sm mt-1">
							Please check your email to verify your account before signing in.
						</p>
					</div>
				{:else}
					<form onsubmit={(e) => { e.preventDefault(); handleSignup(); }} class="space-y-4">
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

						<div class="space-y-2">
							<label for="confirm-password" class="text-sm font-medium">Confirm Password</label>
							<input
								id="confirm-password"
								type="password"
								bind:value={confirmPassword}
								required
								class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="••••••••"
							/>
						</div>

						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? 'Creating account...' : 'Sign Up'}
						</Button>

						<p class="text-sm text-center text-muted-foreground">
							Already have an account? <a href="/auth/login" class="text-primary hover:underline"
								>Sign in</a
							>
						</p>
					</form>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
