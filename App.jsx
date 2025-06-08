
import React, { useState } from "react";
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

function App() {
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [textEntries, setTextEntries] = useState([]);
  const [text, setText] = useState("");

  const groupByDate = (arr) => {
    return arr.reduce((acc, item) => {
      const date = new Date(item.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  const handleEmotionClick = (emotion) => {
    setSelectedEmotions((prev) => [...prev, { emotion, date: new Date() }]);
  };

  const handleSaveText = () => {
    if (text.trim()) {
      setTextEntries((prev) => [...prev, { text, date: new Date() }]);
      setText("");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Resumen emocional por día", 10, 10);
    const grouped = groupByDate([...selectedEmotions, ...textEntries]);

    Object.entries(grouped).forEach(([date, items], idx) => {
      doc.text(date, 10, 20 + idx * 10);
    });

    const emotionRows = selectedEmotions.map((e) => [e.emotion.name, new Date(e.date).toLocaleString()]);
    const textRows = textEntries.map((t) => [t.text, new Date(t.date).toLocaleString()]);
    doc.autoTable({ head: [["Emoción", "Fecha"]], body: emotionRows });
    doc.autoTable({ head: [["Texto", "Fecha"]], body: textRows });
    doc.save("diario-emocional.pdf");
  };

  const groupedEmotions = groupByDate(selectedEmotions);
  const groupedTexts = groupByDate(textEntries);

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Mi Diario Emocional</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        {EMOTIONS.map((emotion, idx) => (
          <button key={idx} className={`py-2 px-4 rounded-xl text-white font-semibold shadow ${emotion.color}`} onClick={() => handleEmotionClick(emotion)}>
            {emotion.name}
          </button>
        ))}
      </div>
      <textarea className="w-full p-4 rounded border mb-4" rows="4" placeholder="Escribe cómo te sientes..." value={text} onChange={(e) => setText(e.target.value)}></textarea>
      <div className="flex gap-4 mb-6">
        <button onClick={handleSaveText} className="bg-blue-500 text-white px-4 py-2 rounded shadow">Guardar texto</button>
        <button onClick={exportToPDF} className="bg-green-500 text-white px-4 py-2 rounded shadow">Exportar a PDF</button>
      </div>

      <h2 className="text-xl font-bold mb-2">Resumen diario</h2>
      {Object.keys(groupedEmotions).map((date) => (
        <div key={date} className="mb-6 border rounded p-4">
          <h3 className="font-semibold mb-2">{date}</h3>
          <ul className="mb-2">
            {groupedEmotions[date].map((e, idx) => (
              <li key={idx}>{e.emotion.name} – {new Date(e.date).toLocaleTimeString()}</li>
            ))}
          </ul>
          <ul>
            {groupedTexts[date]?.map((t, idx) => (
              <li key={idx}>"{t.text}" – <span className="text-sm text-gray-600">{new Date(t.date).toLocaleTimeString()}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default App;
