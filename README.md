# prebuild_erosolar_dot_online

/etc/nginx/sites-available/erosolar.conf


server {
    server_name erosolar.online www.erosolar.online;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /xcode {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/erosolar.online/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/erosolar.online/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
server {
    if ($host = www.erosolar.online) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = erosolar.online) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name erosolar.online www.erosolar.online;
    return 404; # managed by Certbot




}
