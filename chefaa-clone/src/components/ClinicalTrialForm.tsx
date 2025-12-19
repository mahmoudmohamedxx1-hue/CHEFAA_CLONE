import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ClinicalTrialFormProps {
  onSuccess: () => void;
}

const ClinicalTrialForm: React.FC<ClinicalTrialFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    trial_name: '',
    phase: 'Phase II',
    enrolled_patients: 0,
    completed_patients: 0,
    dropout_rate: 0,
    success_rate: 0,
    protocol_adherence_rate: 0,
    adverse_events_count: 0,
    primary_outcome_met: false,
    regulatory_status: 'Active',
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('clinical_trial_metrics')
        .insert([{
          trial_id: `trial-${Date.now()}`,
          ...formData
        }]);

      if (error) throw error;

      alert('Clinical trial data saved successfully');
      setFormData({
        trial_name: '',
        phase: 'Phase II',
        enrolled_patients: 0,
        completed_patients: 0,
        dropout_rate: 0,
        success_rate: 0,
        protocol_adherence_rate: 0,
        adverse_events_count: 0,
        primary_outcome_met: false,
        regulatory_status: 'Active',
        start_date: '',
        end_date: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to save trial data:', error);
      alert('Failed to save trial data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Create/Update Clinical Trial</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trial Name
          </label>
          <input
            type="text"
            required
            value={formData.trial_name}
            onChange={(e) => setFormData({ ...formData, trial_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Diabetes Medication Trial Phase III"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phase
          </label>
          <select
            value={formData.phase}
            onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Phase I">Phase I</option>
            <option value="Phase II">Phase II</option>
            <option value="Phase III">Phase III</option>
            <option value="Phase IV">Phase IV</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regulatory Status
          </label>
          <select
            value={formData.regulatory_status}
            onChange={(e) => setFormData({ ...formData, regulatory_status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Active">Active</option>
            <option value="In_Review">In Review</option>
            <option value="FDA_Approved">FDA Approved</option>
            <option value="Suspended">Suspended</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enrolled Patients
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.enrolled_patients}
            onChange={(e) => setFormData({ ...formData, enrolled_patients: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completed Patients
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.completed_patients}
            onChange={(e) => setFormData({ ...formData, completed_patients: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dropout Rate (%)
          </label>
          <input
            type="number"
            required
            min="0"
            max="100"
            step="0.1"
            value={formData.dropout_rate}
            onChange={(e) => setFormData({ ...formData, dropout_rate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Success Rate (%)
          </label>
          <input
            type="number"
            required
            min="0"
            max="100"
            step="0.1"
            value={formData.success_rate}
            onChange={(e) => setFormData({ ...formData, success_rate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Protocol Adherence Rate (%)
          </label>
          <input
            type="number"
            required
            min="0"
            max="100"
            step="0.1"
            value={formData.protocol_adherence_rate}
            onChange={(e) => setFormData({ ...formData, protocol_adherence_rate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adverse Events Count
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.adverse_events_count}
            onChange={(e) => setFormData({ ...formData, adverse_events_count: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.primary_outcome_met}
              onChange={(e) => setFormData({ ...formData, primary_outcome_met: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Primary Outcome Met
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Trial Data'}
        </button>
      </div>
    </form>
  );
};

export default ClinicalTrialForm;
