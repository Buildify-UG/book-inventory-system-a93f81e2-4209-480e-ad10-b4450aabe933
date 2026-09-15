import { useState, useEffect } from 'react'
import { supabase, type School } from '../lib/supabase'

interface SaleReport {
  date: string
  total_items: number
  total_amount: number
  transaction_count: number
}

interface BookReport {
  barcode: string
  title: string
  total_sold: number
  total_revenue: number
}

export default function Reports() {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'books'>('daily')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyReport, setDailyReport] = useState<SaleReport[]>([])
  const [bookReport, setBookReport] = useState<BookReport[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSchools()
  }, [])

  const loadSchools = async () => {
    const { data } = await supabase.from('schools').select('*')
    if (data) {
      setSchools(data)
      if (data.length > 0) setSelectedSchool(data[0])
    }
  }

  const generateDailyReport = async () => {
    if (!selectedSchool) return
    setLoading(true)

    try {
      const { data } = await supabase
        .from('sales_transactions')
        .select('transaction_date, total_items, total_amount')
        .eq('school_id', selectedSchool.id)
        .gte('transaction_date', startDate + 'T00:00:00')
        .lte('transaction_date', endDate + 'T23:59:59')
        .order('transaction_date', { ascending: true })

      if (data) {
        const grouped: { [key: string]: SaleReport } = {}

        data.forEach((transaction) => {
          const date = new Date(transaction.transaction_date).toLocaleDateString('ar-SA')
          if (!grouped[date]) {
            grouped[date] = {
              date,
              total_items: 0,
              total_amount: 0,
              transaction_count: 0,
            }
          }
          grouped[date].total_items += transaction.total_items
          grouped[date].total_amount += transaction.total_amount
          grouped[date].transaction_count += 1
        })

        setDailyReport(Object.values(grouped))
      }
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const generateBookReport = async () => {
    if (!selectedSchool) return
    setLoading(true)

    try {
      const { data } = await supabase
        .from('sale_items')
        .select('book_id, quantity, total_price, books(barcode, title)')
        .order('quantity', { ascending: false })

      if (data) {
        const grouped: { [key: string]: BookReport } = {}

        data.forEach((item: any) => {
          const barcode = item.books.barcode
          if (!grouped[barcode]) {
            grouped[barcode] = {
              barcode,
              title: item.books.title,
              total_sold: 0,
              total_revenue: 0,
            }
          }
          grouped[barcode].total_sold += item.quantity
          grouped[barcode].total_revenue += item.total_price
        })

        setBookReport(Object.values(grouped).sort((a, b) => b.total_sold - a.total_sold))
      }
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    if (reportType === 'daily' || reportType === 'monthly') {
      generateDailyReport()
    } else {
      generateBookReport()
    }
  }

  const downloadCSV = () => {
    let csv = ''

    if (reportType === 'daily' || reportType === 'monthly') {
      csv = 'التاريخ,عدد الكتب,الإجمالي (ريال),عدد العمليات\n'
      dailyReport.forEach((row) => {
        csv += `${row.date},${row.total_items},${row.total_amount.toFixed(2)},${row.transaction_count}\n`
      })
    } else {
      csv = 'الرمز,العنوان,الكمية المباعة,الإجمالي (ريال)\n'
      bookReport.forEach((row) => {
        csv += `${row.barcode},"${row.title}",${row.total_sold},${row.total_revenue.toFixed(2)}\n`
      })
    }

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const totalAmount = (reportType === 'daily' || reportType === 'monthly')
    ? dailyReport.reduce((sum, row) => sum + row.total_amount, 0)
    : bookReport.reduce((sum, row) => sum + row.total_revenue, 0)

  const totalItems = (reportType === 'daily' || reportType === 'monthly')
    ? dailyReport.reduce((sum, row) => sum + row.total_items, 0)
    : bookReport.reduce((sum, row) => sum + row.total_sold, 0)

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">التقارير</h1>

        {/* School Selector */}
        {schools.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">اختر المدرسة</label>
            <select
              value={selectedSchool?.id || ''}
              onChange={(e) => {
                const school = schools.find((s) => s.id === e.target.value)
                setSelectedSchool(school || null)
              }}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Report Type */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">نوع التقرير</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setReportType('daily')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                reportType === 'daily'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground border border-border'
              }`}
            >
              يومي
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                reportType === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground border border-border'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setReportType('books')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                reportType === 'books'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground border border-border'
              }`}
            >
              أفضل الكتب
            </button>
          </div>

          {/* Date Range */}
          {reportType !== 'books' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">من</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">إلى</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : 'إنشاء التقرير'}
          </button>
        </div>

        {/* Summary Stats */}
        {(dailyReport.length > 0 || bookReport.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-primary text-primary-foreground rounded-lg p-4">
              <p className="text-sm opacity-90">الإجمالي (ريال)</p>
              <p className="text-3xl font-bold">{totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-accent text-accent-foreground rounded-lg p-4">
              <p className="text-sm opacity-90">عدد الكتب</p>
              <p className="text-3xl font-bold">{totalItems}</p>
            </div>
          </div>
        )}

        {/* Report Table */}
        {(dailyReport.length > 0 || bookReport.length > 0) && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">تفاصيل التقرير</h3>
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold"
              >
                ⬇ تحميل CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {reportType === 'daily' || reportType === 'monthly' ? (
                      <>
                        <th className="text-right p-2">التاريخ</th>
                        <th className="text-right p-2">عدد الكتب</th>
                        <th className="text-right p-2">الإجمالي</th>
                        <th className="text-right p-2">العمليات</th>
                      </>
                    ) : (
                      <>
                        <th className="text-right p-2">الرمز</th>
                        <th className="text-right p-2">العنوان</th>
                        <th className="text-right p-2">المباع</th>
                        <th className="text-right p-2">الإجمالي</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(reportType === 'daily' || reportType === 'monthly') ? (
                    dailyReport.map((row, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2">{row.date}</td>
                        <td className="p-2">{row.total_items}</td>
                        <td className="p-2 font-semibold">{row.total_amount.toFixed(2)} ريال</td>
                        <td className="p-2">{row.transaction_count}</td>
                      </tr>
                    ))
                  ) : (
                    bookReport.map((row, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{row.barcode}</td>
                        <td className="p-2">{row.title}</td>
                        <td className="p-2">{row.total_sold}</td>
                        <td className="p-2 font-semibold">{row.total_revenue.toFixed(2)} ريال</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(dailyReport.length === 0 && bookReport.length === 0) && (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">لم يتم إنشاء أي تقرير بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
