export interface MethodDoc {
  name: string;
  signature: string;
  description: string;
  returns: string;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

export interface ApiColumn {
  key: string;
  header: string;
  cellClass: string;
}

export type ApiRow = Record<string, string>;

export const METHODS_COLUMNS: ApiColumn[] = [
  { key: 'name', header: 'Method', cellClass: 'docs-code-name' },
  { key: 'signature', header: 'Signature', cellClass: 'docs-code-sig' },
  { key: 'returns', header: 'Returns', cellClass: 'docs-code-ret' },
  { key: 'description', header: 'Description', cellClass: 'docs-cell-desc' },
];

export const METHODS_COLUMNS_SHORT: ApiColumn[] = [
  { key: 'name', header: 'Method', cellClass: 'docs-code-name' },
  { key: 'returns', header: 'Returns', cellClass: 'docs-code-ret' },
  { key: 'description', header: 'Description', cellClass: 'docs-cell-desc' },
];

export const FIELDS_COLUMNS: ApiColumn[] = [
  { key: 'name', header: 'Field', cellClass: 'docs-code-name' },
  { key: 'type', header: 'Type', cellClass: 'docs-code-ret' },
  { key: 'description', header: 'Description', cellClass: 'docs-cell-desc' },
];

export interface FnFieldDoc {
  name: string;
  type: string;
  description: string;
}

export const FN_FIELDS_COLUMNS: ApiColumn[] = [
  { key: 'name', header: 'Field', cellClass: 'docs-code-name' },
  { key: 'type', header: 'Type', cellClass: 'docs-code-ret' },
  { key: 'description', header: 'Description', cellClass: 'docs-cell-desc' },
];

export interface FnDoc {
  name: string;
  importPath: string;
  returnType: string;
  description: string;
  fields: FnFieldDoc[];
  example: string;
}

export interface ServiceDoc {
  id: string;
  name: string;
  apiName?: string;
  description: string;
  scope: 'root' | 'component' | 'provided';
  importPath: string;
  methods: MethodDoc[];
  example: string;
  browserSupport: string;
  requiresSecureContext: boolean;
  notes: string[];
  fnVersion?: FnDoc;
}

export interface PackageDoc {
  id: string;
  name: string;
  npmPackage: string;
  description: string;
  installCommand: string;
  providerExample: string;
  services: ServiceDoc[];
}
