/**
 * Check if a subscription is active (including trial)
 */
export function isSubscriptionActive(subscription: any): boolean {
	if (!subscription) return false;
	return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Check if a subscription is in trial period
 */
export function isSubscriptionTrialing(subscription: any): boolean {
	if (!subscription) return false;
	return subscription.status === 'trialing';
}

/**
 * Check if a subscription is canceled
 */
export function isSubscriptionCanceled(subscription: any): boolean {
	if (!subscription) return false;
	return subscription.cancel_at_period_end === true;
}

/**
 * Check if a subscription requires payment
 */
export function isSubscriptionPastDue(subscription: any): boolean {
	if (!subscription) return false;
	return subscription.status === 'past_due' || subscription.status === 'incomplete';
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: any): number | null {
	if (!subscription?.trial_end) return null;

	const trialEnd = new Date(subscription.trial_end);
	const now = new Date();
	const diffTime = trialEnd.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays > 0 ? diffDays : 0;
}

/**
 * Get days until subscription renewal
 */
export function getDaysUntilRenewal(subscription: any): number | null {
	if (!subscription?.current_period_end) return null;

	const periodEnd = new Date(subscription.current_period_end);
	const now = new Date();
	const diffTime = periodEnd.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays > 0 ? diffDays : 0;
}
