---
title: Distributed Minecraft
description: A.K.A. distmc. This was a joke. It's no longer funny.
repo: https://github.com/lambda-funcptr/distmc
---

## What it is

Distributed Minecraft is the brainchild of late night half-dead memery in Homelab Discord VC, where the question was asked.
"We can cluster machines, but what do we run on it, Minecraft?"

I then decided that "Clustered Minecraft" was a pretty funny joke, repeated that joke one too many times.
Someone asked "Wait is that a real thing?"
And of course, I decided to make it a real thing.

In retrospect. This is a pretty bad move.

## How it works

Distributed Minecraft works by running a (containerized) L7 proxy (Bungeecord) that sits infront of a (containerized) Minecraft server on the same server (current part of [funcptr CDN](02-funcptr-cdn.html)), and then using portals and commands to direct players from the lobby to servers run by other people.

## The Drawbacks

There's some serious security and logistical ramifications to this that is really quite bad, in particular, bungeecord doesn't do auth from proxy, so any other proxy may masquerade (and possibly feed invalid user auth data), any other proxy in front of a server that interdicts chat will result in a net-split like situation where distmc users can't see chat messages from the other users on the other proxy, and it precludes the usage of any sort of cross-server chat plugin.

That being said, it's mostly alright as long as the servers on the other end:

* Aren't behind another proxy with a chat plugin.
* Use a restrictive firewall with default deny and accept-only from the proxy nodes. (Or use the funcptr CDN wireguard network)
* Bridge chat to IRC and only to IRC, then bridge from IRC to your other protocols.

## The Benefits

There's basically no benefits. 

Theoretically speaking, you *may* see better latency if you have a situation where a server operator's path to an end-user is bad, but the proxy host has a good route to both the end-user and the server operator. 
Alyx from [en0.io](https://en0.io/) testified to a case where a "dumb" nginx proxy did reduce latency significantly for someone in Australia, but I don't really know how common this scenario is, or if they're telling the truth, or if Australia exists.

The other theoretical benefit is being able to run the GeyserMC Bedrock Minecraft to Java Minecraft proxy, which means that server operators are now capable of connecting Bedrock users on Java without needing to do any work on their side aside from set up distmc.

This might be interesting, but auth for Bedrock is still shaky, with default needing a Java account, and the alternative, Floodgate, requiring shared private keys between servers and additional config (losing all the benefits of the previous setup).

## Who's involved?

Ah yes, the most important part.

Here's a list of the ***suckers*** who I managed to con into being a part of this:

* [funcptr.org](https://funcptr.org/)
    * funcptr-org-skyblock
* [seedno.de](https://seedno.de/)
    * seedno-de-safe-space
* [en0.io](https://en0.io/)
    * en0-io-minecraft