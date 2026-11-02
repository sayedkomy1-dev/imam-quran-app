// ============================================================================
// Automated Verification Suite: tests/pedagogical-advisor-check.ts
// يتحقق من عمل الاختبار التربوي، وتوليد التوصيات للمحفظ، وقوالب نصائح الوالدين، والحفاظ على المعمارية
// ============================================================================

import assert from 'node:assert/strict';
import {
  PEDAGOGICAL_SCREENING_QUESTIONS,
  CHALLENGE_METADATA,
  evaluatePedagogicalScreening,
  READING_FOUNDATION_STRATEGIES,
  KIDS_TAJWEED_SIMPLIFIED,
  SMART_FAMILY_GUIDANCE_TEMPLATES,
  generateRecommendedFamilyGuidance,
  getRepeatedErrorsPedagogicalTips,
} from '../src/data/pedagogicalAdvisorData.ts';

console.log('🧪 Running Pedagogical Advisor Verification Suite (أكاديمية الإمام)...');

// 1. Verify Pedagogical Screening Questions (8 interactive questions) & Options
assert.ok(
  Array.isArray(PEDAGOGICAL_SCREENING_QUESTIONS) &&
    PEDAGOGICAL_SCREENING_QUESTIONS.length >= 6 &&
    PEDAGOGICAL_SCREENING_QUESTIONS.length <= 10,
  'Expected 6 to 10 interactive observation screening questions'
);
console.log(`  ✅ 1. Pedagogical Screening Questions count (${PEDAGOGICAL_SCREENING_QUESTIONS.length}) verified.`);

// 2. Test Pedagogical Screening Evaluation Engine
const mockAnswersVisual = {
  q1_modality: 'q1_visual',
  q5_reading_foundation: 'q5_letter_by_letter',
};
const evalResult = evaluatePedagogicalScreening(mockAnswersVisual, 'طالب تجريبي');
assert.ok(evalResult, 'Expected valid evaluation result');
assert.equal(evalResult.learningStyle, 'بصري');
assert.ok(evalResult.primaryChallengeKey, 'Expected primary challenge');
assert.ok(evalResult.suggestedTrack, 'Expected suggested track');
console.log('  ✅ 2. Pedagogical Screening Evaluation Engine verified.');

// 3. Verify Reading Foundation Strategies & Kids Tajweed Simplified
assert.ok(
  Array.isArray(READING_FOUNDATION_STRATEGIES) && READING_FOUNDATION_STRATEGIES.length >= 4,
  'Expected at least 4 foundation strategy steps'
);
assert.ok(
  Array.isArray(KIDS_TAJWEED_SIMPLIFIED) && KIDS_TAJWEED_SIMPLIFIED.length >= 4,
  'Expected at least 4 simplified tajweed rules for kids'
);
console.log('  ✅ 3. Reading Foundation Strategies and Kids Tajweed Rules verified.');

// 4. Verify Smart Family Guidance Generation (WhatsApp & Guardian Portal)
assert.ok(
  Array.isArray(SMART_FAMILY_GUIDANCE_TEMPLATES) && SMART_FAMILY_GUIDANCE_TEMPLATES.length >= 3,
  'Expected at least 3 smart family guidance templates'
);

const guidanceResult = generateRecommendedFamilyGuidance({
  student: {
    id: 'test-1',
    name: 'عمر الفاروق',
    guardianName: 'أبو عمر',
    whatsappPhone: '201012345678',
    guardianPin: '123456',
    level: 'مبتدئ',
    circle: 'حلقة النور',
    plan: 'متوازنة',
    linkLogic: 'الآية التالية',
    scheduleDays: [0, 2],
    scheduleTime: '16:00',
    sessionDuration: 30,
    startDate: '2026-01-01',
    notes: '',
    memorizedSurahs: [],
    inProgressSurahs: [],
    memorizedJuz: [],
    currentStop: { surahId: 78, surahName: 'النبأ', ayah: 1, juzNumber: 30 },
    monthlyFee: 150,
    fees: [],
    disciplineWarnings: [],
  },
  errors: [
    {
      id: 'err-1',
      type: 'تشكيل',
      context: 'الحفظ الجديد',
      word: 'عَمَّ',
      ayah: 1,
      timestamp: new Date().toISOString(),
    },
  ],
  surahName: 'النبأ',
});

assert.ok(guidanceResult.generatedText.includes('عمر الفاروق'), 'Expected student name in guidance text');
assert.ok(guidanceResult.generatedText.length > 30, 'Expected detailed guidance text');
console.log('  ✅ 4. Smart Family Guidance Generator (WhatsApp & Guardian Portal) verified.');

// 5. Verify Repeated Errors Coaching Tips
const coachingTips = getRepeatedErrorsPedagogicalTips([
  {
    id: 'err-2',
    type: 'تجويد',
    context: 'الحفظ الجديد',
    subType: 'غنة النون المشددة',
    word: 'عَمَّ',
    ayah: 1,
    timestamp: new Date().toISOString(),
  },
]);
assert.ok(coachingTips.length >= 1, 'Expected coaching tips for repeated errors');
console.log('  ✅ 5. Repeated Error Pedagogical Coaching Tips verified.');

console.log('🎉 ALL PEDAGOGICAL ADVISOR & EDUCATIONAL CHECKS PASSED SUCCESSFULLY!');
