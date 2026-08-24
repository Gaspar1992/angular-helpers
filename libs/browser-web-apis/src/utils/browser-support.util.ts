export class BrowserSupportUtil {
  static isSupported(feature: string): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    switch (feature) {
      case 'permissions':
        return 'permissions' in navigator;
      case 'camera':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      case 'microphone':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'notifications':
        return 'Notification' in window;
      case 'clipboard':
        return 'clipboard' in navigator;
      case 'clipboard-read':
        return 'clipboard' in navigator && 'readText' in navigator.clipboard;
      case 'clipboard-write':
        return 'clipboard' in navigator && 'writeText' in navigator.clipboard;
      case 'persistent-storage':
        return 'storage' in navigator && 'persist' in navigator.storage;
      default:
        return false;
    }
  }

  static getUnsupportedFeatures(): string[] {
    const features = [
      'permissions',
      'camera',
      'microphone',
      'geolocation',
      'notifications',
      'clipboard',
      'clipboard-read',
      'clipboard-write',
      'persistent-storage',
    ];

    return features.filter((feature) => !this.isSupported(feature));
  }

  static isSecureContext(): boolean {
    return typeof window !== 'undefined' ? window.isSecureContext : false;
  }

  static getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : '';
  }

  static isMobile(): boolean {
    const userAgent = this.getUserAgent().toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  static isDesktop(): boolean {
    return !this.isMobile();
  }

  static getBrowserInfo(): {
    name: string;
    version: string;
    isChrome: boolean;
    isFirefox: boolean;
    isSafari: boolean;
    isEdge: boolean;
  } {
    const userAgent = this.getUserAgent();
    const ua = userAgent.toLowerCase();

    return {
      name: this.getBrowserName(ua),
      version: this.getBrowserVersion(userAgent),
      isChrome: /chrome/.test(ua) && !/edge|edg/.test(ua),
      isFirefox: /firefox/.test(ua),
      isSafari: /safari/.test(ua) && !/chrome/.test(ua),
      isEdge: /edge|edg/.test(ua),
    };
  }

  private static getBrowserName(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (/chrome/.test(ua) && !/edge|edg/.test(ua)) return 'Chrome';
    if (/firefox/.test(ua)) return 'Firefox';
    if (/safari/.test(ua) && !/chrome/.test(ua)) return 'Safari';
    if (/edge|edg/.test(ua)) return 'Edge';
    return 'Unknown';
  }

  private static getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(chrome|firefox|safari|edge|edg)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }
}
