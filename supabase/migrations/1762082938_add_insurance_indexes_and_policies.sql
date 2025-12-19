-- Migration: add_insurance_indexes_and_policies
-- Created at: 1762082938

-- Performance indexes for insurance system

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_user ON insurance_claims(user_insurance_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_order ON insurance_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_number ON insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_date ON insurance_claims(submission_date);

-- Coverage plans indexes
CREATE INDEX IF NOT EXISTS idx_coverage_plans_provider ON insurance_coverage_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_coverage_plans_type ON insurance_coverage_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_coverage_plans_active ON insurance_coverage_plans(is_active);

-- Formulary indexes
CREATE INDEX IF NOT EXISTS idx_formulary_provider ON insurance_formulary(provider_id);
CREATE INDEX IF NOT EXISTS idx_formulary_medication ON insurance_formulary(medication_name);
CREATE INDEX IF NOT EXISTS idx_formulary_tier ON insurance_formulary(tier_level);
CREATE INDEX IF NOT EXISTS idx_formulary_coverage ON insurance_formulary(is_covered);

-- Prior auth indexes
CREATE INDEX IF NOT EXISTS idx_prior_auth_user ON insurance_prior_authorizations(user_insurance_id);
CREATE INDEX IF NOT EXISTS idx_prior_auth_status ON insurance_prior_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_prior_auth_claim ON insurance_prior_authorizations(claim_id);

-- Copay calculations indexes
CREATE INDEX IF NOT EXISTS idx_copay_calculations_user ON insurance_copay_calculations(user_insurance_id);
CREATE INDEX IF NOT EXISTS idx_copay_calculations_order ON insurance_copay_calculations(order_id);
CREATE INDEX IF NOT EXISTS idx_copay_calculations_timestamp ON insurance_copay_calculations(calculation_timestamp);

-- Claims history indexes
CREATE INDEX IF NOT EXISTS idx_claims_history_claim ON insurance_claims_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_history_date ON insurance_claims_history(changed_at);

-- Enable RLS on new tables
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_coverage_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_formulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_prior_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_copay_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security
CREATE POLICY "Users can view their own insurance claims" ON insurance_claims
  FOR SELECT USING (user_insurance_id IN (
    SELECT id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view coverage plans for their providers" ON insurance_coverage_plans
  FOR SELECT USING (provider_id IN (
    SELECT provider_id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view formulary for their providers" ON insurance_formulary
  FOR SELECT USING (provider_id IN (
    SELECT provider_id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own prior authorizations" ON insurance_prior_authorizations
  FOR SELECT USING (user_insurance_id IN (
    SELECT id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own copay calculations" ON insurance_copay_calculations
  FOR SELECT USING (user_insurance_id IN (
    SELECT id FROM user_insurance WHERE user_id = auth.uid()
  ));;