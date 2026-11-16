import { t as translate, type MessageKey } from '@/i18n'

/** The entries every tenant starts with: code -> stored English name -> message key. */
const DEFAULTS: Record<string, { name: string; key: MessageKey }> = {
  projector: { name: 'Projector', key: 'feature.projector' },
  screen: { name: 'Screen', key: 'feature.screen' },
  'video-conferencing': { name: 'Video conferencing', key: 'feature.videoConferencing' },
  whiteboard: { name: 'Whiteboard', key: 'feature.whiteboard' },
  'wheelchair-access': { name: 'Wheelchair access', key: 'feature.wheelchairAccess' },
  'induction-loop': { name: 'Induction loop', key: 'feature.inductionLoop' },
}

/**
 * Name to show for a catalog entry. Default entries are translated while they still carry their
 * original English name; renamed and custom entries show what Facilities stored.
 */
export function featureLabel(
  feature: { code: string; name: string },
  t: typeof translate = translate,
): string {
  const known = DEFAULTS[feature.code]
  return known && feature.name === known.name ? t(known.key) : feature.name
}
