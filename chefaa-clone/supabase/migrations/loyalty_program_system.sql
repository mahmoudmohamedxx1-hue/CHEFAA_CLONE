-- Create loyalty program database schema
-- Run with: apply_migration("loyalty_program_system")

-- Loyalty Tiers Table
CREATE TABLE loyalty_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Loyalty Data
CREATE TABLE customer_loyalty (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
    current_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    annual_points INTEGER DEFAULT 0,
    points_expiring INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    referral_points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_points CHECK (current_points >= 0 AND available_points >= 0),
    CONSTRAINT unique_user_loyalty UNIQUE (user_id)
);

-- Points Transactions
CREATE TABLE loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_loyalty_id UUID NOT NULL REFERENCES customer_loyalty(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus', 'expired', 'referral')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    order_id UUID,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    category VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards Catalog
CREATE TABLE loyalty_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    cost INTEGER NOT NULL,
    original_value INTEGER,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_limited BOOLEAN DEFAULT false,
    max_quantity INTEGER,
    remaining_quantity INTEGER,
    tier_restrictions TEXT[],
    terms TEXT[],
    how_to_use TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_cost CHECK (cost >= 0),
    CONSTRAINT valid_quantity CHECK (remaining_quantity IS NULL OR remaining_quantity >= 0)
);

-- Points Redemptions
CREATE TABLE loyalty_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES loyalty_rewards(id),
    customer_loyalty_id UUID NOT NULL REFERENCES customer_loyalty(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    redemption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'expired')),
    fulfillment_date TIMESTAMP WITH TIME ZONE,
    redemption_code VARCHAR(100),
    usage_instructions TEXT,
    external_reference VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_points_used CHECK (points_used > 0)
);

-- Referrals
CREATE TABLE loyalty_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    referred_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_date TIMESTAMP WITH TIME ZONE,
    reward_claimed BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    order_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_referral_pair UNIQUE (referrer_id, referred_id)
);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'yearly')),
    description TEXT,
    features TEXT[],
    benefits TEXT[],
    max_members INTEGER,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    savings_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_price CHECK (price > 0),
    CONSTRAINT valid_original_price CHECK (original_price IS NULL OR original_price > 0)
);

-- Customer Subscriptions
CREATE TABLE customer_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    auto_refill BOOLEAN DEFAULT false,
    reminders_enabled BOOLEAN DEFAULT true,
    current_discount DECIMAL(5,2) DEFAULT 0,
    subscription_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_discount CHECK (current_discount >= 0 AND current_discount <= 100)
);

-- Subscription Family Members
CREATE TABLE subscription_family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    permissions JSONB,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT unique_subscription_member UNIQUE (subscription_id, user_id)
);

-- Tier Benefits (for tracking which benefits are unlocked)
CREATE TABLE tier_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
    benefit_type VARCHAR(50) NOT NULL,
    benefit_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_automatic BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (name, min_points, max_points, color, icon) VALUES
('Bronze', 0, 999, '#CD7F32', 'star'),
('Silver', 1000, 2999, '#C0C0C0', 'award'),
('Gold', 3000, 5999, '#FFD700', 'award'),
('Platinum', 6000, NULL, '#E5E4E2', 'crown');

-- Insert default subscription plans
INSERT INTO subscription_plans (name, tier, price, original_price, period, description, features, benefits, max_members, is_popular, savings_amount) VALUES
('Waffar Plus', 'Waffar Plus', 29.00, NULL, 'monthly', 'Essential pharmacy benefits for individuals', 
 ARRAY['Free delivery on all orders', 'Priority customer support', 'Monthly medication reminders', 'Basic consultation discounts', 'Points earning boost (1.5x)', 'Auto-refill service'],
 ARRAY['Save 20% on consultations', 'Free standard delivery', 'Priority support hotline'],
 1, false, 0),
('Waffar Premium', 'Waffar Premium', 49.00, 59.00, 'monthly', 'Premium healthcare benefits with enhanced support',
 ARRAY['Everything in Waffar Plus', 'Free express delivery', '24/7 dedicated support', 'Weekly wellness check-ins', 'Premium consultation discounts', 'Points earning boost (2x)', 'Annual health assessment', 'Specialist referral priority'],
 ARRAY['Save 30% on consultations', 'Free express delivery', '24/7 support line', 'Annual health checkup'],
 1, true, 120),
('Waffar Family', 'Waffar Family', 79.00, 99.00, 'monthly', 'Complete family healthcare management',
 ARRAY['Everything in Waffar Premium', 'Family health dashboard', 'Multiple member support', 'Shared medication management', 'Family wellness programs', 'Points earning boost (2.5x)', 'Dedicated family coordinator', 'Group health consultations'],
 ARRAY['Save 25% per additional member', 'Family coordinator assigned', 'Shared health insights', 'Group consultation discounts'],
 6, false, 240),
('Waffar Premium (Annual)', 'Waffar Premium', 499.00, 708.00, 'yearly', 'Best value - save 2 months free',
 ARRAY['Everything in Waffar Premium', '2 months completely free', 'Priority plan renewals', 'Annual bonus points', 'Birthday month double points', 'Exclusive member events'],
 ARRAY['Save 2 months free', 'Annual bonus: 500 points', 'Birthday rewards doubled', 'Exclusive member access'],
 1, false, 209);

-- Create indexes for better performance
CREATE INDEX idx_customer_loyalty_user_id ON customer_loyalty(user_id);
CREATE INDEX idx_customer_loyalty_tier_id ON customer_loyalty(tier_id);
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(transaction_date);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX idx_loyalty_rewards_category ON loyalty_rewards(category);
CREATE INDEX idx_loyalty_rewards_active ON loyalty_rewards(is_active);
CREATE INDEX idx_loyalty_redemptions_user_id ON loyalty_redemptions(user_id);
CREATE INDEX idx_loyalty_redemptions_status ON loyalty_redemptions(status);
CREATE INDEX idx_loyalty_referrals_referrer ON loyalty_referrals(referrer_id);
CREATE INDEX idx_loyalty_referrals_referred ON loyalty_referrals(referred_id);
CREATE INDEX idx_customer_subscriptions_user_id ON customer_subscriptions(user_id);
CREATE INDEX idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX idx_subscription_family_members_subscription ON subscription_family_members(subscription_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_loyalty_updated_at BEFORE UPDATE ON customer_loyalty
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_subscriptions_updated_at BEFORE UPDATE ON customer_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();