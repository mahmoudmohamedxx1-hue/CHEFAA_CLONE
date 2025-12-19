import { useState } from 'react';
import { Upload, Download, FileText, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BulkOrderInterfaceProps {
  language: 'ar' | 'en';
  onOrderCreated?: () => void;
}

interface BulkOrderItem {
  sku: string;
  quantity: number;
  product_name?: string;
  unit_price?: number;
  status?: 'pending' | 'found' | 'not_found';
}

export default function BulkOrderInterface({ language, onOrderCreated }: BulkOrderInterfaceProps) {
  const [bulkItems, setBulkItems] = useState<BulkOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { user } = useAuth();

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus('idle');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV (assuming format: SKU,Quantity)
      const items: BulkOrderItem[] = [];
      for (let i = 1; i < lines.length; i++) { // Skip header
        const [sku, quantity] = lines[i].split(',').map(s => s.trim());
        if (sku && quantity) {
          items.push({
            sku,
            quantity: parseInt(quantity, 10),
            status: 'pending'
          });
        }
      }

      setBulkItems(items);
      setUploadStatus('success');
      
      // Validate items against database
      await validateItems(items);
    } catch (error) {
      console.error('Error parsing file:', error);
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const validateItems = async (items: BulkOrderItem[]) => {
    setProcessing(true);
    
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          const { data } = await supabase
            .from('products')
            .select('id, name, price, stock_quantity')
            .eq('sku', item.sku)
            .single();

          if (data) {
            return {
              ...item,
              product_name: data.name,
              unit_price: data.price,
              status: data.stock_quantity >= item.quantity ? 'found' : 'not_found'
            } as BulkOrderItem;
          }

          return { ...item, status: 'not_found' } as BulkOrderItem;
        })
      );

      setBulkItems(updatedItems);
    } catch (error) {
      console.error('Error validating items:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitBulkOrder = async () => {
    if (!user) {
      alert(t('يرجى تسجيل الدخول أولاً', 'Please login first'));
      return;
    }

    const validItems = bulkItems.filter(item => item.status === 'found');
    if (validItems.length === 0) {
      alert(t('لا توجد منتجات صالحة للطلب', 'No valid products to order'));
      return;
    }

    setLoading(true);

    try {
      const total = validItems.reduce(
        (sum, item) => sum + (item.unit_price || 0) * item.quantity,
        0
      );

      const { data, error } = await supabase
        .from('bulk_orders')
        .insert({
          user_id: user.id,
          company_name: 'Company Name', // You can add a form field for this
          order_data: {
            items: validItems,
            total,
            item_count: validItems.length,
          },
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      alert(t(
        'تم إرسال الطلب بنجاح! سنتواصل معك قريباً.',
        'Bulk order submitted successfully! We will contact you soon.'
      ));

      setBulkItems([]);
      setUploadStatus('idle');
      
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (error) {
      console.error('Error submitting bulk order:', error);
      alert(t('حدث خطأ في إرسال الطلب', 'Error submitting order'));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'SKU,Quantity\nPROD-001,10\nPROD-002,20';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_order_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTotalAmount = () => {
    return bulkItems
      .filter(item => item.status === 'found')
      .reduce((sum, item) => sum + (item.unit_price || 0) * item.quantity, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {t('طلب بالجملة', 'Bulk Order')}
      </h2>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          {t('كيفية تقديم طلب بالجملة:', 'How to Submit a Bulk Order:')}
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>{t('قم بتنزيل نموذج CSV', 'Download the CSV template')}</li>
          <li>{t('املأ البيانات (SKU، الكمية)', 'Fill in the data (SKU, Quantity)')}</li>
          <li>{t('قم برفع الملف', 'Upload the file')}</li>
          <li>{t('راجع الطلب وأرسله', 'Review and submit the order')}</li>
        </ol>
      </div>

      {/* Download Template */}
      <div className="mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          {t('تحميل نموذج CSV', 'Download CSV Template')}
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          {t('رفع ملف CSV', 'Upload CSV File')}
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-blue-500 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
            id="bulk-upload"
          />
          <label htmlFor="bulk-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-700 font-medium">
              {t('اضغط لرفع ملف CSV', 'Click to upload CSV file')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('أو اسحب الملف وأفلته هنا', 'or drag and drop it here')}
            </p>
          </label>
        </div>

        {uploadStatus === 'success' && (
          <div className="mt-3 flex items-center gap-2 text-semantic-success">
            <CheckCircle className="w-5 h-5" />
            <span>{t('تم رفع الملف بنجاح', 'File uploaded successfully')}</span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-semantic-error">
            <AlertCircle className="w-5 h-5" />
            <span>{t('خطأ في رفع الملف', 'Error uploading file')}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      {bulkItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('المنتجات المحددة', 'Selected Products')} ({bulkItems.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t('SKU', 'SKU')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t('اسم المنتج', 'Product Name')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{t('الكمية', 'Quantity')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{t('سعر الوحدة', 'Unit Price')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{t('الإجمالي', 'Total')}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">{t('الحالة', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {bulkItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.product_name || t('جاري التحميل...', 'Loading...')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.unit_price ? `${item.unit_price.toFixed(2)} ${t('ج.م', 'EGP')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {item.unit_price
                        ? `${(item.unit_price * item.quantity).toFixed(2)} ${t('ج.م', 'EGP')}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {processing ? (
                        <span className="text-gray-500 text-sm">{t('جاري التحقق...', 'Validating...')}</span>
                      ) : item.status === 'found' ? (
                        <CheckCircle className="w-5 h-5 text-semantic-success mx-auto" />
                      ) : item.status === 'not_found' ? (
                        <AlertCircle className="w-5 h-5 text-semantic-error mx-auto" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">
                {t('عدد المنتجات الصالحة:', 'Valid Products:')}
              </span>
              <span className="font-semibold">
                {bulkItems.filter(item => item.status === 'found').length} / {bulkItems.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">{t('الإجمالي الكلي:', 'Grand Total:')}</span>
              <span className="text-2xl font-bold text-brand-blue-500">
                {getTotalAmount().toFixed(2)} {t('ج.م', 'EGP')}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitBulkOrder}
            disabled={loading || bulkItems.filter(item => item.status === 'found').length === 0}
            className="w-full mt-6 py-4 bg-brand-blue-500 text-white rounded-lg font-bold text-lg hover:bg-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            {loading
              ? t('جاري الإرسال...', 'Submitting...')
              : t('إرسال الطلب', 'Submit Order')}
          </button>
        </div>
      )}
    </div>
  );
}
