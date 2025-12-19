import { useEffect, useState } from 'react';
import { Shield, CheckCircle, Lock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrustBadgesProps {
  language: 'ar' | 'en';
  variant?: 'inline' | 'grid' | 'footer';
}

interface Certification {
  id: string;
  certification_type: string;
  certification_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  verification_url: string | null;
  metadata: {
    country?: string;
    scope?: string;
    level?: string;
    type?: string;
  };
}

export default function TrustBadges({ language, variant = 'inline' }: TrustBadgesProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_certifications')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setCertifications(data);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCertificationIcon = (type: string) => {
    switch (type) {
      case 'pharmacy_license':
        return <Award className="w-5 h-5" />;
      case 'iso_27001':
        return <Shield className="w-5 h-5" />;
      case 'pci_dss':
        return <Lock className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getCertificationName = (type: string) => {
    const names: Record<string, { ar: string; en: string }> = {
      pharmacy_license: { ar: 'ترخيص صيدلية', en: 'Pharmacy License' },
      iso_27001: { ar: 'ISO 27001', en: 'ISO 27001' },
      gdp_compliance: { ar: 'GDP معتمد', en: 'GDP Certified' },
      pqs_certification: { ar: 'PQS معتمد', en: 'PQS Certified' },
      pci_dss: { ar: 'PCI DSS', en: 'PCI DSS' },
      ssl_certificate: { ar: 'SSL آمن', en: 'SSL Secure' },
    };
    return t(names[type]?.ar || type, names[type]?.en || type);
  };

  if (loading) return null;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-4 flex-wrap">
        {certifications.slice(0, 4).map((cert) => (
          <div
            key={cert.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg"
            title={cert.issuing_authority}
          >
            <div className="text-green-600">
              {getCertificationIcon(cert.certification_type)}
            </div>
            <span className="text-sm font-semibold text-green-800">
              {getCertificationName(cert.certification_type)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
            title={cert.metadata.scope || cert.issuing_authority}
          >
            <div className="text-brand-blue-500 mb-2 group-hover:scale-110 transition-transform">
              {getCertificationIcon(cert.certification_type)}
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">
              {getCertificationName(cert.certification_type)}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {cert.certification_number}
            </span>
            {cert.verification_url && (
              <a
                href={cert.verification_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-blue-500 hover:underline mt-1"
              >
                {t('تحقق', 'Verify')}
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Footer variant
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-300 uppercase">
        {t('الشهادات والتراخيص', 'Certifications & Licenses')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="flex items-start gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <div className="mt-1">
              {getCertificationIcon(cert.certification_type)}
            </div>
            <div>
              <p className="text-xs font-semibold">
                {getCertificationName(cert.certification_type)}
              </p>
              <p className="text-xs opacity-75">
                {cert.certification_number}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Security Seals */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">
            {t('تشفير SSL 256-بت', '256-bit SSL Encryption')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">
            {t('متوافق مع GDPR', 'GDPR Compliant')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">
            {t('متوافق مع PCI DSS', 'PCI DSS Compliant')}
          </span>
        </div>
      </div>
    </div>
  );
}
