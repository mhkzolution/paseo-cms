# Production Deployment

Target stack: Ubuntu, Node.js, MySQL, PM2, and Nginx.

## Server prerequisites

```bash
sudo apt update
sudo apt install -y nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Create a database and user:

```sql
CREATE DATABASE the_paseo_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'paseo_cms'@'localhost' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT ALL PRIVILEGES ON the_paseo_cms.* TO 'paseo_cms'@'localhost';
FLUSH PRIVILEGES;
```

## Environment

Create `/var/www/paseo-cms/.env`:

```bash
DATABASE_URL="mysql://paseo_cms:replace-with-a-strong-password@localhost:3306/the_paseo_cms"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://cms.example.com"
SEED_ADMIN_EMAIL="admin@thepaseo.co.th"
SEED_ADMIN_PASSWORD="replace-before-first-login"
```

Generate the secret with:

```bash
openssl rand -base64 32
```

## Build and release

From the project directory:

```bash
npm ci
npm run validate
npm run build
npx prisma migrate deploy
npm run prisma:seed
```

Copy these build artifacts to `/var/www/paseo-cms`:

```bash
.next/standalone
.next/static
public
prisma
package.json
ecosystem.config.cjs
```

Then start or reload PM2:

```bash
sudo mkdir -p /var/log/paseo-cms
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Nginx

Copy `deploy/nginx.conf.example` to `/etc/nginx/sites-available/paseo-cms`, replace
`cms.example.com`, then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/paseo-cms /etc/nginx/sites-enabled/paseo-cms
sudo nginx -t
sudo systemctl reload nginx
```

Add TLS with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cms.example.com
```

## Operational checks

```bash
pm2 status
pm2 logs paseo-cms
curl -I https://cms.example.com/login
curl -I https://cms.example.com/sitemap.xml
curl -I https://cms.example.com/robots.txt
```

After the first login, change the seeded admin password.
