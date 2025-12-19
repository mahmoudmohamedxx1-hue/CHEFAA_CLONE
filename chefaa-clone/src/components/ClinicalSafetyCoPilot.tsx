import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Info, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Medication {
  name: string;
  dosage?: string;
  quantity?: number;
}

interface DrugInteraction {
  drug_a: string;
  drug_b: string;
  interaction_type: string;
  severity_score: number;
  clinical_effects: string;
  management_strategy: string;
}

interface SafetyAnalysisResult {
  medication_list: Medication[];
  analysis_results: {
    interactions: DrugInteraction[];
    totalInteractions: number;
    majorInteractions: number;
    moderateInteractions: number;
    minorInteractions: number;
  };
  overall_risk_score: number;
  risk_level: 'safe' | 'caution' | 'warning' | 'danger';
  recommendations: string[];
  alternative_suggestions: any[];
  analysis_duration_ms: number;
}

interface ClinicalSafetyCoPilotProps {
  medications: Medication[];
  userId?: string;
  orderId?: string;
  onAnalysisComplete?: (result: SafetyAnalysisResult) => void;
  autoAnalyze?: boolean;
}

export default function ClinicalSafetyCoPilot({
  medications,
  userId,
  orderId,
  onAnalysisComplete,
  autoAnalyze = true
}: ClinicalSafetyCoPilotProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SafetyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoAnalyze && medications.length > 0) {
      performSafetyAnalysis();
    }
  }, [medications, autoAnalyze]);

  const performSafetyAnalysis = async () => {
    if (medications.length === 0) {
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-safety-analysis', {
        body: {
          medications,
          userId,
          orderId
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error.message);
      }

      const result = data.data as SafetyAnalysisResult;
      setAnalysisResult(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: any) {
      console.error('Safety analysis error:', err);
      setError(err.message || 'Failed to perform safety analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'caution':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle className="w-6 h-6" />;
      case 'caution':
        return <Info className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'danger':
        return <XCircle className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getSeverityColor = (severityScore: number) => {
    if (severityScore >= 8) return 'bg-red-100 text-red-800';
    if (severityScore >= 6) return 'bg-orange-100 text-orange-800';
    if (severityScore >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (medications.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <p className="text-blue-800 font-medium">Add medications to enable safety analysis</p>
        <p className="text-blue-600 text-sm mt-1">AI-powered safety co-pilot will check for drug interactions</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Clinical Safety Co-Pilot</h2>
              <p className="text-sm text-gray-600">AI-powered drug interaction analysis</p>
            </div>
          </div>
          {!autoAnalyze && (
            <button
              onClick={performSafetyAnalysis}
              disabled={analyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {analyzing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Analyze Safety</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {analyzing && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Analyzing medication safety...</p>
              <p className="text-sm text-gray-500 mt-1">Checking {medications.length} medication(s)</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Analysis Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {analysisResult && !analyzing && (
          <div className="space-y-6">
            {/* Risk Score Card */}
            <div className={`border-2 rounded-lg p-6 ${getRiskColor(analysisResult.risk_level)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getRiskIcon(analysisResult.risk_level)}
                  <div>
                    <h3 className="text-lg font-bold capitalize">{analysisResult.risk_level} Level</h3>
                    <p className="text-sm opacity-80">Overall Safety Score: {100 - analysisResult.overall_risk_score}/100</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{analysisResult.overall_risk_score}%</div>
                  <div className="text-sm opacity-80">Risk Score</div>
                </div>
              </div>
            </div>

            {/* Interaction Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{analysisResult.analysis_results.majorInteractions}</div>
                <div className="text-sm text-red-800">Major Interactions</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{analysisResult.analysis_results.moderateInteractions}</div>
                <div className="text-sm text-yellow-800">Moderate Interactions</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{analysisResult.analysis_results.minorInteractions}</div>
                <div className="text-sm text-blue-800">Minor Interactions</div>
              </div>
            </div>

            {/* Detailed Interactions */}
            {analysisResult.analysis_results.interactions.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Detected Interactions</h3>
                <div className="space-y-3">
                  {analysisResult.analysis_results.interactions.map((interaction, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{interaction.drug_a}</span>
                            <span className="text-gray-500">+</span>
                            <span className="font-semibold text-gray-900">{interaction.drug_b}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(interaction.severity_score)}`}>
                          Severity: {interaction.severity_score}/10
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Effect:</span> {interaction.clinical_effects}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Management:</span> {interaction.management_strategy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Safety Recommendations</h3>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analysis Metadata */}
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Analysis completed in {analysisResult.analysis_duration_ms}ms • {medications.length} medication(s) analyzed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
