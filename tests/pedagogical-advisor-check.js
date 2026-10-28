// ============================================================================
// Automated Verification Suite: tests/pedagogical-advisor-check.js
// يتحقق من عمل الاختبار التربوي، وتوليد التوصيات للمحفظ، وقوالب نصائح الوالدين، والحفاظ على Schema = 12
// ============================================================================

import assert from 'node:assert/strict';
import {
  LOCAL_SCHEMA_VERSION,
  PEDAGOGICAL_SCREENING_QUESTIONS,
  SMART_TEACHER_GUIDE,
  evaluatePedagogicalAssessment,
  generateParentGuidanceMessage,
  getErrorCoachingTip,
} from '../js/features/pedagogical-advisor.js';

console.log('🧪 Running Pedagogical Advisor Verification Suite (أكاديمية الإمام)...');

// 1. Verify Schema = 12 Preservation
assert.equal(
  LOCAL_SCHEMA_VERSION,
  12,
  'Expected Local Schema Version to remain strictly 12'
);
console.log('  ✅ 1. Local Schema = 12 preserved.');

// 2. Verify Pedagogical Screening Questions (6-8 questions) & Evaluation Engine
assert.ok(
  PEDAGOGICAL_SCREENING_QUESTIONS.length >= 6 &&
    PEDAGOGICAL_SCREENING_QUESTIONS.length <= 8,
  'Expected 6 to 8 interactive observation screening questions'
);

const foundationResult = evaluatePedagogicalAssessment({
  q1_modality: 'q1_visual',
  q5_reading_foundation: 'q5_letter_by_letter',
});
assert.equal(foundationResult.learningStyle, 'بصري');
assert.equal(foundationResult.primaryChallengeKey, 'weak_reading_foundation');
assert.equal(foundationResult.suggestedTrack, 'تأسيس قرائي');

const hyperactiveResult = evaluatePedagogicalAssessment({
  q1_modality: 'q1_kinesthetic',
  q3_attention: 'q3_hyperactive',
});
assert.equal(hyperactiveResult.learningStyle, 'حركي/تفاعلي');
assert.equal(hyperactiveResult.primaryChallengeKey, 'attention_hyperactivity');
assert.equal(hyperactiveResult.suggestedTrack, 'تحفيظ بجرعات صغيرة');

console.log('  ✅ 2. Pedagogical Screening & Learning Style Diagnosis verified.');

// 3. Verify Smart Teacher Guide (4 Tracks + Error Coaching Badges)
assert.equal(SMART_TEACHER_GUIDE.readingFoundation.length, 6);
assert.equal(SMART_TEACHER_GUIDE.kidsTajweed.length, 4);
assert.ok(getErrorCoachingTip('تجويد').includes('نصيحة تربوية'));
assert.ok(getErrorCoachingTip('تردد').includes('نصيحة تربوية'));
assert.ok(getErrorCoachingTip('نطق').includes('نصيحة تربوية'));
console.log('  ✅ 3. Smart Teacher Guide & Error Coaching Badges verified.');

// 4. Verify Parent Guidance Generator (Concise 3-4 lines, supportive templates)
const sleepTip = generateParentGuidanceMessage({
  studentName: 'عمر',
  surahName: 'النبأ',
  templateType: 'sleep_listening',
});
const lines = sleepTip.trim().split('\n');
assert.ok(lines.length <= 4, 'Parent guidance tip must be concise (max 4 lines)');
assert.ok(sleepTip.includes('عمر') && sleepTip.includes('النبأ'));

const hesitantTip = generateParentGuidanceMessage({
  studentName: 'سلمى',
  surahName: 'الملك',
  templateType: 'encourage_hesitant',
});
assert.ok(hesitantTip.includes('سلمى') && hesitantTip.includes('تشجيع'));
console.log('  ✅ 4. Smart Parent Guidance Generator (WhatsApp & Guardian Portal) verified.');

console.log('🎉 ALL PEDAGOGICAL ADVISOR CHECKS PASSED SUCCESSFULLY!');
