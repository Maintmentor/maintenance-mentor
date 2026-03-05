// Security service for HTTPS enforcement and SSL certificate validation
export class SecurityService {
  private static instance: SecurityService;

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Force HTTPS redirect on client side
  enforceHTTPS(): void {
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      window.location.replace(`https:${window.location.href.substring(window.location.protocol.length)}`);
    }
  }

  // Set security headers via meta tags
  setSecurityHeaders(): void {
    if (typeof document === 'undefined') return;

    // Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';";
    document.head.appendChild(cspMeta);

    // Strict Transport Security (HSTS)
    const hstsMeta = document.createElement('meta');
    hstsMeta.httpEquiv = 'Strict-Transport-Security';
    hstsMeta.content = 'max-age=31536000; includeSubDomains; preload';
    document.head.appendChild(hstsMeta);

    // X-Frame-Options
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'DENY';
    document.head.appendChild(frameMeta);

    // X-Content-Type-Options
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    document.head.appendChild(contentTypeMeta);
  }

  // Check SSL certificate validity
  async checkSSLCertificate(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.warn(`SSL certificate check failed for ${domain}:`, error);
      return false;
    }
  }

  // Initialize security measures
  initialize(): void {
    this.enforceHTTPS();
    this.setSecurityHeaders();
    
    // Add security event listeners
    window.addEventListener('beforeunload', this.clearSensitiveData);
    
    // Prevent mixed content
    this.preventMixedContent();
  }

  // Clear sensitive data on page unload
  private clearSensitiveData = (): void => {
    // Clear any sensitive data from localStorage/sessionStorage if needed
    // This is a placeholder - implement based on your app's needs
  };

  // Prevent mixed content issues
  private preventMixedContent(): void {
    if (typeof document === 'undefined') return;

    // Upgrade insecure requests
    const upgradeInsecureMeta = document.createElement('meta');
    upgradeInsecureMeta.httpEquiv = 'Content-Security-Policy';
    upgradeInsecureMeta.content = 'upgrade-insecure-requests';
    document.head.appendChild(upgradeInsecureMeta);
  }
}

export const securityService = SecurityService.getInstance();