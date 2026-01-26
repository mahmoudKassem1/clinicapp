import React, { useState, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation
import { DollarSign, CalendarDays, BarChart, ArrowLeft } from 'lucide-react'; // Changed icons
import { LanguageContext } from '../patient/LanguageContext';
import BackButton from '../patient/BackButton';
import DoctorNavbar from './DoctorNavbar'; // Import DoctorNavbar

// --- Mock Finance Data (with revenue property) ---
const mockFinanceData = [
  { id: 1, date: '2026-01-15', patientName: 'John Doe', revenue: 500, currency: 'EGP' },
  { id: 2, date: '2026-01-15', patientName: 'Jane Smith', revenue: 250, currency: 'EGP' },
  { id: 3, date: '2026-01-16', patientName: 'Ahmed Ali', revenue: 300, currency: 'EGP' },
  { id: 4, date: '2026-02-01', patientName: 'Fatima Zahra', revenue: 500, currency: 'EGP' },
  { id: 5, date: '2026-02-05', patientName: 'Chris Wilson', revenue: 150, currency: 'EGP' },
  { id: 6, date: '2025-12-20', patientName: 'Maria Garcia', revenue: 500, currency: 'EGP' },
  { id: 7, date: '2025-11-10', patientName: 'Carlos Ruiz', revenue: 600, currency: 'EGP' },
  { id: 8, date: '2026-01-20', patientName: 'Sara Lee', revenue: 400, currency: 'EGP' },
  { id: 9, date: '2026-03-01', patientName: 'Mike Ross', revenue: 350, currency: 'EGP' },
  { id: 10, date: '2026-03-05', patientName: 'Rachel Green', revenue: 200, currency: 'EGP' },
  { id: 11, date: '2026-01-25', patientName: 'Peter Jones', revenue: 450, currency: 'EGP' },
  { id: 12, date: '2026-02-10', patientName: 'Lisa Adams', revenue: 300, currency: 'EGP' },
  { id: 13, date: '2026-03-15', patientName: 'Omar Hassan', revenue: 500, currency: 'EGP' },
];
// --- End Mock Finance Data ---

const FinancePage = () => {
  const { language } = useContext(LanguageContext);
  const location = useLocation(); // For DoctorNavbar active link
  const navigate = useNavigate();
  const [filterPeriod, setFilterPeriod] = useState('month'); // 'month' or 'year'
  const currentDate = useMemo(() => new Date(), []);

  const translations = {
    en: {
      financeDashboard: 'Finance Dashboard',
      totalMonthlyRevenue: 'Total Monthly Revenue',
      yearlyTotal: 'Yearly Total',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      date: 'Date',
      patientName: 'Patient Name',
      revenueAmount: 'Revenue Amount',
      noFinanceData: 'No finance data available for this period.',
      totalRevenue: 'Total Revenue', // Added for consistency with summary cards
    },
    ar: {
      financeDashboard: 'لوحة تحكم المالية',
      totalMonthlyRevenue: 'إجمالي الإيرادات الشهرية',
      yearlyTotal: 'إجمالي الإيرادات السنوية',
      thisMonth: 'هذا الشهر',
      thisYear: 'هذا العام',
      date: 'التاريخ',
      patientName: 'اسم المريض',
      revenueAmount: 'مبلغ الإيرادات',
      noFinanceData: 'لا توجد بيانات مالية متاحة لهذه الفترة.',
      totalRevenue: 'إجمالي الإيرادات', // Added for consistency with summary cards
    }
  };

  const t = translations[language];
  const isArabic = language === 'ar';

  const filteredData = useMemo(() => {
    return mockFinanceData.filter(record => {
      const recordDate = new Date(record.date);
      if (filterPeriod === 'month') {
        return recordDate.getMonth() === currentDate.getMonth() && recordDate.getFullYear() === currentDate.getFullYear();
      } else if (filterPeriod === 'year') {
        return recordDate.getFullYear() === currentDate.getFullYear();
      }
      return false;
    });
  }, [filterPeriod, currentDate]);

  const totalRevenue = useMemo(() => {
    return filteredData.reduce((sum, record) => sum + record.revenue, 0);
  }, [filteredData]);

  const SummaryCard = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between border border-slate-100">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">
          {filteredData.length > 0 ? filteredData[0].currency : 'EGP'} {value.toFixed(2)}
        </h3>
      </div>
      <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
        {icon}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-50 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <DoctorNavbar currentPath={location.pathname} /> {/* Pass current path */}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"> {/* Content area below navbar */}
        <header className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.financeDashboard}</h1>
        </header>

        {/* Filter Bar */}
        <div className={`flex mb-6 gap-4 ${isArabic ? 'justify-end' : 'justify-start'}`}>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${filterPeriod === 'month' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            {t.thisMonth}
          </button>
          <button
            onClick={() => setFilterPeriod('year')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${filterPeriod === 'year' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            {t.thisYear}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {filterPeriod === 'month' && (
            <SummaryCard 
              title={t.totalMonthlyRevenue} 
              value={totalRevenue} 
              icon={<DollarSign size={20} />} 
            />
          )}
          {filterPeriod === 'year' && (
            <SummaryCard 
              title={t.yearlyTotal} 
              value={totalRevenue} 
              icon={<BarChart size={20} />} 
            />
          )}
        </div>

        {/* Revenue Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{t.financeDashboard}</h2>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}>
                      {t.date}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}>
                      {t.patientName}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}>
                      {t.revenueAmount}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredData.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {record.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {record.currency} {record.revenue.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-lg">
              {t.noFinanceData}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancePage;