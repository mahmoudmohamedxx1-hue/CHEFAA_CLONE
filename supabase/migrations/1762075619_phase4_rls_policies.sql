-- Migration: phase4_rls_policies
-- Created at: 1762075619

-- Phase 4: Row Level Security Policies

-- Enable RLS on all Phase 4 tables
ALTER TABLE consultation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Consultation Types (public read)
CREATE POLICY "Anyone can view consultation types" ON consultation_types
  FOR SELECT USING (is_active = true);

-- Consultations (users see their own)
CREATE POLICY "Users can view their own consultations" ON consultations
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = provider_id);

CREATE POLICY "Users can create consultations" ON consultations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultations" ON consultations
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = provider_id);

-- Insurance (users see their own)
CREATE POLICY "Users can view their own insurance" ON user_insurance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insurance" ON user_insurance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance" ON user_insurance
  FOR UPDATE USING (auth.uid() = user_id);

-- Medical Records (users see their own)
CREATE POLICY "Users can view their own conditions" ON patient_conditions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own allergies" ON patient_allergies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own medication history" ON medication_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lab results" ON lab_results
  FOR ALL USING (auth.uid() = user_id);

-- Drug Interactions (public read)
CREATE POLICY "Anyone can view drug interactions" ON drug_interactions
  FOR SELECT USING (true);

-- Family Members (primary user manages)
CREATE POLICY "Users can manage their family members" ON family_members
  FOR ALL USING (auth.uid() = primary_user_id);

CREATE POLICY "Users can manage family medication schedules" ON medication_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE family_members.id = medication_schedules.family_member_id 
      AND family_members.primary_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage family prescriptions" ON family_prescriptions
  FOR ALL USING (auth.uid() = uploaded_by);

-- Pharmacies (public read)
CREATE POLICY "Anyone can view active pharmacies" ON partner_pharmacies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view pharmacy inventory" ON pharmacy_inventory
  FOR SELECT USING (true);

-- Deliveries (users see their orders)
CREATE POLICY "Users can view their deliveries" ON deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = deliveries.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view delivery history" ON delivery_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deliveries 
      JOIN orders ON orders.id = deliveries.order_id 
      WHERE deliveries.id = delivery_location_history.delivery_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their delivery notifications" ON delivery_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Edge function compatibility (allow both anon and service_role)
CREATE POLICY "Edge functions can manage consultations" ON consultations
  FOR ALL USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Edge functions can manage deliveries" ON deliveries
  FOR ALL USING (auth.role() IN ('anon', 'service_role'));
;