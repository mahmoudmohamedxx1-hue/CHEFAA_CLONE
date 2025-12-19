-- Loyalty Program Sample Data
-- This file contains sample data for testing and development

-- Insert realistic rewards for Egyptian market
INSERT INTO loyalty_rewards (name, description, short_description, cost, original_value, category, subcategory, terms, how_to_use, is_active, is_popular, tier_restrictions, sort_order) VALUES

-- Birthday & Anniversary Rewards
('Birthday Celebration Package', 'Special birthday discount package with bonus points and exclusive gift', 'Special birthday rewards package', 0, 200, 'discount', 'birthday', 
 ARRAY['Valid only during birthday month', 'Cannot be combined with other discounts', 'Requires birthday verification'], 
 ARRAY['Automatically applied during checkout', 'Birthday gift shipped separately'], 
 true, true, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 1),

('Anniversary Double Points', 'Double points earning for your loyalty anniversary month', 'Anniversary month special bonus', 0, 500, 'experience', 'anniversary',
 ARRAY['Valid only during anniversary month', 'Points calculated at double rate', 'Excludes referral bonuses'],
 ARRAY['Automatically applied to all purchases', 'No action required'],
 true, false, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 2),

-- Consultation Discounts
('Telemedicine Consultation 15% Off', 'Discount on video consultations with certified doctors', '15% off telemedicine consultations', 100, 150, 'discount', 'consultation',
 ARRAY['Valid for video consultations only', 'Cannot be combined with insurance', 'One use per month'],
 ARRAY['Book consultation through app', 'Discount applied at checkout'],
 true, true, ARRAY['Silver', 'Gold', 'Platinum'], 3),

('Expert Pharmacist Consultation', 'One-on-one consultation with senior pharmacist for personalized advice', 'Expert pharmacist guidance session', 200, 400, 'service', 'consultation',
 ARRAY['60-minute session', 'Appointment required', 'Valid for 3 months'],
 ARRAY['Book through consultation page', 'Confirmation sent via email'],
 true, false, ARRAY['Gold', 'Platinum'], 4),

('Family Health Consultation', 'Comprehensive family health check and medication review', 'Complete family health assessment', 500, 800, 'service', 'family-care',
 ARRAY['Up to 4 family members', '90-minute session', 'Health report provided'],
 ARRAY['Schedule through family dashboard', 'Report delivered within 48 hours'],
 true, false, ARRAY['Platinum'], 5),

-- Delivery & Shipping Rewards
('Free Standard Delivery', 'Free delivery on your next order', 'Free delivery for one order', 50, 30, 'discount', 'shipping',
 ARRAY['Valid for one order', 'Maximum order value 500 EGP', 'Standard delivery only'],
 ARRAY['Applied automatically at checkout'],
 true, true, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 6),

('Express Delivery Free', 'Free express delivery for urgent medication needs', 'Free express delivery', 100, 50, 'discount', 'shipping',
 ARRAY['Same-day delivery where available', 'Only for urgent medications', 'Cairo and Alexandria only'],
 ARRAY['Select express option at checkout', 'Available 9 AM - 6 PM'],
 true, false, ARRAY['Silver', 'Gold', 'Platinum'], 7),

-- Product Rewards
('Essential Medicine Kit', 'Basic first aid and common medications kit', 'Home medicine essentials kit', 150, 250, 'product', 'first-aid',
 ARRAY['Basic medications included', 'Check expiration dates', 'For minor ailments only'],
 ARRAY['Added to cart automatically', 'Free delivery included'],
 true, true, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 8),

('Premium Vitamin Set', 'Complete vitamin and supplement package for immune support', 'Immune system vitamin bundle', 300, 450, 'product', 'supplements',
 ARRAY['3-month supply', 'Doctor consultation recommended', 'Not for pregnant women'],
 ARRAY['Added to cart automatically', 'Usage instructions included'],
 true, false, ARRAY['Silver', 'Gold', 'Platinum'], 9),

('Blood Pressure Monitor', 'Digital blood pressure monitor with mobile app connectivity', 'Smart BP monitor with app', 400, 600, 'product', 'medical-devices',
 ARRAY['2-year warranty', 'Mobile app required', 'Calibration service included'],
 ARRAY['Device shipped within 2 days', 'Setup guide provided'],
 true, true, ARRAY['Gold', 'Platinum'], 10),

('Digital Thermometer Set', 'Accurate digital thermometer with smart features', 'Smart temperature monitoring', 80, 120, 'product', 'medical-devices',
 ARRAY['Quick 10-second reading', 'Fever alarm included', 'Battery operated'],
 ARRAY['Added to cart automatically'],
 true, false, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 11),

-- Wellness & Health Rewards
('Wellness Workshop Access', 'Monthly virtual workshop on nutrition and healthy living', 'Nutrition and wellness education', 50, 100, 'experience', 'education',
 ARRAY['Live online session', 'Recording available for 7 days', 'Certificate provided'],
 ARRAY['Register through events page', 'Calendar invite sent'],
 true, true, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 12),

('Yoga Class Voucher', 'Access to virtual yoga and meditation classes', 'Online yoga and meditation', 120, 200, 'experience', 'fitness',
 ARRAY['Monthly pass included', 'All skill levels welcome', 'Equipment needed'],
 ARRAY['Book class slots through app', 'Access link via email'],
 true, false, ARRAY['Silver', 'Gold', 'Platinum'], 13),

('Nutritionist Consultation', 'Personalized nutrition plan with certified dietitian', 'Custom nutrition guidance', 250, 400, 'service', 'nutrition',
 ARRAY['60-minute initial consultation', 'Follow-up plan included', 'Dietary restrictions accommodated'],
 ARRAY['Schedule through consultation page', 'Plan delivered within 3 days'],
 true, false, ARRAY['Gold', 'Platinum'], 14),

-- Family & Care Rewards
('Family Health Dashboard', 'Complete family health management system access', 'Family health tracking system', 100, 150, 'service', 'family-care',
 ARRAY['Up to 6 family members', 'Mobile app included', 'Data encryption guaranteed'],
 ARRAY['Account created automatically', 'Family invitation codes sent'],
 true, false, ARRAY['Platinum'], 15),

('Pediatric Care Package', 'Specialized child health monitoring and consultation', 'Children healthcare essentials', 200, 350, 'service', 'pediatric',
 ARRAY['Child-friendly consultations', 'Vaccination reminders', 'Growth tracking included'],
 ARRAY['Pediatric specialist assigned', 'Child health card provided'],
 true, false, ARRAY['Gold', 'Platinum'], 16),

-- Emergency & Special Rewards
('Emergency Medicine Kit', 'Comprehensive emergency medication and supply kit', 'Emergency medical supplies', 300, 500, 'product', 'emergency',
 ARRAY['Emergency use only', 'First aid training included', 'Refill reminders set'],
 ARRAY['Priority shipping included', 'Emergency contact setup'],
 true, false, ARRAY['Gold', 'Platinum'], 17),

('24/7 Pharmacy Hotline', 'Round-the-clock pharmacy consultation service', '24/7 pharmaceutical advice', 50, 100, 'service', 'emergency',
 ARRAY['Immediate response guaranteed', 'Prescription guidance included', 'Emergency protocols explained'],
 ARRAY['Call hotline number provided', 'Specialist consultation within 15 minutes'],
 true, false, ARRAY['Platinum'], 18),

-- Exclusive & Limited Rewards
('Ramadan Charity Bundle', 'Special Ramadan package with charitable donation included', 'Ramadan charitable health package', 200, 300, 'product', 'charity',
 ARRAY['10% donated to charity', 'Ramadan special pricing', 'Limited time offer'],
 ARRAY['Donation receipt provided', 'Charity partner information included'],
 true, false, ARRAY['Silver', 'Gold', 'Platinum'], 19),

('Eid Gift Package', 'Festive health and wellness gift for Eid celebration', 'Eid celebration wellness gift', 150, 250, 'product', 'celebration',
 ARRAY['Festive packaging included', 'Contains traditional remedies', 'Gift message available'],
 ARRAY['Special delivery on Eid day', 'Festive greeting card included'],
 true, false, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 20),

('Summer Health Kit', 'Heat protection and hydration essentials for summer', 'Summer health protection bundle', 120, 180, 'product', 'seasonal',
 ARRAY['Heat protection items included', 'Hydration supplements', 'Summer health tips provided'],
 ARRAY['Seasonal health guide included', 'Usage schedule provided'],
 true, false, ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'], 21);

-- Insert tier benefits
INSERT INTO tier_benefits (tier_id, benefit_type, benefit_name, description, is_automatic) 
SELECT 
    lt.id,
    'delivery' as benefit_type,
    'Free Delivery Threshold Reduction' as benefit_name,
    'Reduced minimum order amount for free delivery' as description,
    true as is_automatic
FROM loyalty_tiers lt WHERE lt.name IN ('Silver', 'Gold', 'Platinum');

INSERT INTO tier_benefits (tier_id, benefit_type, benefit_name, description, is_automatic) 
SELECT 
    lt.id,
    'discount' as benefit_type,
    'Birthday Discount' as benefit_name,
    'Special birthday month discount' as description,
    true as is_automatic
FROM loyalty_tiers lt;

INSERT INTO tier_benefits (tier_id, benefit_type, benefit_name, description, is_automatic) 
SELECT 
    lt.id,
    'support' as benefit_type,
    'Priority Customer Support' as benefit_name,
    'Faster response times and dedicated support' as description,
    true as is_automatic
FROM loyalty_tiers lt WHERE lt.name IN ('Silver', 'Gold', 'Platinum');

INSERT INTO tier_benefits (tier_id, benefit_type, benefit_name, description, is_automatic) 
SELECT 
    lt.id,
    'consultation' as benefit_type,
    'Wellness Consultation' as benefit_name,
    'Monthly wellness consultation included' as description,
    true as is_automatic
FROM loyalty_tiers lt WHERE lt.name IN ('Gold', 'Platinum');

INSERT INTO tier_benefits (tier_id, benefit_type, benefit_name, description, is_automatic) 
SELECT 
    lt.id,
    'delivery' as benefit_type,
    'Express Delivery' as benefit_name,
    'Free express delivery on all orders' as description,
    true as is_automatic
FROM loyalty_tiers lt WHERE lt.name = 'Platinum';

INSERT INTO tier_benefits (tier_id, benefit_type, benefit_name, description, is_automatic) 
SELECT 
    lt.id,
    'family' as benefit_type,
    'Family Plan' as benefit_name,
    'Family health management and shared benefits' as description,
    true as is_automatic
FROM loyalty_tiers lt WHERE lt.name = 'Platinum';

-- Insert sample customer loyalty data (for testing)
-- Note: These would normally be created when users register
/*
Sample structure for customer loyalty accounts:

INSERT INTO customer_loyalty (user_id, tier_id, current_points, available_points, referral_code) VALUES
('user-uuid-1', (SELECT id FROM loyalty_tiers WHERE name = 'Bronze'), 250, 250, 'CHF1234'),
('user-uuid-2', (SELECT id FROM loyalty_tiers WHERE name = 'Silver'), 1250, 1000, 'CHF5678'),
('user-uuid-3', (SELECT id FROM loyalty_tiers WHERE name = 'Gold'), 3750, 3200, 'CHF9012'),
('user-uuid-4', (SELECT id FROM loyalty_tiers WHERE name = 'Platinum'), 8500, 6500, 'CHF3456');

-- Sample transactions
INSERT INTO loyalty_transactions (user_id, customer_loyalty_id, type, amount, description, status) VALUES
('user-uuid-1', 'loyalty-id-1', 'earned', 50, 'Points from order #12345', 'completed'),
('user-uuid-1', 'loyalty-id-1', 'earned', 100, 'Welcome bonus', 'completed'),
('user-uuid-2', 'loyalty-id-2', 'earned', 75, 'Points from order #12346', 'completed'),
('user-uuid-2', 'loyalty-id-2', 'bonus', 25, 'Monthly activity bonus', 'completed'),
('user-uuid-3', 'loyalty-id-3', 'earned', 200, 'Points from order #12347', 'completed'),
('user-uuid-4', 'loyalty-id-4', 'earned', 300, 'Points from order #12348', 'completed'),
('user-uuid-4', 'loyalty-id-4', 'referral', 100, 'Referral bonus', 'completed');

-- Sample redemptions
INSERT INTO loyalty_redemptions (user_id, reward_id, customer_loyalty_id, points_used, status) VALUES
('user-uuid-2', 'reward-id-1', 'loyalty-id-2', 100, 'completed'),
('user-uuid-3', 'reward-id-2', 'loyalty-id-3', 200, 'pending'),
('user-uuid-4', 'reward-id-3', 'loyalty-id-4', 300, 'completed');
*/

-- Insert sample subscription plans (already done in migration, but adding some additional data)
-- Note: The subscription plans are already created in the main migration

-- Insert sample family member relationships for subscription testing
-- Note: This would be populated when users add family members

/*
Sample family member data:

INSERT INTO subscription_family_members (subscription_id, user_id, relationship, permissions) VALUES
('subscription-uuid-1', 'user-uuid-5', 'Spouse', '{"medication_view": true, "medication_manage": true, "health_records": true}'),
('subscription-uuid-1', 'user-uuid-6', 'Child', '{"medication_view": true, "health_records": false, "appointments": false}');
*/

-- Insert notification templates for loyalty events
/*
INSERT INTO notification_templates (type, title, message, trigger_conditions) VALUES
('tier_upgraded', 'Congratulations! Tier Upgraded', 'You have been upgraded to {new_tier} tier! Enjoy your new benefits.', '{"event": "tier_upgrade"}'),
('points_earned', 'Points Earned!', 'You have earned {points} points from your recent order.', '{"event": "points_earned"}'),
('points_expiring', 'Points Expiring Soon', '{points} points will expire in {days} days. Use them now!', '{"event": "points_expiring", "days_before": 30}'),
('reward_available', 'New Reward Available', 'A new reward matching your tier is now available!', '{"event": "reward_unlocked"}'),
('referral_completed', 'Referral Completed!', 'Your referral has been completed. You earned {points} bonus points!', '{"event": "referral_completed"}');
*/

-- Performance optimization: Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expiring ON loyalty_transactions(expiry_date) 
WHERE expiry_date IS NOT NULL AND type = 'earned';

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_popular ON loyalty_rewards(is_popular, sort_order) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_billing ON customer_subscriptions(next_billing_date, status) 
WHERE status IN ('active', 'trial');

-- Create a view for loyalty program dashboard analytics
CREATE OR REPLACE VIEW loyalty_dashboard AS
SELECT 
    cl.user_id,
    lt.name as current_tier,
    cl.current_points,
    cl.available_points,
    cl.lifetime_points,
    cl.annual_points,
    cl.total_referrals,
    cl.successful_referrals,
    cl.referral_points_earned,
    COUNT(lt_trans.id) as total_transactions,
    COUNT(CASE WHEN lt_trans.type = 'earned' THEN 1 END) as earning_transactions,
    COUNT(CASE WHEN lt_trans.type = 'redeemed' THEN 1 END) as redemption_transactions,
    AVG(CASE WHEN lt_trans.type = 'earned' THEN lt_trans.amount END) as avg_earning_transaction,
    SUM(CASE WHEN lt_trans.type = 'earned' THEN lt_trans.amount ELSE 0 END) as total_earned_points,
    SUM(CASE WHEN lt_trans.type = 'redeemed' THEN ABS(lt_trans.amount) ELSE 0 END) as total_redeemed_points
FROM customer_loyalty cl
JOIN loyalty_tiers lt ON cl.tier_id = lt.id
LEFT JOIN loyalty_transactions lt_trans ON cl.user_id = lt_trans.user_id
GROUP BY cl.user_id, lt.name, cl.current_points, cl.available_points, cl.lifetime_points, 
         cl.annual_points, cl.total_referrals, cl.successful_referrals, cl.referral_points_earned;

-- Grant permissions for RLS (Row Level Security)
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_family_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own loyalty data" ON customer_loyalty
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own redemptions" ON loyalty_redemptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own referrals" ON loyalty_referrals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription" ON customer_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Subscription owners can view family members" ON subscription_family_members
    FOR SELECT USING (
        subscription_id IN (
            SELECT id FROM customer_subscriptions WHERE user_id = auth.uid()
        )
    );

-- Enable automatic tier updates via trigger
CREATE OR REPLACE FUNCTION update_customer_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if points changed significantly
    IF NEW.current_points != OLD.current_points THEN
        -- Find appropriate tier
        SELECT id INTO NEW.tier_id
        FROM loyalty_tiers
        WHERE NEW.current_points >= min_points
        AND (max_points IS NULL OR NEW.current_points <= max_points)
        ORDER BY min_points DESC
        LIMIT 1;
        
        -- If no tier found, keep current tier
        IF NEW.tier_id IS NULL THEN
            NEW.tier_id = OLD.tier_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_tier
    BEFORE UPDATE ON customer_loyalty
    FOR EACH ROW EXECUTE FUNCTION update_customer_tier();