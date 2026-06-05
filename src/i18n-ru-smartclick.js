/**
 * Step 80 — Russian localization strings for smart-click features.
 *
 * Extends the existing i18n.js with Phase 3-4 keys.
 * Keys follow the existing naming convention in i18n.js.
 */

'use strict';

const RU_SMART_CLICK = {
  // Safety gate
  'safety.gate.title': 'Безопасность',
  'safety.gate.review_required': 'Требуется подтверждение обзора',
  'safety.gate.consent_required': 'Требуется явное согласие',
  'safety.gate.consent_expires_in': 'Согласие истекает через {0} с',
  'safety.gate.rate_limit_ok': 'Лимит действий в норме',
  'safety.gate.rate_limit_exceeded': 'Превышен лимит действий',
  'safety.gate.emergency_stop': 'Аварийная остановка',
  'safety.gate.all_clear': 'Все проверки пройдены',

  // Real click
  'click.image.title': 'Клик по шаблону',
  'click.image.template_label': 'Шаблон',
  'click.text.title': 'Клик по тексту',
  'click.text.query_label': 'Текст для поиска',
  'click.text.case_sensitive': 'Учитывать регистр',
  'click.dispatched': 'Действие выполнено',
  'click.blocked': 'Действие заблокировано',
  'click.error': 'Ошибка выполнения',

  // Emergency stop button
  'emergency_stop.button': 'Аварийная остановка',
  'emergency_stop.confirm': 'Вы уверены, что хотите остановить все действия?',
  'emergency_stop.active': 'Аварийная остановка активна',

  // Consent dialog
  'consent.title': 'Подтвердите действие',
  'consent.description': 'Приложение собирается выполнить реальное нажатие. Подтвердите, чтобы разрешить.',
  'consent.confirm': 'Разрешить',
  'consent.cancel': 'Отмена',
  'consent.ttl_seconds': 'Согласие действительно {0} с',
};

if (typeof module !== 'undefined') module.exports = { RU_SMART_CLICK };
