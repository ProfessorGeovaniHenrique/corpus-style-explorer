/**
 * Calculate Log-Likelihood statistic for keyword analysis
 * 
 * @param o1 - Observed frequency in study corpus
 * @param n1 - Total tokens in study corpus
 * @param o2 - Observed frequency in reference corpus
 * @param n2 - Total tokens in reference corpus
 * @returns Log-Likelihood value
 */
export function calculateLogLikelihood(
  o1: number,
  n1: number,
  o2: number,
  n2: number
): number {
  // Expected frequencies
  const e1 = n1 * (o1 + o2) / (n1 + n2);
  const e2 = n2 * (o1 + o2) / (n1 + n2);
  
  // Log-Likelihood formula: 2 * (o1*ln(o1/e1) + o2*ln(o2/e2))
  const ll = 2 * (
    (o1 > 0 ? o1 * Math.log(o1 / e1) : 0) +
    (o2 > 0 ? o2 * Math.log(o2 / e2) : 0)
  );
  
  return ll;
}

/**
 * Calculate Mutual Information score
 * 
 * @param o1 - Observed frequency in study corpus
 * @param n1 - Total tokens in study corpus
 * @param o2 - Observed frequency in reference corpus
 * @param n2 - Total tokens in reference corpus
 * @returns MI score
 */
export function calculateMutualInformation(
  o1: number,
  n1: number,
  o2: number,
  n2: number
): number {
  const p1 = o1 / n1;
  const pTotal = (o1 + o2) / (n1 + n2);
  
  if (p1 === 0 || pTotal === 0) return 0;
  
  return Math.log2(p1 / pTotal);
}

/**
 * Interpret Log-Likelihood value into significance level
 * 
 * @param ll - Log-Likelihood value
 * @returns Significance level
 */
export function interpretLL(ll: number): 'Alta' | 'Média' | 'Baixa' {
  if (ll > 15.13) return 'Alta';      // p < 0.0001
  if (ll > 6.63) return 'Média';      // p < 0.01
  return 'Baixa';                     // p < 0.05
}
