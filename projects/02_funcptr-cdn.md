---
title: The funcptr.org CDN
description: "\"Cloudscale\" delivery via a single node VPS."
---

## Design

### State Sync

The funcptr.org CDN has a master (master.cdn.funcptr.org) that provides a authoritative listing of all files, stored in `/srv/cdn`.
Each CDN worker (us-east-1.cdn.funcptr.org, etc) pulls the `/srv/cdn` folder via cronjob'd rsync on a five minute timer.
This design effectively means that the maximum stale cache latency on the CDNs is effectively 5 minutes.

Documents can be pushed to the CDN master via rsync or scp via a separate push user, while the rsync user used to pull from the CDN is limited to read-only access.

### Web Server/Load Balancer Design

All the servers are running some variant of docker for deploying containerized apps, with a nginx configuration running outside of docker for very bad reasons (I need to containerize that, but I'm honestly too lazy right now).

Each endpoint fetches and renews certificates through certbot via letsencrypt independently of the master server, and for each specific certificate, it will add it's FQDN to the list of domains, which is a slight security flaw, but it also guarantees that each certificate on each endpoint is unique, in addition to not tripping the letsencrypt unique-renewal-rate-limit when it's renewal time.