import { useState, useEffect } from 'react'
import { supabase, type School, type Book, type Level } from '../lib/supabase'

export default function ManageBooks() {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState({
    level_id: '',
    barcode: '',
    title: '',
    unit_price: '',
    total_quantity: '',
    image_url: '',
  })

  useEffect(() => {
    loadSchools()
  }, [])

  useEffect(() => {
    if (selectedSchool) {
      loadLevelsAndBooks()
    }
  }, [selectedSchool])

  const loadSchools = async () => {
    const { data } = await supabase.from('schools').select('*')
    if (data) {
      setSchools(data)
      if (data.length > 0) setSelectedSchool(data[0])
    }
  }

  const loadLevelsAndBooks = async () => {
    if (!selectedSchool) return

    const { data: levelsData } = await supabase
      .from('levels')
      .select('*')
      .eq('school_id', selectedSchool.id)

    if (levelsData) {
      setLevels(levelsData)
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .in('level_id', levelsData.map((l) => l.id))

      if (booksData) {
        setBooks(booksData)
      }
    }
  }

  const handleSaveBook = async () => {
    if (!formData.level_id || !formData.barcode || !formData.title || !formData.unit_price) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      if (editingBook) {
        // Update
        await supabase
          .from('books')
          .update({
            level_id: formData.level_id,
            barcode: formData.barcode,
            title: formData.title,
            unit_price: parseFloat(formData.unit_price),
            total_quantity: parseInt(formData.total_quantity) || 0,
            image_url: formData.image_url || null,
          })
          .eq('id', editingBook.id)

        alert('تم تحديث الكتاب بنجاح')
      } else {
        // Insert
        await supabase.from('books').insert({
          level_id: formData.level_id,
          barcode: formData.barcode,
          title: formData.title,
          unit_price: parseFloat(formData.unit_price),
          total_quantity: parseInt(formData.total_quantity) || 0,
          image_url: formData.image_url || null,
        })

        alert('تم إضافة الكتاب بنجاح')
      }

      resetForm()
      loadLevelsAndBooks()
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('هل تريد حذف هذا الكتاب؟')) return

    try {
      await supabase.from('books').delete().eq('id', bookId)
      alert('تم حذف الكتاب بنجاح')
      loadLevelsAndBooks()
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    }
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setFormData({
      level_id: book.level_id,
      barcode: book.barcode,
      title: book.title,
      unit_price: book.unit_price.toString(),
      total_quantity: book.total_quantity.toString(),
      image_url: book.image_url || '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      level_id: '',
      barcode: '',
      title: '',
      unit_price: '',
      total_quantity: '',
      image_url: '',
    })
    setEditingBook(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">إدارة الكتب</h1>

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

        {/* Add Button */}
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
        >
          + إضافة كتاب جديد
        </button>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">{editingBook ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</h2>

              <div className="space-y-4">
                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold mb-1">المستوى</label>
                  <select
                    value={formData.level_id}
                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">اختر المستوى</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.level_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-semibold mb-1">رمز الكتاب (ms00000/00)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="ms00001/00"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold mb-1">عنوان الكتاب</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان الكتاب"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-semibold mb-1">سعر الكتاب</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                {/* Total Quantity */}
                <div>
                  <label className="block text-sm font-semibold mb-1">الكمية الإجمالية</label>
                  <input
                    type="number"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold mb-1">رابط الصورة (اختياري)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                {/* Preview */}
                {formData.image_url && (
                  <div className="mt-2">
                    <img src={formData.image_url} alt="معاينة" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveBook}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
                >
                  حفظ
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div className="space-y-6">
          {levels.map((level) => {
            const levelBooks = books.filter((b) => b.level_id === level.id)

            return (
              <div key={level.id} className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xl font-bold mb-4">{level.level_name}</h3>

                {levelBooks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">لا توجد كتب في هذا المستوى</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {levelBooks.map((book) => (
                      <div key={book.id} className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition">
                        {book.image_url && (
                          <img src={book.image_url} alt={book.title} className="w-full h-40 object-cover" />
                        )}
                        <div className="p-4">
                          <h4 className="font-bold mb-2">{book.title}</h4>
                          <div className="text-sm space-y-1 mb-3">
                            <p>
                              <span className="text-muted-foreground">الرمز:</span> {book.barcode}
                            </p>
                            <p>
                              <span className="text-muted-foreground">السعر:</span> {book.unit_price.toFixed(2)} ريال
                            </p>
                            <p>
                              <span className="text-muted-foreground">الكمية:</span> {book.total_quantity}
                            </p>
                            <p>
                              <span className="text-muted-foreground">المباع:</span> {book.sold_quantity}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditBook(book)}
                              className="flex-1 px-2 py-1 bg-primary text-primary-foreground rounded text-sm font-semibold"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="flex-1 px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm font-semibold"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
