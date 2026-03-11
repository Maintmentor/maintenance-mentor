# Custom Domain Setup Guide: maintenancementor.io

Complete guide for setting up your custom domain with DNS configuration, SSL certificates, and redirect rules.

---

## Table of Contents
1. [DNS Configuration](#dns-configuration)
2. [SSL Certificate Setup](#ssl-certificate-setup)
3. [Redirect Rules (WWW ↔ Non-WWW)](#redirect-rules)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Troubleshooting](#troubleshooting)
6. [Verification Checklist](#verification-checklist)

---

## DNS Configuration

### Step 1: Access Your Domain Registrar
Log into your domain registrar (GoDaddy, Namecheap, Google Domains, etc.) and navigate to DNS Management.

### Step 2: Configure DNS Records

#### Option A: Using Netlify/Vercel (Recommended)
```
Type    Name    Value                           TTL
A       @       75.2.60.5                       3600
CNAME   www     maintenancementor.netlify.app   3600
```

#### Option B: Using Custom Server
```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          3600
A       www     YOUR_SERVER_IP          3600
```

#### Option C: Using Cloudflare (With CDN)
```
Type    Name    Value               Proxy Status    TTL
A       @       YOUR_SERVER_IP      Proxied         Auto
CNAME   www     @                   Proxied         Auto
```

### Step 3: Add Additional Records (Optional but Recommended)
```
Type    Name    Value                                   TTL
TXT     @       "v=spf1 include:_spf.google.com ~all"   3600
MX      @       mail.maintenancementor.io               3600
```

---

## SSL Certificate Setup

### Method 1: Automatic SSL (Netlify/Vercel)
1. Go to Domain Settings in your hosting dashboard
2. Add custom domain: `maintenancementor.io`
3. Add www subdomain: `www.maintenancementor.io`
4. Click "Verify DNS Configuration"
5. Enable "Automatic TLS Certificate" (Let's Encrypt)
6. Wait 24-48 hours for propagation

### Method 2: Cloudflare SSL (Free)
1. Add site to Cloudflare
2. Update nameservers at your registrar:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
3. In Cloudflare Dashboard:
   - Go to SSL/TLS → Overview
   - Set to "Full (Strict)" mode
   - Enable "Always Use HTTPS"
   - Enable "Automatic HTTPS Rewrites"

### Method 3: Manual SSL (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d maintenancementor.io -d www.maintenancementor.io

# Auto-renewal (add to crontab)
0 0 * * * certbot renew --quiet
```

---

## Redirect Rules

### Option 1: Redirect WWW to Non-WWW (Recommended)
**Primary Domain:** maintenancementor.io  
**Redirect:** www.maintenancementor.io → maintenancementor.io

#### Netlify (_redirects file)
```
# public/_redirects
https://www.maintenancementor.io/* https://maintenancementor.io/:splat 301!
```

#### Vercel (vercel.json)
```json
{
  "redirects": [
    {
      "source": "https://www.maintenancementor.io/:path*",
      "destination": "https://maintenancementor.io/:path*",
      "permanent": true
    }
  ]
}
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name www.maintenancementor.io;
    
    ssl_certificate /etc/letsencrypt/live/maintenancementor.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/maintenancementor.io/privkey.pem;
    
    return 301 https://maintenancementor.io$request_uri;
}
```

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.maintenancementor\.io [NC]
RewriteRule ^(.*)$ https://maintenancementor.io/$1 [L,R=301]
```

### Option 2: Redirect Non-WWW to WWW
**Primary Domain:** www.maintenancementor.io  
**Redirect:** maintenancementor.io → www.maintenancementor.io

#### Netlify (_redirects file)
```
# public/_redirects
https://maintenancementor.io/* https://www.maintenancementor.io/:splat 301!
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name maintenancementor.io;
    
    ssl_certificate /etc/letsencrypt/live/maintenancementor.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/maintenancementor.io/privkey.pem;
    
    return 301 https://www.maintenancementor.io$request_uri;
}
```

---

## Platform-Specific Guides

### Netlify Setup
1. **Add Custom Domain:**
   - Dashboard → Domain Settings → Add Custom Domain
   - Enter: `maintenancementor.io`
   - Add domain alias: `www.maintenancementor.io`

2. **Configure DNS:**
   - Use Netlify DNS (recommended) or external DNS
   - If external, add A record: `75.2.60.5`
   - Add CNAME: `www` → `your-site.netlify.app`

3. **Enable HTTPS:**
   - Automatically enabled after DNS verification
   - Force HTTPS: Settings → Domain Management → HTTPS → Force HTTPS

### Vercel Setup
1. **Add Domain:**
   - Project Settings → Domains
   - Add: `maintenancementor.io` and `www.maintenancementor.io`

2. **Configure DNS:**
   - A Record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

3. **SSL:**
   - Automatic via Let's Encrypt
   - Verify: Settings → Domains → SSL Certificate Status

### Cloudflare Pages Setup
1. **Add Site to Cloudflare**
2. **Update Nameservers** at registrar
3. **Configure DNS:**
   - A Record: `@` → Your origin IP (Proxied)
   - CNAME: `www` → `@` (Proxied)
4. **SSL/TLS:** Set to "Full (Strict)"
5. **Page Rules:**
   - Create rule for www redirect
   - URL: `www.maintenancementor.io/*`
   - Setting: Forwarding URL (301)
   - Destination: `https://maintenancementor.io/$1`

---

## Troubleshooting

### Issue 1: DNS Not Propagating
**Symptoms:** Domain not resolving after 24+ hours

**Solutions:**
```bash
# Check DNS propagation
nslookup maintenancementor.io
dig maintenancementor.io

# Use online tools
https://dnschecker.org
https://www.whatsmydns.net
```

**Fixes:**
- Clear local DNS cache:
  ```bash
  # Windows
  ipconfig /flushdns
  
  # Mac
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
  
  # Linux
  sudo systemd-resolve --flush-caches
  ```
- Lower TTL to 300 seconds temporarily
- Wait full 48 hours for global propagation

### Issue 2: SSL Certificate Errors
**Symptoms:** "Not Secure" warning, certificate mismatch

**Solutions:**
1. **Verify DNS is pointing correctly:**
   ```bash
   dig maintenancementor.io
   dig www.maintenancementor.io
   ```

2. **Check certificate coverage:**
   ```bash
   openssl s_client -connect maintenancementor.io:443 -servername maintenancementor.io
   ```

3. **Regenerate certificate:**
   ```bash
   sudo certbot delete --cert-name maintenancementor.io
   sudo certbot --nginx -d maintenancementor.io -d www.maintenancementor.io
   ```

4. **Verify certificate includes both domains:**
   - Certificate must cover both `maintenancementor.io` AND `www.maintenancementor.io`

### Issue 3: Redirect Loop
**Symptoms:** Browser shows "Too many redirects"

**Solutions:**
1. **Check conflicting redirects:**
   - Hosting platform redirects
   - .htaccess or nginx config
   - Cloudflare page rules
   - Application-level redirects

2. **Clear browser cache and cookies**

3. **Verify SSL mode in Cloudflare:**
   - Should be "Full (Strict)" not "Flexible"

4. **Check redirect chain:**
   ```bash
   curl -I https://maintenancementor.io
   curl -I https://www.maintenancementor.io
   ```

### Issue 4: WWW Not Working
**Symptoms:** Non-www works, www doesn't (or vice versa)

**Solutions:**
1. **Verify CNAME record exists:**
   ```bash
   dig www.maintenancementor.io CNAME
   ```

2. **Check hosting platform configuration:**
   - Both domains added as aliases
   - SSL certificate covers both

3. **Verify redirect rules are correct**

### Issue 5: Mixed Content Warnings
**Symptoms:** Some resources load over HTTP

**Solutions:**
1. **Update all URLs to HTTPS or relative:**
   ```javascript
   // Bad
   <img src="http://maintenancementor.io/image.jpg" />
   
   // Good
   <img src="https://maintenancementor.io/image.jpg" />
   <img src="/image.jpg" />
   ```

2. **Add Content Security Policy:**
   ```html
   <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
   ```

3. **Enable "Automatic HTTPS Rewrites" in Cloudflare**

### Issue 6: Email Not Working After DNS Change
**Symptoms:** Email stops working after pointing domain

**Solutions:**
1. **Preserve MX records:**
   ```
   Type    Priority    Value
   MX      10          mail.example.com
   ```

2. **Add SPF record:**
   ```
   TXT     @     "v=spf1 include:_spf.google.com ~all"
   ```

3. **Verify email DNS:**
   ```bash
   dig maintenancementor.io MX
   ```

---

## Verification Checklist

### Pre-Launch
- [ ] DNS A record points to correct IP
- [ ] CNAME record for www configured
- [ ] TTL set appropriately (3600 for production)
- [ ] MX records preserved (if using email)
- [ ] SPF/DKIM records added (if using email)

### SSL Verification
- [ ] Certificate issued for both domains
- [ ] HTTPS works on maintenancementor.io
- [ ] HTTPS works on www.maintenancementor.io
- [ ] No mixed content warnings
- [ ] SSL Labs test: A+ rating (https://www.ssllabs.com/ssltest/)

### Redirect Testing
- [ ] www redirects to non-www (or vice versa)
- [ ] HTTP redirects to HTTPS
- [ ] All pages redirect correctly (not just homepage)
- [ ] No redirect loops
- [ ] Status code is 301 (permanent)

### Performance & Security
- [ ] DNS propagation complete (check https://dnschecker.org)
- [ ] Page loads under 3 seconds
- [ ] Security headers configured
- [ ] HSTS enabled
- [ ] Cloudflare/CDN configured (optional)

### Testing Commands
```bash
# Test DNS
dig maintenancementor.io
dig www.maintenancementor.io

# Test SSL
curl -I https://maintenancementor.io
curl -I https://www.maintenancementor.io

# Test redirects
curl -L -I http://maintenancementor.io
curl -L -I http://www.maintenancementor.io

# Check SSL certificate
openssl s_client -connect maintenancementor.io:443 -servername maintenancementor.io | grep subject

# Test from multiple locations
https://www.whatsmydns.net/#A/maintenancementor.io
```

---

## Quick Reference: Common DNS Records

| Record Type | Name | Value | Purpose |
|-------------|------|-------|---------|
| A | @ | 75.2.60.5 | Points domain to IP |
| CNAME | www | maintenancementor.io | Points www to main domain |
| TXT | @ | v=spf1... | Email authentication |
| MX | @ | mail.example.com | Email routing |
| CAA | @ | 0 issue "letsencrypt.org" | SSL certificate authority |

---

## Support Resources

- **DNS Propagation Checker:** https://dnschecker.org
- **SSL Test:** https://www.ssllabs.com/ssltest/
- **Redirect Checker:** https://httpstatus.io
- **DNS Lookup:** https://mxtoolbox.com
- **Let's Encrypt:** https://letsencrypt.org
- **Cloudflare Docs:** https://developers.cloudflare.com

---

## Need Help?

If you encounter issues not covered here:
1. Check hosting platform documentation
2. Verify all DNS records with `dig` or `nslookup`
3. Test SSL with SSL Labs
4. Clear all caches (browser, DNS, CDN)
5. Wait full 48 hours for DNS propagation
6. Contact hosting support with specific error messages

---

**Last Updated:** January 2025  
**Domain:** maintenancementor.io  
**Recommended Setup:** Non-WWW primary with WWW redirect, Cloudflare SSL
