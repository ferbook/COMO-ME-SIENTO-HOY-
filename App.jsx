import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const EMOTIONS = [
  { name: "Feliz", color: "bg-yellow-300" },
  { name: "Triste", color: "bg-blue-300" },
  { name: "Ansioso", color: "bg-red-300" },
  { name: "Relajado", color: "bg-green-300" },
  { name: "Enojado", color: "bg-orange-400" },
  { name: "Irritado", color: "bg-pink-400" },
  { name: "Esperanzado", color: "bg-indigo-300" },
  { name: "Desesperado", color: "bg-gray-400" },
  { name: "Motivado", color: "bg-teal-300" },
  { name: "Apático", color: "bg-purple-300" },
];

// Helper para agrupar por fecha ISO yyyy-mm-dd
const groupByDate = (arr) =>
  arr.reduce((acc, item) => {
    const date = new Date(item.date).toISOString().split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

const LANGS = {
  es: {
    title: "Mi Diario Emocional",
    placeholder: "Escribe cómo te sientes...",
    saveText: "Guardar texto",
    exportPdf: "Exportar a PDF",
    noEntries: "No hay entradas aún.",
    emotions: "Emociones",
    texts: "Textos",
    edit: "Editar",
    delete: "Eliminar",
    filter: "Filtrar por fecha",
    selectLang: "Idioma",
    darkMode: "Modo oscuro",
    alertDuplicateEmotion:
      "Ya registraste esta emoción hace menos de 30 segundos.",
    alertEmotionSaved: "Emoción registrada.",
    alertTextSaved: "Texto guardado.",
  },
  en: {
    title: "My Emotional Diary",
    placeholder: "Write how you feel...",
    saveText: "Save Text",
    exportPdf: "Export to PDF",
    noEntries: "No entries yet.",
    emotions: "Emotions",
    texts: "Texts",
    edit: "Edit",
    delete: "Delete",
    filter: "Filter by Date",
    selectLang: "Language",
    darkMode: "Dark Mode",
    alertDuplicateEmotion: "You already registered this emotion less than 30 seconds ago.",
    alertEmotionSaved: "Emotion registered.",
    alertTextSaved: "Text saved.",
  },
};

function App() {
  // Estados principales
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [textEntries, setTextEntries] = useState([]);
  const [text, setText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editingEntry, setEditingEntry] = useState(null); // {id, type, value}
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState("es");

  const t = LANGS[lang];

  // Cargar datos de localStorage al iniciar
  useEffect(() => {
    const savedEmotions = localStorage.getItem("emotions");
    const savedTexts = localStorage.getItem("texts");
    const savedDark = localStorage.getItem("darkMode");
    const savedLang = localStorage.getItem("lang");
    if (savedEmotions) setSelectedEmotions(JSON.parse(savedEmotions));
    if (savedTexts) setTextEntries(JSON.parse(savedTexts));
    if (savedDark) setDarkMode(savedDark === "true");
    if (savedLang) setLang(savedLang);
  }, []);

  // Guardar en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem("emotions", JSON.stringify(selectedEmotions));
  }, [selectedEmotions]);
  useEffect(() => {
    localStorage.setItem("texts", JSON.stringify(textEntries));
  }, [textEntries]);
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Recordatorio diario con notificación (si permisos ok)
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      const now = new Date();
      // Calcular ms para las 20:00 (8pm)
      const reminderTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        20,
        0,
        0
      );
      if (now > reminderTime) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      const msUntilReminder = reminderTime - now;
      const timeoutId = setTimeout(() => {
        new Notification(t.title, {
          body: t.placeholder,
          icon: "https://cdn-icons-png.flaticon.com/512/1250/1250688.png",
        });
      }, msUntilReminder);
      return () => clearTimeout(timeoutId);
    }
  }, [t]);

  // Añadir emoción (con bloqueo 30s)
  const handleEmotionClick = (emotion) => {
    const now = Date.now();
    const lastSame = [...selectedEmotions]
      .reverse()
      .find((e) => e.emotion.name === emotion.name && now - new Date(e.date).getTime() < 30000);
    if (lastSame) {
      alert(t.alertDuplicateEmotion);
      return;
    }
    setSelectedEmotions((prev) => [
      ...prev,
      { id: `${now}-${Math.random()}`, emotion, date: new Date() },
    ]);
    alert(t.alertEmotionSaved);
  };

  // Guardar texto nuevo o editar
  const handleSaveText = () => {
    if (!text.trim()) return;
    if (editingEntry && editingEntry.type === "text") {
      // Editar texto
      setTextEntries((prev) =>
        prev.map((tEntry) =>
          tEntry.id === editingEntry.id ? { ...tEntry, text: text.trim() } : tEntry
        )
      );
      setEditingEntry(null);
    } else {
      // Nuevo texto
      const now = Date.now();
      setTextEntries((prev) => [
        ...prev,
        { id: `${now}-${Math.random()}`, text: text.trim(), date: new Date() },
      ]);
    }
    setText("");
    alert(t.alertTextSaved);
  };

  // Editar emoción
  const startEdit = (entry, type) => {
    setEditingEntry({ id: entry.id, type, value: type === "emotion" ? entry.emotion.name : entry.text });
    setText(type === "text" ? entry.text : entry.emotion.name);
  };

  // Guardar edición de emoción (solo texto editable, para emoción no se cambia nombre, solo texto para poder cambiar texto por otro)
  const saveEditEmotion = (id, newName) => {
    // Para esta app no editamos emoción directamente, solo permitimos eliminar
  };

  // Eliminar emoción o texto
  const handleDelete = (id, type) => {
    if (type === "emotion") {
      setSelectedEmotions((prev) => prev.filter((e) => e.id !== id));
    } else {
      setTextEntries((prev) => prev.filter((t) => t.id !== id));
    }
    if (editingEntry && editingEntry.id === id) setEditingEntry(null);
  };

  // Exportar a PDF con agrupado y formateado
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t.title, 10, 10);

    // Combinar y filtrar si hay filtro de fecha
    let combined = [...selectedEmotions, ...textEntries];
    if (filterDate) {
      combined = combined.filter((item) => {
        const itemDate = new Date(item.date).toISOString().split("T")[0];
        return itemDate === filterDate;
      });
    }
    const grouped = groupByDate(combined);

    let y = 20;
    Object.entries(grouped).forEach(([date, items]) => {
      doc.setFontSize(14);
      doc.text(date, 10, y);
      y += 8;

      items.forEach((item) => {
        doc.setFontSize(12);
        if (item.emotion) {
          doc.text(`Emoción: ${item.emotion.name} (${new Date(item.date).toLocaleTimeString()})`, 12, y);
        } else if (item.text) {
          const textStr = `"${item.text}" (${new Date(item.date).toLocaleTimeString()})`;
          const splitText = doc.splitTextToSize(textStr, 180);
          doc.text(splitText, 12, y);
          y += splitText.length * 6 - 6;
        }
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("diario-emocional.pdf");
  };

  // Filtrar entradas según filterDate
  const filteredEmotions = filterDate
    ? selectedEmotions.filter((e) => new Date(e.date).toISOString().split("T")[0] === filterDate)
    : selectedEmotions;

  const filteredTexts = filterDate
    ? textEntries.filter((t) => new Date(t.date).toISOString().split("T")[0] === filterDate)
    : textEntries;

  // Estadísticas básicas de emociones (conteo)
  const emotionCounts = EMOTIONS.map(({ name }) => ({
    name,
    count: selectedEmotions.filter((e) => e.emotion.name === name).length,
  }));

  return (
    <div className={darkMode ? "bg-gray-900 text-white min-h-screen p-6 font-sans max-w-3xl mx-auto" : "bg-white text-gray-900 min-h-screen p-6 font-sans max-w-3xl mx-auto"}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <div className="flex gap-4 items-center">
          <label htmlFor="lang-select" className="font-semibold">{t.selectLang}:</label>
          <select
            id="lang-select"
            className="rounded px-2 py-1 border"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>

          <label htmlFor="dark-toggle" className="flex items-center cursor-pointer select-none">
            <input
              id="dark-toggle"
              type="checkbox"
              className="mr-1"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
            {t.darkMode}
          </label>
        </div>
      </header>

      {/* Emociones */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t.emotions}</h2>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((emotion, idx) => (
            <button
              key={idx}
              aria-label={`${t.emotions} ${emotion.name}`}
              className={`py-2 px-4 rounded-xl font-semibold shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white ${emotion.color}`}
              onClick={() => handleEmotionClick(emotion)}
            >
              {emotion.name}
            </button>
          ))}
        </div>
      </section>

      {/* Entrada texto + botones */}
      <section className="mb-6">
        <textarea
          className="w-full p-4 rounded border resize-y mb-2 bg-transparent text-inherit"
          rows="4"
          placeholder={t.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={t.placeholder}
        ></textarea>
        <div className="flex gap-4">
          <button
            onClick={handleSaveText}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
            disabled={!text.trim()}
          >
            {editingEntry ? t.edit : t.saveText}
          </button>
          <button
            onClick={exportToPDF}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            {t.exportPdf}
          </button>
          {editingEntry && (
            <button
              onClick={() => {
                setEditingEntry(null);
                setText("");
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded shadow"
            >
