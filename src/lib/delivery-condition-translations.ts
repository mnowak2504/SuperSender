/**
 * Translations for delivery condition messages
 * Used when generating notes for damaged packages
 */

import { Language } from './i18n'

export interface ConditionTranslation {
  label: string
  notice: string
}

const translations: Record<Language, Record<string, ConditionTranslation>> = {
  pl: {
    MINOR_DAMAGE: {
      label: 'Uszkodzenie opakowania nie zagrażające zawartości',
      notice: 'UWAGA: Przedstawiciel handlowy wyśle zdjęcia uszkodzenia w ciągu 24h do potwierdzenia jaka powinna być dalsza akcja.',
    },
    MODERATE_DAMAGE: {
      label: 'Poważniejsze uszkodzenie opakowania - zawartość do weryfikacji',
      notice: 'UWAGA: Przedstawiciel handlowy wyśle zdjęcia uszkodzenia w ciągu 24h do potwierdzenia jaka powinna być dalsza akcja.',
    },
    SEVERE_DAMAGE: {
      label: 'Poważne uszkodzenie',
      notice: 'UWAGA: Przedstawiciel handlowy wyśle zdjęcia uszkodzenia w ciągu 24h do potwierdzenia jaka powinna być dalsza akcja.',
    },
  },
  en: {
    MINOR_DAMAGE: {
      label: 'Packaging damage not affecting contents',
      notice: 'NOTICE: Sales representative will send damage photos within 24h for confirmation of further action.',
    },
    MODERATE_DAMAGE: {
      label: 'More serious packaging damage - contents need verification',
      notice: 'NOTICE: Sales representative will send damage photos within 24h for confirmation of further action.',
    },
    SEVERE_DAMAGE: {
      label: 'Severe damage',
      notice: 'NOTICE: Sales representative will send damage photos within 24h for confirmation of further action.',
    },
  },
  de: {
    MINOR_DAMAGE: {
      label: 'Verpackungsschaden, der den Inhalt nicht beeinträchtigt',
      notice: 'HINWEIS: Der Vertriebsmitarbeiter sendet Schadensfotos innerhalb von 24 Stunden zur Bestätigung des weiteren Vorgehens.',
    },
    MODERATE_DAMAGE: {
      label: 'Ernsterer Verpackungsschaden - Inhalt muss überprüft werden',
      notice: 'HINWEIS: Der Vertriebsmitarbeiter sendet Schadensfotos innerhalb von 24 Stunden zur Bestätigung des weiteren Vorgehens.',
    },
    SEVERE_DAMAGE: {
      label: 'Schwerer Schaden',
      notice: 'HINWEIS: Der Vertriebsmitarbeiter sendet Schadensfotos innerhalb von 24 Stunden zur Bestätigung des weiteren Vorgehens.',
    },
  },
  fr: {
    MINOR_DAMAGE: {
      label: 'Dommage à l\'emballage n\'affectant pas le contenu',
      notice: 'AVIS: Le représentant commercial enverra des photos des dommages dans les 24 heures pour confirmer la suite des actions.',
    },
    MODERATE_DAMAGE: {
      label: 'Dommage plus grave à l\'emballage - contenu à vérifier',
      notice: 'AVIS: Le représentant commercial enverra des photos des dommages dans les 24 heures pour confirmer la suite des actions.',
    },
    SEVERE_DAMAGE: {
      label: 'Dommage grave',
      notice: 'AVIS: Le représentant commercial enverra des photos des dommages dans les 24 heures pour confirmer la suite des actions.',
    },
  },
  it: {
    MINOR_DAMAGE: {
      label: 'Danno all\'imballaggio che non compromette il contenuto',
      notice: 'AVVISO: Il rappresentante commerciale invierà le foto del danno entro 24 ore per confermare l\'azione successiva.',
    },
    MODERATE_DAMAGE: {
      label: 'Danno più grave all\'imballaggio - contenuto da verificare',
      notice: 'AVVISO: Il rappresentante commerciale invierà le foto del danno entro 24 ore per confermare l\'azione successiva.',
    },
    SEVERE_DAMAGE: {
      label: 'Danno grave',
      notice: 'AVVISO: Il rappresentante commerciale invierà le foto del danno entro 24 ore per confermare l\'azione successiva.',
    },
  },
}

export function getConditionTranslation(
  condition: string,
  language: Language = 'en'
): ConditionTranslation | null {
  const langTranslations = translations[language] || translations.en
  return langTranslations[condition] || null
}

export function getConditionNote(condition: string, language: Language = 'en'): string {
  const translation = getConditionTranslation(condition, language)
  if (!translation) return ''

  return `\n[PACKAGING CONDITION: ${translation.label}]\n${translation.notice}`
}

