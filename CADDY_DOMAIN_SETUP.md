# Inertia Cleanup: Caddy + Subdomain Setup

This guide connects your chosen subdomain to the Google VM and puts Caddy in front of the app.

Your app currently works here:

```text
http://35.232.153.198:4173
```

After this setup, it should work here:

```text
https://cleanup.agroalive.com.ng
```

## What Caddy Will Do

Caddy listens on the normal website ports:

```text
80 = normal HTTP
443 = secure HTTPS
```

Then it forwards visitors to your app:

```text
inertia-cleanup:4173
```

In simple terms:

```text
cleanup.agroalive.com.ng -> Google VM -> Caddy -> Inertia Cleanup app
```

## Step 1: Confirm The App Still Works

On your Google VM SSH terminal:

```bash
cd ~/inertia-cleanup
docker compose ps
curl http://localhost:4173/api/health
```

You want:

```json
"ffmpeg": true
```

## Step 2: Open Google Cloud Firewall For 80 And 443

In Google Cloud Console:

1. Search for **Firewall**.
2. Open **VPC network > Firewall**.
3. Click **Create firewall rule**.
4. Use:

```text
Name: allow-http-https
Direction: Ingress
Action: Allow
Targets: All instances in the network
Source IPv4 ranges: 0.0.0.0/0
Protocols and ports: tcp:80,443
```

5. Click **Create**.

If Google says a similar rule already exists, that is okay.

## Step 3: Create The Subdomain A Record

In the DNS/Zone Editor for:

```text
agroalive.com.ng
```

click:

```text
+ A Record
```

Fill it like this:

```text
Name: cleanup
Address: 35.232.153.198
TTL: default
```

That creates:

```text
cleanup.agroalive.com.ng
```

Do not delete email, MX, SPF, DKIM, or other existing records.

## Step 4: Create The Caddyfile On The VM

In SSH, paste:

```bash
cd ~/inertia-cleanup
cat > Caddyfile <<'EOF'
cleanup.agroalive.com.ng {
    encode gzip
    reverse_proxy inertia-cleanup:4173
}
EOF
cat Caddyfile
```

## Step 5: Make Sure docker-compose.yml Includes Caddy

In SSH, paste:

```bash
cd ~/inertia-cleanup
cat > docker-compose.yml <<'EOF'
services:
  inertia-cleanup:
    build: .
    ports:
      - "4173:4173"
    environment:
      - PORT=4173
      - MAX_UPLOAD_MB=${MAX_UPLOAD_MB:-500}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  caddy:
    image: caddy:2
    depends_on:
      - inertia-cleanup
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
EOF
cat docker-compose.yml
```

## Step 6: Start Caddy

In SSH:

```bash
cd ~/inertia-cleanup
docker compose up --build -d
```

Check:

```bash
docker compose ps
```

You should see both services:

```text
inertia-cleanup
caddy
```

## Step 7: Watch Caddy Logs

Run:

```bash
docker compose logs -f caddy
```

Look for certificate messages.

If DNS has not reached Google yet, Caddy may fail temporarily. That is normal. Wait 5 to 30 minutes and restart:

```bash
docker compose restart caddy
```

## Step 8: Open The Subdomain

Try:

```text
http://cleanup.agroalive.com.ng
```

Then:

```text
https://cleanup.agroalive.com.ng
```

## Important Notes

### If Processing Fails With FFmpeg Code 1

If the app shows:

```text
FFmpeg exited with code 1
```

the most common beginner cause is selecting a cleanup box too close to the video edge while using **Cleanse**. For edge watermarks, try **Cover** or **Ultra Cover**, or drag the box slightly inside the video frame.

To inspect the server log:

```bash
cd ~/inertia-cleanup
tail -n 80 data/server.log
```

### Static IP

Your current IP is:

```text
35.232.153.198
```

If the VM uses an ephemeral IP, the IP can change after stopping/restarting the VM.

For a serious domain setup, reserve a static IP in Google Cloud. That can create a small monthly cost, so check it against your $10 learning budget.

### Keep Port 4173 For Now

Keep:

```text
http://35.232.153.198:4173
```

working until the subdomain and HTTPS are confirmed.

Later, after Caddy works perfectly, you can close external port `4173` and use only:

```text
https://cleanup.agroalive.com.ng
```

### If Caddy Logs Show NXDOMAIN

If you see:

```text
DNS problem: NXDOMAIN looking up A for cleanup.agroalive.com.ng
```

that means the subdomain does not exist publicly yet. Confirm the DNS record is:

```text
Type: A
Name: cleanup
Address: 35.232.153.198
```

After saving it, wait 5 to 30 minutes, then restart Caddy:

```bash
cd ~/inertia-cleanup
docker compose restart caddy
docker compose logs -f caddy
```

### If HTTPS Does Not Work

Check these in order:

1. DNS `A` record for `cleanup.agroalive.com.ng` points to `35.232.153.198`.
2. Google Cloud firewall allows TCP `80` and `443`.
3. Docker has both containers running.
4. Caddy logs do not show certificate errors.
5. Wait for DNS propagation and restart Caddy.

