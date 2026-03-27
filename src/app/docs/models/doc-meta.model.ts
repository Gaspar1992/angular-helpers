export interface MethodDoc {
  name: string;
  signature: string;
  description: string;
  returns: string;
}

export interface ServiceDoc {
  id: string;
  name: string;
  description: string;
  scope: 'root' | 'component' | 'provided';
  importPath: string;
  methods: MethodDoc[];
  example: string;
  browserSupport: string;
  requiresSecureContext: boolean;
  notes: string[];
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
