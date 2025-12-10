/**
 * Utility functions and props for accessibility compliance (WCAG 2.1 AA)
 */

/**
 * Props padrão para ícones decorativos (não interativos)
 * Devem ser ocultados de screen readers
 */
export const decorativeIconProps = {
  'aria-hidden': true,
} as const;

/**
 * Gera props para ícones em elementos interativos
 * @param label - Descrição acessível do ícone
 */
export const interactiveIconProps = (label: string) => ({
  'aria-label': label,
}) as const;

/**
 * Props para elementos de loading/spinner
 * @param label - Descrição do que está carregando
 */
export const loadingProps = (label: string) => ({
  'role': 'status',
  'aria-label': label,
  'aria-live': 'polite' as const,
}) as const;

/**
 * Props para gráficos e visualizações
 * @param description - Descrição acessível do gráfico
 */
export const chartProps = (description: string) => ({
  'role': 'img',
  'aria-label': description,
}) as const;
