import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

type FooterProps = {
  language: 'ar' | 'en';
};

export default function Footer({ language }: FooterProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('المزيد عنا', 'More About Us')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('من نحن', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('المدونة', 'Blog')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('اتصل بنا', 'Contact Us')}
                </Link>
              </li>
              <li>
                <Link to="/partner" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('كن شريكاً', 'Become a Partner')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('سهلناها عليك', 'We Made It Easy')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/prescription" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('أرسل روشتة', 'Send Prescription')}
                </Link>
              </li>
              <li>
                <Link to="/monthly-prescription" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('الروشتة الشهرية', 'Monthly Prescription')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Also in Chefaa */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('أيضاً في شفاء', 'Also in Chefaa')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/supply" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('التوريد', 'Supply')}
                </Link>
              </li>
              <li>
                <Link to="/bi-hub" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('بي-هب', 'Bi-Hub')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('تابعنا', 'Follow Us')}</h3>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue-300 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue-300 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue-300 transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('قانوني', 'Legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('شروط الخدمة', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-brand-blue-300 transition-colors">
                  {t('سياسة الخصوصية', 'Privacy Policy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/20 text-center">
          <p className="text-sm">
            {t('الرقم الضريبي: 718-859-672', 'Tax Number: 718-859-672')}
          </p>
          <p className="text-sm mt-2">
            {t('© 2024 شفاء. جميع الحقوق محفوظة.', '© 2024 Chefaa. All rights reserved.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
