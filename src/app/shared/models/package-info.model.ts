export interface PackageInfo {
  readonly icon: string;
  readonly name: string;
  readonly npmPackage: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly highlightsLabel: string;
  readonly installCmd: string;
  readonly docsLink: string | null;
  readonly badge: string | null;
}
