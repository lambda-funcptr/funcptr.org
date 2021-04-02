---
title: How not to footgun yourself 
date: 2021-02-23
tags: Homelab, Kubernetes
---

So, I recently footgun'd myself...

Instead of executing 
"`kubectl delete -Rf kubernetes/velero/minio`", I executed...

`kubectl delete -Rf kubernetes/namespaces`

This deleted all my namespaces and nuked my cluster. ***Whoops***.

Well, with that out of the way, time to rebuild my cluster from scratch.

And also, write myself a wrapper around kubectl that will confirm the results of the operation.