/**
 * Builds the single Gemini prompt for a lesson recording (plan Section 5).
 * One request per lesson: audio in, structured JSON out — no separate
 * transcription step, and the transcript itself is never produced as an
 * artifact.
 */
function buildLessonPrompt(classConfig) {
  var subjectFraming = classConfig.subject === 'is' ? IS_FRAMING : LANGLIT_FRAMING;

  return [
    'You are processing an audio recording of a single ' + classConfig.subjectEn + ' lesson',
    '(' + classConfig.grade + ', class "' + classConfig.name + '") for an IB MYP classroom.',
    'The recording may include a short segment of teacher commentary after the students have left.',
    '',
    'Return ONLY a single JSON object matching this exact schema. No preamble, no markdown code fences, no trailing commentary:',
    '',
    JSON.stringify({
      lesson_title: 'short, 3-8 words, suitable as a folder name',
      date_detected: 'YYYY-MM-DD or null',
      summary_en: {
        essential_question: '',
        key_terms: [{ term: '', definition: '' }],
        main_points: [''],
        examples_used: [''],
        tasks_assigned: [{ task: '', due: '' }]
      },
      summary_vi: {
        essential_question: '',
        key_terms: [{ term: '', definition: '' }],
        main_points: [''],
        examples_used: [''],
        tasks_assigned: [{ task: '', due: '' }]
      },
      teacher_notes: {
        what_worked: [''],
        what_to_change: [''],
        students_to_follow_up: ['']
      }
    }, null, 2),
    '',
    'Rules:',
    '- Split on the class ending. Audio recorded after students leave the room is teacher commentary and belongs only in teacher_notes — never let it reach summary_en or summary_vi.',
    '- Never include student names in summary_en or summary_vi. Names may appear only in teacher_notes. If a student is quoted or referenced in the parent-facing summary, describe them generically ("a student asked...").',
    '- summary_vi must be written for parents: respectful, plain Vietnamese. Spell out subject names in full — "' + classConfig.subjectVi + '", never abbreviated.',
    '- ' + subjectFraming,
    '- If the audio is unintelligible, silent, or too short to summarize, return {"error": "reason"} instead of inventing content.'
  ].join('\n');
}

var LANGLIT_FRAMING = 'This is a Language and Literature class: key_terms should skew to literary and rhetorical devices, and main_points should capture textual evidence and interpretive moves the class made.';

var IS_FRAMING = 'This is an Individuals and Societies class: key_terms should skew to concepts, events, and actors, and main_points should capture causation, chronology, and competing perspectives discussed.';
