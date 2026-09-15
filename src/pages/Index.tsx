import { useState, useEffect, useRef } from 'react'
import { supabase, type School, type Book, type Level, type SaleItem } from '../lib/supabase'

export default function Index() {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [view, setView] = useState<'dashboard' | 'sales' | 'returns'>('dashboard')
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showCamera, setShowCamera] = useState(false)

  // Load schools
  useEffect(() => {
    loadSchools()
  }, [])

  const loadSchools = async () => {
    const { data } = await supabase.from('schools').select('*')
    if (data) {
      setSchools(data)
      if (data.length > 0) {
        setSelectedSchool(data[0])
      }
    }
  }

  // Load levels and books when school changes
  useEffect(() => {
    if (selectedSchool) {
      loadLevelsAndBooks()
    }
  }, [selectedSchool])

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

  const handleBarcodeScanned = async (barcode: string) => {
    const book = books.find((b) => b.barcode === barcode)
    if (!book) {
      alert('الكتاب غير موجود')
      return
    }

    const remaining = book.total_quantity - book.sold_quantity
    if (remaining <= 0) {
      alert('الكتاب غير متوفر')
      return
    }

    // Add to sale items
    const existingItem = saleItems.find((item) => item.book_id === book.id)
    if (existingItem) {
      existingItem.quantity += 1
      existingItem.total_price = existingItem.quantity * existingItem.unit_price
      setSaleItems([...saleItems])
    } else {
      setSaleItems([
        ...saleItems,
        {
          id: Math.random().toString(),
          book_id: book.id,
          barcode: book.barcode,
          title: book.title,
          quantity: 1,
          unit_price: book.unit_price,
          total_price: book.unit_price,
        },
      ])
    }

    // Play sound
    playSound()
    setBarcodeInput('')
    if (barcodeInputRef.current) barcodeInputRef.current.focus()
  }

  const playSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const completeSale = async () => {
    if (saleItems.length === 0) return

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total_price, 0)
    const totalItems = saleItems.reduce((sum, item) => sum + item.quantity, 0)

    // Create transaction
    const { data: transaction } = await supabase
      .from('sales_transactions')
      .insert({
        school_id: selectedSchool!.id,
        total_amount: totalAmount,
        total_items: totalItems,
      })
      .select()
      .single()

    if (transaction) {
      // Add sale items
      for (const item of saleItems) {
        await supabase.from('sale_items').insert({
          transaction_id: transaction.id,
          book_id: item.book_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })

        // Update book sold quantity
        const book = books.find((b) => b.id === item.book_id)
        if (book) {
          await supabase
            .from('books')
            .update({ sold_quantity: book.sold_quantity + item.quantity })
            .eq('id', item.book_id)
        }
      }

      alert(`تم البيع بنجاح\nالإجمالي: ${totalAmount} ريال\nعدد الكتب: ${totalItems}`)
      setSaleItems([])
      loadLevelsAndBooks()
    }
  }

  const handleReturnBarcode = async (barcode: string) => {
    const book = books.find((b) => b.barcode === barcode)
    if (!book) {
      alert('الكتاب غير موجود')
      return
    }

    // Add return
    await supabase.from('returns_transactions').insert({
      school_id: selectedSchool!.id,
      book_id: book.id,
      quantity: 1,
    })

    // Update book sold quantity
    await supabase
      .from('books')
      .update({ sold_quantity: Math.max(0, book.sold_quantity - 1) })
      .eq('id', book.id)

    playSound()
    setBarcodeInput('')
    loadLevelsAndBooks()
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
        setShowCamera(true)
        scanBarcodes()
      }
    } catch (err) {
      console.error('خطأ في الكاميرة:', err)
    }
  }

  const scanBarcodes = () => {
    if (!cameraRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const interval = setInterval(() => {
      if (cameraRef.current && cameraRef.current.readyState === cameraRef.current.HAVE_ENOUGH_DATA) {
        canvas.width = cameraRef.current.videoWidth
        canvas.height = cameraRef.current.videoHeight
        ctx.drawImage(cameraRef.current, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        // Barcode detection would go here - for now use manual input
      }
    }, 100)

    return () => clearInterval(interval)
  }

  const stopCamera = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      const tracks = (cameraRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setShowCamera(false)
    }
  }

  const getTotalStats = () => {
    const totalBooks = books.reduce((sum, b) => sum + b.total_quantity, 0)
    const totalSold = books.reduce((sum, b) => sum + b.sold_quantity, 0)
    const totalRemaining = totalBooks - totalSold

    return { totalBooks, totalSold, totalRemaining }
  }

  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {selectedSchool && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{selectedSchool.name}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">المدير</p>
                <p className="font-semibold">{selectedSchool.director_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">المقتصد</p>
                <p className="font-semibold">{selectedSchool.accountant_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">مسؤول البيع</p>
                <p className="font-semibold">{selectedSchool.sales_manager_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">الوظيفة</p>
                <p className="font-semibold">{selectedSchool.sales_manager_role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary text-primary-foreground rounded-lg p-4">
            <p className="text-sm opacity-90">إجمالي الكتب</p>
            <p className="text-3xl font-bold">{stats.totalBooks}</p>
          </div>
          <div className="bg-accent text-accent-foreground rounded-lg p-4">
            <p className="text-sm opacity-90">المباع</p>
            <p className="text-3xl font-bold">{stats.totalSold}</p>
          </div>
          <div className="bg-secondary text-secondary-foreground rounded-lg p-4">
            <p className="text-sm opacity-90">المتبقي</p>
            <p className="text-3xl font-bold">{stats.totalRemaining}</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              view === 'dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}
          >
            لوحة التحكم
          </button>
          <button
            onClick={() => setView('sales')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              view === 'sales'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}
          >
            البيع
          </button>
          <button
            onClick={() => setView('returns')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              view === 'returns'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}
          >
            الاسترجاع
          </button>
        </div>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {levels.map((level) => {
              const levelBooks = books.filter((b) => b.level_id === level.id)
              const levelTotal = levelBooks.reduce((sum, b) => sum + b.total_quantity, 0)
              const levelSold = levelBooks.reduce((sum, b) => sum + b.sold_quantity, 0)

              return (
                <div key={level.id} className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-xl font-bold mb-4">{level.level_name}</h3>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">الإجمالي</p>
                      <p className="font-semibold">{levelTotal}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المباع</p>
                      <p className="font-semibold">{levelSold}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المتبقي</p>
                      <p className="font-semibold">{levelTotal - levelSold}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right p-2">الرقم</th>
                          <th className="text-right p-2">الرمز</th>
                          <th className="text-right p-2">العنوان</th>
                          <th className="text-right p-2">السعر</th>
                          <th className="text-right p-2">الكمية</th>
                          <th className="text-right p-2">المباع</th>
                          <th className="text-right p-2">المتبقي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelBooks.map((book, idx) => (
                          <tr key={book.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-2">{idx + 1}</td>
                            <td className="p-2 font-mono text-xs">{book.barcode}</td>
                            <td className="p-2">{book.title}</td>
                            <td className="p-2">{book.unit_price.toFixed(2)}</td>
                            <td className="p-2">{book.total_quantity}</td>
                            <td className="p-2 text-destructive font-semibold">{book.sold_quantity}</td>
                            <td className="p-2 text-green-600 font-semibold">
                              {book.total_quantity - book.sold_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sales View */}
        {view === 'sales' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">نقطة البيع</h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">ماسح الباركود</label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeScanned(barcodeInput)
                    }
                  }}
                  placeholder="أدخل رمز الكتاب أو استخدم الماسح"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  autoFocus
                />
              </div>

              <button
                onClick={startCamera}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold mb-4"
              >
                فتح الكاميرة
              </button>

              {showCamera && (
                <div className="mb-4 relative">
                  <video ref={cameraRef} autoPlay className="w-full rounded-lg" />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded"
                  >
                    إغلاق
                  </button>
                </div>
              )}

              {/* Sale Items */}
              {saleItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">الكتب المباعة</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {saleItems.map((item) => {
                      const book = books.find((b) => b.id === item.book_id)
                      return (
                        <div key={item.id} className="flex gap-3 bg-muted p-2 rounded">
                          {book?.image_url && (
                            <img src={book.image_url} alt={item.title} className="w-12 h-16 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.barcode}</p>
                            <p className="font-semibold">{item.quantity} × {item.unit_price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{item.total_price.toFixed(2)} ريال</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between mb-4">
                      <span className="font-bold">الإجمالي:</span>
                      <span className="text-2xl font-bold text-primary">
                        {saleItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)} ريال
                      </span>
                    </div>
                    <button
                      onClick={completeSale}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold text-lg"
                    >
                      تم الدفع
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Returns View */}
        {view === 'returns' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">استرجاع الكتب</h2>

            <label className="block text-sm font-semibold mb-2">ماسح الباركود</label>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleReturnBarcode(barcodeInput)
                }
              }}
              placeholder="أدخل رمز الكتاب المسترجع"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground mb-4"
              autoFocus
            />

            <button
              onClick={startCamera}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
            >
              فتح الكاميرة
            </button>

            {showCamera && (
              <div className="mt-4 relative">
                <video ref={cameraRef} autoPlay className="w-full rounded-lg" />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
