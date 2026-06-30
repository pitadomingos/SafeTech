import { Company } from '../types';

/**
 * Checks if a company is a descendant (nested at any level) of a parent company.
 * Returns true if childId === parentId.
 */
export const isCompanyDescendant = (
  childId: string | undefined,
  parentId: string | undefined,
  companies: Company[]
): boolean => {
  if (!childId || !parentId) return false;
  if (childId === parentId) return true;
  const child = companies.find(c => c.id === childId);
  if (!child || !child.parentId) return false;
  return isCompanyDescendant(child.parentId, parentId, companies);
};

/**
 * Gets all descendant company IDs recursively.
 */
export const getCompanyDescendants = (parentId: string, companies: Company[]): string[] => {
  const descendants: string[] = [];
  const traverse = (id: string) => {
    companies.forEach(c => {
      if (c.parentId === id) {
        descendants.push(c.id);
        traverse(c.id);
      }
    });
  };
  traverse(parentId);
  return descendants;
};

/**
 * Recursively checks if the alcohol control (Bafometro) feature is enabled for a company.
 * A company inherits the feature if it is enabled on itself or on any of its ancestors.
 */
export const isAlcoholFeatureEnabled = (
  companyId: string | undefined,
  companies: Company[]
): boolean => {
  if (!companyId) return false;
  const company = companies.find(c => c.id === companyId || c.name === companyId);
  if (!company) return false;
  if (company.features?.alcohol) return true;
  if (company.parentId) {
    return isAlcoholFeatureEnabled(company.parentId, companies);
  }
  return false;
};
