// ============================================================
// QUESTIONS — Insight quiz after 3 rounds for RoboVault
// ============================================================

import { ATTRIBUTES, ATTR_KEYS } from './config.js';

/**
 * Generate 3 quiz questions based on the true market model.
 * @param {Market} market - The market instance with true segment data
 * @returns {Array} Array of question objects
 */
export function generateQuizQuestions(market) {
  const segments = market.segments;

  return [
    makeSegmentCountQuestion(segments),
    makeTopAttributeQuestion(segments),
    makePriceSensitiveQuestion(segments),
  ];
}

/**
 * Grade quiz answers. Returns { score, maxScore, details }.
 */
export function gradeQuiz(questions, answers) {
  let score = 0;
  const maxScore = questions.length;
  const details = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers[i];
    const correct = a === q.correctIndex;
    if (correct) score++;
    details.push({
      question: q.text,
      playerAnswer: q.options[a],
      correctAnswer: q.options[q.correctIndex],
      correct,
      explanation: q.explanation,
    });
  }

  return { score, maxScore, details };
}

// ---- Question generators ----

function makeSegmentCountQuestion(segments) {
  const correct = segments.length;
  const options = [2, 3, 4, 5];
  // Ensure correct answer is in options
  if (!options.includes(correct)) {
    options[options.length - 1] = correct;
  }
  options.sort((a, b) => a - b);
  const correctIndex = options.indexOf(correct);

  return {
    text: 'How many distinct consumer segments existed in this market?',
    options: options.map(n => `${n} segments`),
    correctIndex,
    explanation: `The market had ${correct} segments: ${segments.map(s => s.name).join(', ')}.`,
    points: 1,
  };
}

function makeTopAttributeQuestion(segments) {
  // Find which attribute has the highest variance in preferences across segments
  // (i.e., matters most for differentiation)
  const attrImportance = {};
  for (const attr of ATTR_KEYS) {
    let totalRange = 0;
    for (const seg of segments) {
      const vals = ATTRIBUTES[attr].options.map(opt => seg.partWorths[attr][opt] || 0);
      totalRange += Math.max(...vals) - Math.min(...vals);
    }
    attrImportance[attr] = totalRange / segments.length;
  }

  // Sort by importance
  const sorted = ATTR_KEYS.sort((a, b) => attrImportance[b] - attrImportance[a]);
  const correct = sorted[0];
  const correctIndex = ATTR_KEYS.indexOf(correct);

  return {
    text: 'Which product attribute had the strongest influence on purchase decisions across all segments?',
    options: ATTR_KEYS.map(a => ATTRIBUTES[a].label),
    correctIndex,
    explanation: `${ATTRIBUTES[correct].label} showed the widest range of preferences across segments, making it the most influential attribute for product differentiation.`,
    points: 1,
  };
}

function makePriceSensitiveQuestion(segments) {
  // Find most price-sensitive segment
  let mostSensitive = segments[0];
  for (const seg of segments) {
    if (seg.priceCoeff < mostSensitive.priceCoeff) {
      mostSensitive = seg;
    }
  }

  const options = segments.map(s => s.name);
  const correctIndex = segments.indexOf(mostSensitive);

  // If fewer than 4 options, pad with dummy
  while (options.length < 4) {
    options.push('None of the above');
  }

  return {
    text: 'Which consumer segment was the most price-sensitive?',
    options,
    correctIndex,
    explanation: `${mostSensitive.name} had the strongest negative price coefficient (${mostSensitive.priceCoeff.toFixed(5)}), meaning price increases caused the largest drop in their purchase probability.`,
    points: 1,
  };
}
