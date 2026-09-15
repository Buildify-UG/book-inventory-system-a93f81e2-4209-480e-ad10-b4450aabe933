import { useState, useEffect } from 'react'
import { supabase, type School, type Level } from '../lib/supabase'

export default function Settings() {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [showSchoolForm, setShowSchoolForm] = useState(false)
  const [showLevelForm, setShowLevelForm] = useState(false)
  const [schoolFormData, setSchoolFormData] = useState({
    name: '',
    director_name: '',
    accountant_name: '',
    sales_manager_name: '',
    sales_manager_role: '',
  })
  const [levelFormData, setLevelFormData] = useState({
    level_name: '',
  })

  useEffect(() => {
    loadSchools()
  }, [])

  useEffect(() => {
    if (selectedSchool) {
      loadLevels()
    }
  }, [selectedSchool])

  const loadSchools = async () => {
    const { data } = await supabase.from('schools').select('*')
    if (data) {
      setSchools(data)
      if (data.length > 0) setSelectedSchool(data[0])
    }
  }

  const loadLevels = async () => {
    if (!selectedSchool) return
    const { data } = await supabase
      .from('levels')
      .select('*')
      .eq('school_id', selectedSchool.id)

    if (data) {
      setLevels(data)
    }
  }

  const handleSaveSchool = async () => {
    if (!schoolFormData.name || !schoolFormData.director_name) {
      alert('يرجى ملء البيانات المطلوبة')
      return
    }

    try {
      await supabase.from('schools').insert({
        name: schoolFormData.name,
        director_name: schoolFormData.director_name,
        accountant_name: schoolFormData.accountant_name,
        sales_manager_name: schoolFormData.sales_manager_name,
        sales_manager_role: schoolFormData.sales_manager_role,
      })

      alert('تم إضافة المدرسة بنجاح')
      setSchoolFormData({
        name: '',
        director_name: '',
        accountant_name: '',
        sales_manager_name: '',
        sales_manager_role: '',
      })
      setShowSchoolForm(false)
      loadSchools()
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    }
  }

  const handleSaveLevel = async () => {
    if (!levelFormData.level_name || !selectedSchool) {
      alert('يرجى ملء البيانات المطلوبة')
      return
    }

    try {
      await supabase.from('levels').insert({
        school_id: selectedSchool.id,
        level_name: levelFormData.level_name,
      })

      alert('تم إضافة المستوى بنجاح')
      setLevelFormData({ level_name: '' })
      setShowLevelForm(false)
      loadLevels()
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    }
  }

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('هل تريد حذف هذا المستوى؟')) return

    try {
      await supabase.from('levels').delete().eq('id', levelId)
      alert('تم حذف المستوى بنجاح')
      loadLevels()
    } catch (error) {
      alert('خطأ: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">الإعدادات</h1>

        {/* Schools Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">المدارس</h2>
            <button
              onClick={() => setShowSchoolForm(!showSchoolForm)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
            >
              + إضافة مدرسة
            </button>
          </div>

          {showSchoolForm && (
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="اسم المدرسة"
                  value={schoolFormData.name}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="text"
                  placeholder="اسم المدير"
                  value={schoolFormData.director_name}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, director_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="text"
                  placeholder="اسم المقتصد"
                  value={schoolFormData.accountant_name}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, accountant_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="text"
                  placeholder="اسم مسؤول البيع"
                  value={schoolFormData.sales_manager_name}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, sales_manager_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="text"
                  placeholder="وظيفة مسؤول البيع"
                  value={schoolFormData.sales_manager_role}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, sales_manager_role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveSchool}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setShowSchoolForm(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground border border-border rounded-lg font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {schools.map((school) => (
              <div
                key={school.id}
                onClick={() => setSelectedSchool(school)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedSchool?.id === school.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border hover:bg-muted/80'
                }`}
              >
                <h3 className="font-bold">{school.name}</h3>
                <p className="text-sm opacity-75">المدير: {school.director_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Levels Section */}
        {selectedSchool && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">المستويات - {selectedSchool.name}</h2>
              <button
                onClick={() => setShowLevelForm(!showLevelForm)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                + إضافة مستوى
              </button>
            </div>

            {showLevelForm && (
              <div className="bg-muted p-4 rounded-lg mb-4">
                <input
                  type="text"
                  placeholder="اسم المستوى (مثال: الصف الأول)"
                  value={levelFormData.level_name}
                  onChange={(e) => setLevelFormData({ level_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mb-3"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLevel}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setShowLevelForm(false)}
                    className="flex-1 px-4 py-2 bg-muted text-foreground border border-border rounded-lg font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {levels.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">لا توجد مستويات</p>
            ) : (
              <div className="space-y-2">
                {levels.map((level) => (
                  <div key={level.id} className="flex justify-between items-center p-4 bg-muted rounded-lg border border-border">
                    <h3 className="font-semibold">{level.level_name}</h3>
                    <button
                      onClick={() => handleDeleteLevel(level.id)}
                      className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm font-semibold"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
