import React, { useState, useEffect } from 'react';
import AnalyticsAPI from '../lib/AnalyticsAPI';

interface MedicationAdherenceFormProps {
  onSuccess: () => void;
}

const MedicationAdherenceForm: React.FC<MedicationAdherenceFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    medication_name: '',
    prescribed_dosage: '',
    scheduled_time: '',
    adherence_status: 'taken',
    missed_reason: '',
    reminder_effectiveness: 80
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await AnalyticsAPI.trackMedicationAdherence({
        medication_id: `med-${Date.now()}`,
        medication_name: formData.medication_name,
        prescribed_dosage: formData.prescribed_dosage,
        scheduled_time: formData.scheduled_time,
        adherence_status: formData.adherence_status,
        missed_reason: formData.missed_reason,
        reminder_sent: true,
        reminder_effectiveness: formData.reminder_effectiveness,
        date: new Date().toISOString().split('T')[0]
      });

      alert('Medication adherence record saved successfully');
      setFormData({
        medication_name: '',
        prescribed_dosage: '',
        scheduled_time: '',
        adherence_status: 'taken',
        missed_reason: '',
        reminder_effectiveness: 80
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to save adherence record:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Log Medication Adherence</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medication Name
          </label>
          <input
            type="text"
            required
            value={formData.medication_name}
            onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Aspirin 100mg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prescribed Dosage
          </label>
          <input
            type="text"
            required
            value={formData.prescribed_dosage}
            onChange={(e) => setFormData({ ...formData, prescribed_dosage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 1 tablet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Time
          </label>
          <input
            type="time"
            required
            value={formData.scheduled_time}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adherence Status
          </label>
          <select
            value={formData.adherence_status}
            onChange={(e) => setFormData({ ...formData, adherence_status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="taken">Taken</option>
            <option value="missed">Missed</option>
            <option value="late">Late</option>
          </select>
        </div>

        {formData.adherence_status === 'missed' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Missing
            </label>
            <textarea
              value={formData.missed_reason}
              onChange={(e) => setFormData({ ...formData, missed_reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Optional: Explain why medication was missed"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Effectiveness (0-100)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.reminder_effectiveness}
            onChange={(e) => setFormData({ ...formData, reminder_effectiveness: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-center text-sm text-gray-600 mt-1">
            {formData.reminder_effectiveness}%
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Adherence Record'}
        </button>
      </div>
    </form>
  );
};

export default MedicationAdherenceForm;
