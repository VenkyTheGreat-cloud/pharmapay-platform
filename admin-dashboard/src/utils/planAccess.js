// Subscription plan → module access control.
// The active plan comes from the login response (user.subscription.plan).
// Tiered access: each plan unlocks everything below it plus its own modules.

export const PLAN_RANK = { starter: 0, growth: 1, enterprise: 2 };

// Minimum plan required for each route. Routes not listed are always allowed.
export const MODULE_MIN_PLAN = {
    '/dashboard': 'starter',
    '/pending-orders': 'starter',
    '/orders': 'starter',
    '/customers': 'starter',
    '/contacts': 'starter',        // Day Calls
    '/delivery-boys': 'growth',
    '/store-staff': 'growth',      // Stores
    '/dismissed-captures': 'growth',
    '/reports': 'enterprise',
};

export function getPlan(user) {
    return user?.subscription?.plan || 'starter';
}

// Whether the given plan can access a route/module.
export function canAccess(plan, href) {
    const required = MODULE_MIN_PLAN[href];
    if (!required) return true; // unlisted routes are always available
    const planRank = PLAN_RANK[plan] ?? 0;
    const reqRank = PLAN_RANK[required] ?? 0;
    return planRank >= reqRank;
}
