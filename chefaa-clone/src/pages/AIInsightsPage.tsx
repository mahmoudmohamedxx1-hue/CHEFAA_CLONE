import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AIAPI from '../lib/AIAPI';

interface AIInsightsPageProps {
  language: 'en' | 'ar';
}

const AIInsightsPage: React.FC<AIInsightsPageProps> = ({ language }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('genetic');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUser(user);
  };

  const tabs = [
    { id: 'genetic', label: 'Genetic Analysis' },
    { id: 'adherence', label: 'Adherence Prediction' },
    { id: 'interactions', label: 'Drug Interactions' },
    { id: 'notes', label: 'Clinical Notes' },
    { id: 'scheduling', label: 'Smart Scheduling' },
    { id: 'adverse', label: 'Adverse Events' },
    { id: 'personalized', label: 'Personalized Medicine' },
    { id: 'pricing', label: 'Price Optimization' },
    { id: 'risk', label: 'Risk Stratification' },
    { id: 'discovery', label: 'Drug Discovery' },
    { id: 'predictive', label: 'Predictive Analytics' },
    { id: 'clinical-support', label: 'Clinical Decision Support' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'genetic':
        return <GeneticAnalysisTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'adherence':
        return <AdherencePredictionTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'interactions':
        return <DrugInteractionsTab setLoading={setLoading} setResult={setResult} />;
      case 'notes':
        return <ClinicalNotesTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'scheduling':
        return <SmartSchedulingTab setLoading={setLoading} setResult={setResult} />;
      case 'adverse':
        return <AdverseEventsTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'personalized':
        return <PersonalizedMedicineTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'pricing':
        return <PriceOptimizationTab setLoading={setLoading} setResult={setResult} />;
      case 'risk':
        return <RiskStratificationTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'discovery':
        return <DrugDiscoveryTab setLoading={setLoading} setResult={setResult} />;
      case 'predictive':
        return <PredictiveAnalyticsTab user={user} setLoading={setLoading} setResult={setResult} />;
      case 'clinical-support':
        return <ClinicalDecisionSupportTab user={user} setLoading={setLoading} setResult={setResult} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Healthcare Insights</h1>
          <p className="text-gray-600">Advanced machine learning for personalized healthcare recommendations</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                  }}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Processing AI analysis...</span>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">AI Analysis Results</h3>
            <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Genetic Analysis Tab
const GeneticAnalysisTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [geneticData, setGeneticData] = useState({
    cyp2d6: '*1/*1',
    cyp2c19: '*1/*1',
    cyp3a4: '*1/*1',
  });
  const [medications, setMedications] = useState([
    { id: '1', name: 'Atorvastatin', type: 'statin', standard_dose: '10mg once daily' },
  ]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.analyzeGeneticProfile(geneticData, medications, user.id);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pharmacogenomic Analysis</h3>
        <p className="text-gray-600 mb-6">
          Analyze genetic markers to provide personalized medication recommendations and dosing guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CYP2D6 Variant</label>
          <select
            value={geneticData.cyp2d6}
            onChange={(e) => setGeneticData({ ...geneticData, cyp2d6: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="*1/*1">*1/*1 (Normal Metabolizer)</option>
            <option value="*1/*2">*1/*2 (Intermediate)</option>
            <option value="*2/*2">*2/*2 (Poor Metabolizer)</option>
            <option value="*1/*17">*1/*17 (Rapid Metabolizer)</option>
            <option value="*17/*17">*17/*17 (Ultra-rapid)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CYP2C19 Variant</label>
          <select
            value={geneticData.cyp2c19}
            onChange={(e) => setGeneticData({ ...geneticData, cyp2c19: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="*1/*1">*1/*1 (Normal Metabolizer)</option>
            <option value="*1/*2">*1/*2 (Intermediate)</option>
            <option value="*2/*2">*2/*2 (Poor Metabolizer)</option>
            <option value="*1/*17">*1/*17 (Rapid Metabolizer)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CYP3A4 Variant</label>
          <select
            value={geneticData.cyp3a4}
            onChange={(e) => setGeneticData({ ...geneticData, cyp3a4: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="*1/*1">*1/*1 (Normal Metabolizer)</option>
            <option value="*1/*2">*1/*2 (Intermediate)</option>
            <option value="*2/*2">*2/*2 (Poor Metabolizer)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Medication to Analyze</label>
        <input
          type="text"
          value={medications[0].name}
          onChange={(e) => setMedications([{ ...medications[0], name: e.target.value }])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Enter medication name"
        />
      </div>

      <button
        onClick={handleAnalyze}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
      >
        Analyze Genetic Compatibility
      </button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This analysis provides guidance based on genetic markers. Always consult with
          a healthcare professional before making medication decisions.
        </p>
      </div>
    </div>
  );
};

// Adherence Prediction Tab
const AdherencePredictionTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [adherenceData, setAdherenceData] = useState({
    medicationHistory: [
      { taken: true, active: true, hadSideEffects: false },
      { taken: true, active: true, hadSideEffects: false },
      { taken: false, active: true, hadSideEffects: true },
    ],
    behavioralData: {
      hasCaregiverSupport: false,
    },
    demographics: {
      age: 55,
    },
  });

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.predictAdherence(
        user.id,
        adherenceData.medicationHistory,
        adherenceData.behavioralData,
        adherenceData.demographics
      );
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Adherence Risk Prediction</h3>
        <p className="text-gray-600 mb-6">
          Machine learning model predicts medication adherence likelihood and identifies risk factors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient Age</label>
          <input
            type="number"
            value={adherenceData.demographics.age}
            onChange={(e) => setAdherenceData({
              ...adherenceData,
              demographics: { ...adherenceData.demographics, age: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Caregiver Support</label>
          <select
            value={adherenceData.behavioralData.hasCaregiverSupport ? 'yes' : 'no'}
            onChange={(e) => setAdherenceData({
              ...adherenceData,
              behavioralData: { ...adherenceData.behavioralData, hasCaregiverSupport: e.target.value === 'yes' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <button
        onClick={handlePredict}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
      >
        Predict Adherence Risk
      </button>
    </div>
  );
};

// Drug Interactions Tab
const DrugInteractionsTab: React.FC<any> = ({ setLoading, setResult }) => {
  const [medications, setMedications] = useState([
    { id: '1', name: 'Warfarin' },
    { id: '2', name: 'Aspirin' },
  ]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.analyzeDrugInteractions(medications);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { id: Date.now().toString(), name: '' }]);
  };

  const updateMedication = (index: number, name: string) => {
    const updated = [...medications];
    updated[index].name = name;
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Drug Interaction Analysis</h3>
        <p className="text-gray-600 mb-6">
          Advanced severity scoring (1-10 scale) for drug-drug interactions with clinical recommendations.
        </p>
      </div>

      <div className="space-y-3">
        {medications.map((med, index) => (
          <div key={med.id} className="flex gap-2">
            <input
              type="text"
              value={med.name}
              onChange={(e) => updateMedication(index, e.target.value)}
              placeholder={`Medication ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            {medications.length > 2 && (
              <button
                onClick={() => removeMedication(index)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addMedication}
        className="w-full border-2 border-dashed border-gray-300 py-3 rounded-lg hover:border-gray-400 text-gray-600"
      >
        + Add Medication
      </button>

      <button
        onClick={handleAnalyze}
        className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium"
      >
        Analyze Interactions
      </button>
    </div>
  );
};

// Clinical Notes Tab
const ClinicalNotesTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [clinicalNote, setClinicalNote] = useState('');
  const [noteType, setNoteType] = useState('general');

  const handleSummarize = async () => {
    if (!clinicalNote.trim()) {
      alert('Please enter clinical notes');
      return;
    }

    setLoading(true);
    try {
      const response = await AIAPI.summarizeClinicalNote(clinicalNote, noteType);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleNote = `Patient presents with chief complaint of persistent headache for 3 days. History reveals gradual onset with no trauma. Vital signs: BP 130/85, HR 78, Temp 98.6F. Physical examination unremarkable. No neurological deficits noted. Diagnosed with tension headache. Prescribed ibuprofen 400mg TID with meals. Advised rest and stress reduction. Follow-up in 1 week if symptoms persist or worsen.`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Clinical Note Summarization</h3>
        <p className="text-gray-600 mb-6">
          NLP-powered extraction of key findings, critical flags, and medical terminology from clinical notes.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
        >
          <option value="general">General Note</option>
          <option value="progress">Progress Note</option>
          <option value="admission">Admission Note</option>
          <option value="discharge">Discharge Summary</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Notes</label>
        <textarea
          value={clinicalNote}
          onChange={(e) => setClinicalNote(e.target.value)}
          rows={8}
          placeholder="Enter or paste clinical notes here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        onClick={() => setClinicalNote(sampleNote)}
        className="text-blue-600 hover:text-blue-700 text-sm"
      >
        Load Sample Note
      </button>

      <button
        onClick={handleSummarize}
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
      >
        Summarize & Extract Key Findings
      </button>
    </div>
  );
};

// Smart Scheduling Tab
const SmartSchedulingTab: React.FC<any> = ({ setLoading, setResult }) => {
  const [medications, setMedications] = useState([
    { id: '1', name: 'Levothyroxine', type: 'thyroid', frequency: 1, instructions: 'take in the morning on empty stomach' },
    { id: '2', name: 'Atorvastatin', type: 'statin', frequency: 1, instructions: 'take at bedtime' },
  ]);
  const [lifestyle, setLifestyle] = useState({
    wakeTime: '07:00',
    sleepTime: '22:00',
    mainMealTime: '12:00',
  });

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.optimizeMedicationSchedule(medications, lifestyle, {});
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Smart Medication Scheduling</h3>
        <p className="text-gray-600 mb-6">
          AI-optimized timing recommendations based on drug interactions, lifestyle, and optimal absorption.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wake Time</label>
          <input
            type="time"
            value={lifestyle.wakeTime}
            onChange={(e) => setLifestyle({ ...lifestyle, wakeTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Main Meal Time</label>
          <input
            type="time"
            value={lifestyle.mainMealTime}
            onChange={(e) => setLifestyle({ ...lifestyle, mainMealTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Time</label>
          <input
            type="time"
            value={lifestyle.sleepTime}
            onChange={(e) => setLifestyle({ ...lifestyle, sleepTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <button
        onClick={handleOptimize}
        className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-medium"
      >
        Optimize Schedule
      </button>
    </div>
  );
};

// Adverse Events Tab
const AdverseEventsTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [patientData, setPatientData] = useState({
    medications: [
      { id: '1', name: 'Atorvastatin' },
    ],
    patientProfile: {
      age: 68,
      gender: 'male',
    },
    vitals: {
      bloodPressure: '140/90',
      heartRate: 72,
      temperature: '98.6',
    },
    medicalHistory: {
      chronicConditions: [],
      lifestyleFactors: {},
    },
  });

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.predictAdverseEvents(
        user.id,
        patientData.medications,
        patientData.patientProfile,
        patientData.vitals,
        patientData.medicalHistory
      );
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Adverse Event Prediction</h3>
        <p className="text-gray-600 mb-6">
          ML-based prediction of potential adverse reactions with early warning indicators and intervention recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient Age</label>
          <input
            type="number"
            value={patientData.patientProfile.age}
            onChange={(e) => setPatientData({
              ...patientData,
              patientProfile: { ...patientData.patientProfile, age: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={patientData.patientProfile.gender}
            onChange={(e) => setPatientData({
              ...patientData,
              patientProfile: { ...patientData.patientProfile, gender: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
          <input
            type="text"
            value={patientData.medications[0].name}
            onChange={(e) => setPatientData({
              ...patientData,
              medications: [{ ...patientData.medications[0], name: e.target.value }]
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
          <input
            type="text"
            value={patientData.vitals.bloodPressure}
            onChange={(e) => setPatientData({
              ...patientData,
              vitals: { ...patientData.vitals, bloodPressure: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="120/80"
          />
        </div>
      </div>

      <button
        onClick={handlePredict}
        className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium"
      >
        Predict Adverse Events
      </button>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          <strong>Warning:</strong> These predictions are for informational purposes only. Seek immediate medical
          attention if experiencing any adverse symptoms.
        </p>
      </div>
    </div>
  );
};

// Personalized Medicine Tab
const PersonalizedMedicineTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [patientData, setPatientData] = useState({
    ethnicity: 'caucasian',
    genetics: {
      cyp2d6: '*1/*1',
      cyp2c19: '*1/*1',
    },
    comorbidities: ['hypertension', 'diabetes'],
    currentMedications: [{ name: 'Metformin', dose: '500mg' }],
  });

  const handlePersonalize = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.personalizeTreatment(patientData);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personalized Medicine Recommendations</h3>
        <p className="text-gray-600 mb-6">
          Population-specific treatment recommendations based on ethnicity, genetics, and comorbidities with pharmacogenomic optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
          <select
            value={patientData.ethnicity}
            onChange={(e) => setPatientData({ ...patientData, ethnicity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="caucasian">Caucasian</option>
            <option value="african">African</option>
            <option value="asian">Asian</option>
            <option value="hispanic">Hispanic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CYP2D6 Status</label>
          <select
            value={patientData.genetics.cyp2d6}
            onChange={(e) => setPatientData({
              ...patientData,
              genetics: { ...patientData.genetics, cyp2d6: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="*1/*1">Normal Metabolizer</option>
            <option value="*2/*2">Poor Metabolizer</option>
            <option value="*17/*17">Ultra-rapid Metabolizer</option>
          </select>
        </div>
      </div>

      <button
        onClick={handlePersonalize}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium"
      >
        Generate Personalized Recommendations
      </button>
    </div>
  );
};

// Price Optimization Tab
const PriceOptimizationTab: React.FC<any> = ({ setLoading, setResult }) => {
  const [medicationData, setMedicationData] = useState({
    medication: 'Atorvastatin',
    dosage: '20mg',
    quantity: 30,
    zipCode: '10001',
  });

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.analyzePricing(medicationData.medication, medicationData.quantity, null);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Medication Price Optimization</h3>
        <p className="text-gray-600 mb-6">
          Compare brand vs generic prices, analyze multi-pharmacy costs, and find therapeutic alternatives with significant savings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
          <input
            type="text"
            value={medicationData.medication}
            onChange={(e) => setMedicationData({ ...medicationData, medication: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Lipitor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
          <input
            type="text"
            value={medicationData.dosage}
            onChange={(e) => setMedicationData({ ...medicationData, dosage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., 20mg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <input
            type="number"
            value={medicationData.quantity}
            onChange={(e) => setMedicationData({ ...medicationData, quantity: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
          <input
            type="text"
            value={medicationData.zipCode}
            onChange={(e) => setMedicationData({ ...medicationData, zipCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., 10001"
          />
        </div>
      </div>

      <button
        onClick={handleOptimize}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
      >
        Find Best Prices & Alternatives
      </button>
    </div>
  );
};

// Risk Stratification Tab
const RiskStratificationTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [riskData, setRiskData] = useState({
    age: 65,
    gender: 'male',
    systolicBP: 140,
    totalCholesterol: 220,
    hdlCholesterol: 45,
    smoking: true,
    diabetes: false,
    medications: ['Warfarin'],
  });

  const handleAssess = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.assessRisk(riskData);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Multi-Domain Risk Assessment</h3>
        <p className="text-gray-600 mb-6">
          Calculate ASCVD risk, HAS-BLED bleeding risk, STRATIFY falls risk, and Clinical Frailty Scale with action plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
          <input
            type="number"
            value={riskData.age}
            onChange={(e) => setRiskData({ ...riskData, age: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={riskData.gender}
            onChange={(e) => setRiskData({ ...riskData, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Systolic BP (mmHg)</label>
          <input
            type="number"
            value={riskData.systolicBP}
            onChange={(e) => setRiskData({ ...riskData, systolicBP: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Cholesterol (mg/dL)</label>
          <input
            type="number"
            value={riskData.totalCholesterol}
            onChange={(e) => setRiskData({ ...riskData, totalCholesterol: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Smoker</label>
          <select
            value={riskData.smoking ? 'yes' : 'no'}
            onChange={(e) => setRiskData({ ...riskData, smoking: e.target.value === 'yes' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diabetes</label>
          <select
            value={riskData.diabetes ? 'yes' : 'no'}
            onChange={(e) => setRiskData({ ...riskData, diabetes: e.target.value === 'yes' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleAssess}
        className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 font-medium"
      >
        Perform Risk Assessment
      </button>
    </div>
  );
};

// Drug Discovery Tab
const DrugDiscoveryTab: React.FC<any> = ({ setLoading, setResult }) => {
  const [discoveryData, setDiscoveryData] = useState({
    targetDisease: 'Type 2 Diabetes',
    knownDrug: 'Metformin',
    molecularTarget: 'AMPK',
  });

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.analyzeDrugRepurposing(discoveryData.knownDrug || discoveryData.targetDisease);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Drug Repurposing & Discovery</h3>
        <p className="text-gray-600 mb-6">
          Analyze drug repurposing opportunities, molecular similarity, target identification, and clinical trial matching.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Disease</label>
          <input
            type="text"
            value={discoveryData.targetDisease}
            onChange={(e) => setDiscoveryData({ ...discoveryData, targetDisease: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Alzheimer's Disease"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Known Drug (Optional)</label>
          <input
            type="text"
            value={discoveryData.knownDrug}
            onChange={(e) => setDiscoveryData({ ...discoveryData, knownDrug: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Aspirin"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Molecular Target (Optional)</label>
          <input
            type="text"
            value={discoveryData.molecularTarget}
            onChange={(e) => setDiscoveryData({ ...discoveryData, molecularTarget: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., EGFR"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium"
      >
        Analyze Repurposing Opportunities
      </button>
    </div>
  );
};

// Predictive Analytics Tab
const PredictiveAnalyticsTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [analyticsData, setAnalyticsData] = useState({
    predictionType: 'adherence',
    historicalData: {
      adherenceRates: [0.85, 0.78, 0.82, 0.75, 0.80],
      timepoints: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    },
    patientFactors: {
      age: 58,
      comorbidities: 2,
      medicationComplexity: 'moderate',
    },
  });

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.predictTreatmentOutcome(analyticsData);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Predictive Analytics</h3>
        <p className="text-gray-600 mb-6">
          Time-series forecasting for medication adherence, readmission prediction, and disease progression modeling.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prediction Type</label>
          <select
            value={analyticsData.predictionType}
            onChange={(e) => setAnalyticsData({ ...analyticsData, predictionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="adherence">Adherence Forecast</option>
            <option value="readmission">Readmission Risk</option>
            <option value="progression">Disease Progression</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient Age</label>
          <input
            type="number"
            value={analyticsData.patientFactors.age}
            onChange={(e) => setAnalyticsData({
              ...analyticsData,
              patientFactors: { ...analyticsData.patientFactors, age: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Comorbidities</label>
          <input
            type="number"
            value={analyticsData.patientFactors.comorbidities}
            onChange={(e) => setAnalyticsData({
              ...analyticsData,
              patientFactors: { ...analyticsData.patientFactors, comorbidities: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medication Complexity</label>
          <select
            value={analyticsData.patientFactors.medicationComplexity}
            onChange={(e) => setAnalyticsData({
              ...analyticsData,
              patientFactors: { ...analyticsData.patientFactors, medicationComplexity: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="low">Low (1-2 medications)</option>
            <option value="moderate">Moderate (3-5 medications)</option>
            <option value="high">High (6+ medications)</option>
          </select>
        </div>
      </div>

      <button
        onClick={handlePredict}
        className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 font-medium"
      >
        Generate Predictions
      </button>
    </div>
  );
};

// Clinical Decision Support Tab
const ClinicalDecisionSupportTab: React.FC<any> = ({ user, setLoading, setResult }) => {
  const [clinicalData, setClinicalData] = useState({
    clinicalScenario: 'chest-pain',
    patientData: {
      age: 62,
      gender: 'male',
      symptoms: ['chest pain', 'shortness of breath'],
      vitals: {
        heartRate: 95,
        bloodPressure: '145/92',
        temperature: 98.6,
      },
    },
    medications: ['Aspirin', 'Metoprolol'],
  });

  const handleGetSupport = async () => {
    setLoading(true);
    try {
      const response = await AIAPI.getClinicalDecisionSupport(clinicalData);
      setResult(response);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Clinical Decision Support</h3>
        <p className="text-gray-600 mb-6">
          Real-time point-of-care recommendations with evidence-based guidelines, contraindication checking, and severity assessment.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Scenario</label>
          <select
            value={clinicalData.clinicalScenario}
            onChange={(e) => setClinicalData({ ...clinicalData, clinicalScenario: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="chest-pain">Acute Chest Pain</option>
            <option value="sepsis">Suspected Sepsis</option>
            <option value="stroke">Stroke Symptoms</option>
            <option value="heart-failure">Heart Failure Exacerbation</option>
            <option value="respiratory">Respiratory Distress</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Age</label>
            <input
              type="number"
              value={clinicalData.patientData.age}
              onChange={(e) => setClinicalData({
                ...clinicalData,
                patientData: { ...clinicalData.patientData, age: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={clinicalData.patientData.gender}
              onChange={(e) => setClinicalData({
                ...clinicalData,
                patientData: { ...clinicalData.patientData, gender: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm)</label>
            <input
              type="number"
              value={clinicalData.patientData.vitals.heartRate}
              onChange={(e) => setClinicalData({
                ...clinicalData,
                patientData: {
                  ...clinicalData.patientData,
                  vitals: { ...clinicalData.patientData.vitals, heartRate: parseInt(e.target.value) }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
            <input
              type="text"
              value={clinicalData.patientData.vitals.bloodPressure}
              onChange={(e) => setClinicalData({
                ...clinicalData,
                patientData: {
                  ...clinicalData.patientData,
                  vitals: { ...clinicalData.patientData.vitals, bloodPressure: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="120/80"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleGetSupport}
        className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 font-medium"
      >
        Get Clinical Recommendations
      </button>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
        <p className="text-sm text-violet-800">
          <strong>Important:</strong> These recommendations are decision support tools only. Clinical judgment and local protocols should always guide patient care.
        </p>
      </div>
    </div>
  );
};

export default AIInsightsPage;
