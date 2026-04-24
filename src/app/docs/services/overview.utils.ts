import { ServiceDoc, ServiceCategory } from '../models/doc-meta.model';

export interface ServiceGroupItem {
  id: string;
  name: string;
  description: string;
  experimental?: boolean;
}

export interface ServiceGroup {
  label: string;
  icon: string;
  items: ServiceGroupItem[];
}

const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  'media-device': '📷',
  observer: '👁',
  system: '🖥',
  network: '🌐',
  'storage-io': '💾',
  'worker-compute': '⚙',
  experimental: '🧪',
  security: '🔐',
  'ol-core': '🗺️',
  'ol-layers': '📐',
  'ol-controls': '🎮',
  'ol-interactions': '👆',
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'media-device': 'Media & Device',
  observer: 'Observer APIs',
  system: 'System APIs',
  network: 'Network APIs',
  'storage-io': 'Storage & I/O',
  'worker-compute': 'Web Worker & Compute',
  experimental: 'Experimental APIs',
  security: 'Security & Permissions',
  'ol-core': 'Core',
  'ol-layers': 'Layers',
  'ol-controls': 'Controls',
  'ol-interactions': 'Interactions',
};

/**
 * Generates service groups automatically from service documentation data.
 * Services are grouped by their category field.
 * Experimental services can be separated into their own group or kept inline.
 */
export function generateServiceGroups(
  services: ServiceDoc[],
  options: { separateExperimental?: boolean } = {},
): ServiceGroup[] {
  const { separateExperimental = true } = options;

  // Group services by category
  const grouped = services.reduce(
    (acc, service) => {
      let category = service.category;

      // If experimental and separateExperimental, put in experimental group
      if (separateExperimental && service.fnVersion?.name?.toLowerCase().includes('experimental')) {
        category = 'experimental';
      }

      if (!category) {
        category = 'system'; // default
      }

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push({
        id: service.id,
        name: service.name,
        description: service.description,
        experimental:
          service.fnVersion?.name?.toLowerCase().includes('experimental') ||
          service.notes?.some((n) => n.toLowerCase().includes('experimental')),
      });

      return acc;
    },
    {} as Record<ServiceCategory, ServiceGroupItem[]>,
  );

  // Convert to ServiceGroup array with deterministic order
  const categoryOrder: ServiceCategory[] = [
    'media-device',
    'observer',
    'system',
    'network',
    'storage-io',
    'worker-compute',
    'security',
    'experimental',
    'ol-core',
    'ol-layers',
    'ol-controls',
    'ol-interactions',
  ];

  return categoryOrder
    .filter((cat) => grouped[cat] && grouped[cat].length > 0)
    .map((cat) => ({
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
      items: grouped[cat],
    }));
}

/**
 * Validates that all services have categories assigned.
 * Returns list of service IDs missing categories.
 */
export function validateServiceCategories(services: ServiceDoc[]): string[] {
  return services.filter((s) => !s.category).map((s) => s.id);
}
