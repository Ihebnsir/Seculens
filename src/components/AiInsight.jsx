// Découpe un texte "1. ... 2. ... 3. ..." en étapes, que Gemini les mette sur des lignes séparées ou non.
// Les numéros doivent se suivre (1, 2, 3...) : un "2." isolé dans une phrase ne crée pas de fausse liste.
// Renvoie { intro, steps } ; steps est vide si le texte ne contient pas au moins 2 étapes numérotées.
export function splitNumberedSteps(text) {
  const markerPattern = /(^|\s)(\d{1,2})\.\s+/g;
  const markers = [];
  let expectedNumber = 1;
  let match;

  while ((match = markerPattern.exec(text)) !== null) {
    if (Number(match[2]) === expectedNumber) {
      markers.push({ start: match.index + match[1].length, contentStart: match.index + match[0].length });
      expectedNumber += 1;
    }
  }

  if (markers.length < 2) {
    return { intro: text, steps: [] };
  }

  const steps = markers.map((marker, index) => {
    const end = index + 1 < markers.length ? markers[index + 1].start : text.length;
    return text.slice(marker.contentStart, end).trim();
  }).filter(Boolean);

  return { intro: text.slice(0, markers[0].start).trim(), steps };
}

function FixSteps({ text }) {
  const { intro, steps } = splitNumberedSteps(text);

  if (!steps.length) {
    return <p className="ai-insight-text">{text}</p>;
  }

  return (
    <>
      {intro && <p className="ai-insight-text">{intro}</p>}
      <ol className="ai-insight-steps">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </>
  );
}

// Explication générée par l'IA. Rien n'est affiché si l'IA n'a pas répondu (tous les champs à null) :
// un échec de l'IA ne doit pas inquiéter l'utilisateur, les données du scanner restent complètes.
function AiInsight({ explanation }) {
  const simpleExplanation = explanation?.simpleExplanation;
  const realWorldRisk = explanation?.realWorldRisk;
  const fixSteps = explanation?.fixSteps;

  if (!simpleExplanation && !realWorldRisk && !fixSteps) {
    return null;
  }

  return (
    <section className="ai-insight" aria-label="AI Insight">
      <p className="ai-insight-title">
        <span className="ai-badge">AI</span>
        AI Insight
      </p>

      {simpleExplanation && <p className="ai-insight-text">{simpleExplanation}</p>}

      {realWorldRisk && (
        <div className="ai-insight-block">
          <p className="ai-insight-label">Real-world risk</p>
          <p className="ai-insight-text">{realWorldRisk}</p>
        </div>
      )}

      {fixSteps && (
        <div className="ai-insight-block">
          <p className="ai-insight-label">How to fix it</p>
          <FixSteps text={fixSteps} />
        </div>
      )}
    </section>
  );
}

export default AiInsight;
