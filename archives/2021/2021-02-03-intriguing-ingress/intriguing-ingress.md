---
title: Intriguing Ingress
date: 2021-02-03
tags: Homelab, Kubernetes
---

<div class="info">
I've actually switched from this setup to a Traeflik-Ingress based setup. It took a little bit of work to move it over and figure it out (I'd argue that Traeflik's setup has marginally more documentation issues than HAProxy, but Traeflik is quite reasonable as well).

The new setup is documented in [here](../2021-02-07-intriguing-ingress-v2/intriguing-ingress-v2.html)
</div>

TLDR: I lose my mind over overly fancy nginx proxies

So, I recently decided that running a bunch of separate kubernetes services behind MetalLB load balancers was getting on my nerves. So I decided I should do what every homelab has done at some point:

Put all your services behind a ~~nginx proxy~~ Kubernetes Ingress Controller.

## Background

Kubernetes Ingress is basically a higher level abstraction, somewhat like a kubernetes service, but operating at a higher level. Instead of operating at L3/L4 and dealing with ports, it operates at HTTP(S) level and deals with domain names and URIs.

An Ingress resource declares *how* HTTP requests should be handled, and an Ingress Controller handles the actual heavy lifting by pulling (or getting pushed, I'm not entirely sure, and I'm fairly sure the semantics doesn't really matter) the Ingress resources in every namespace and then generating a config for whatever application inside is handling the HTTP routing.

That being said, it still *needs* to have a service to expose it to the rest of the network, and it needs services in order to route packets to and from other pods. It doesn't replace services or load balancers, it's just a higher level way to manage HTTP(S) services running on your cluster.

## Setup

In my setup, I'm using the [HAProxy Kubernetes Ingress controller](https://github.com/haproxytech/kubernetes-ingress), as they have a community edition and have a manifest-based-operator that I can pick apart instead of dealing with helm charts (not a fan of helm charts, personally, but that's also besides the point).

As a note, all of this stuff can be found in my [repository](https://github.com/lambda-funcptr/homelab).

I decided to organize my ingress controller(s) into a namespace called `ingress`, and then create the required RBAC required for the operation of the ingress controller. This is all ~~stolen~~ adapted **shamelessly** from the [operator](https://raw.githubusercontent.com/haproxytech/kubernetes-ingress/v1.5/deploy/haproxy-ingress.yaml) documented in the [documentation](https://www.haproxy.com/documentation/kubernetes/latest/)

<details>
<summary>`ingress-rbac.yaml`</summary>
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
name: ingress-service-account
namespace: ingress
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
name: ingress-cluster-role
rules:
- apiGroups:
    - ""
      resources:
    - configmaps
    - endpoints
    - nodes
    - pods
    - services
    - namespaces
    - events
    - serviceaccounts
      verbs:
    - get
    - list
    - watch
- apiGroups:
    - "extensions"
    - "networking.k8s.io"
      resources:
    - ingresses
    - ingresses/status
    - ingressclasses
      verbs:
    - get
    - list
    - watch
- apiGroups:
    - "extensions"
    - "networking.k8s.io"
      resources:
    - ingresses/status
      verbs:
    - update
- apiGroups:
    - ""
      resources:
    - secrets
      verbs:
    - get
    - list
    - watch
    - create
    - patch
    - update
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
name: ingress-cluster-role-binding
namespace: ingress
roleRef:
apiGroup: rbac.authorization.k8s.io
kind: ClusterRole
name: ingress-cluster-role
subjects:
- kind: ServiceAccount
  name: ingress-service-account
  namespace: ingress
```
</details>

After creating the service account, we also have to create the ingress controller, a config map and connect it to at least one service and define a backend in order for it to start taking requests.

<details>
<summary>`haproxy.yaml`</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    run: haproxy-ingress
  name: haproxy-ingress
  namespace: ingress
spec:
  replicas: 1
  selector:
    matchLabels:
      run: haproxy-ingress
  template:
    metadata:
      labels:
        run: haproxy-ingress
    spec:
      serviceAccountName: ingress-service-account
      containers:
      - name: haproxy-ingress
        image: harbor.fnptr.net/docker/haproxytech/kubernetes-ingress
        args:
          - --configmap=ingress/haproxy
          - --default-backend-service=haproxy-controller/ingress-default-backend
        securityContext:
          runAsUser:  1000
          runAsGroup: 1000
          capabilities:
            drop:
              - ALL
            add:
              - NET_BIND_SERVICE
        resources:
          requests:
            cpu: "500m"
            memory: "50Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 1042
        ports:
        - name: http
          containerPort: 80
        - name: https
          containerPort: 443
        - name: stat
          containerPort: 1024
        env:
        - name: TZ
          value: "America/New_York"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
      initContainers:
        - name: sysctl
          image: busybox:musl
          command:
            - /bin/sh
            - -c
            - sysctl -w net.ipv4.ip_unprivileged_port_start=0
          securityContext:
            privileged: true
```

</details>

<details>
<summary>`haproxy-configmap.yaml`</summary>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: haproxy
  namespace: ingress
data:
```

</details>
<details>
<summary>`media-ingress.yaml`</summary>

```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    run: haproxy-ingress
  name: haproxy-ingress
  namespace: ingress
spec:
  selector:
    run: haproxy-ingress
  type: LoadBalancer
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
  - name: https
    port: 443
    protocol: TCP
    targetPort: 443
  - name: stat
    port: 1024
    protocol: TCP
    targetPort: 1024
```

</details>

Technically speaking, we should set up a default backend for ingress, but that's really trivial. There's one by google called `google_containers/defaultbackend` which just returns a glorious error for any request to it. 

Setting this one up is left as an exercise to the reader. `:)`

## Setting up our first ingress

After all of that, we can finally define our first ingress (in any namespace we please, even).

What's important is that *all DNS records resolve to the IP of the service feeding the ingress controller(s)*. I just shoved a wildcard `A` for `*.media.s.fnptr.net` record into a coredns container and left it at that.

Since *basically everyone* has a plex server, why not start with plex?

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: media-ingress
  namespace: media
spec:
  rules:
  - host: plex.media.s.fnptr.net
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: plex
            port:
              number: 80
```

This is fairly simple to read.
Any time any HTTP(S) hits the ingress controller, it checks:

- Is there an existing ingress resource with a matching rule with it
    - In this case, it checks the `Host` field of the request header, and if it matches `plex.media.s.fnptr.net`
- Looks for the paths in the RuleSpec, and checks if the path matches any of those, and then forwards the request to the backend
    - Since our path is /, we match all requests, which then get sent to the service named plex
- If none of those match, we get sent to the default ingress, which *should* return an error.

Which is pretty neat.


## Multiple services

What if, though, we wanted to set up multiple services?

Well, here's an example manifest for an Ingress controller for, say a monitoring dashboard (after configuring these applications, that is):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: infrastructure
  annotations:
    haproxy.org/path-rewrite: /grafana/(.*) /\1
spec:
  rules:
  - host: monitor.fnptr.net
    http:
      paths:
      - path: /grafana
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kibana-ingress
  namespace: infrastructure
  annotations:
    haproxy.org/path-rewrite: /kibana/(.*) /\1
- path: /kibana
  pathType: Prefix
  backend:
    service:
      name: kibana
      port:
        number: 80
```

Now isn't that really, really simple compared to having multiple services and managing either an nginx proxy or multiple DNS records for your apps?

## What's next:

Well, to be honest, I still need add more ingress classes and secure ingress via certificates, but that's going to take a while to get ready, as last time I tried to use the cert-manager operator, it didn't work and deleting it broke my cluster.

I'll try again later, and also work adding multiple ingress classes, and I'll update this post with the new onces when it happens.