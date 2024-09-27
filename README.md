# Web-Path

This Javascript code mimics the famous traceroute command on Linux machines.

## Installation

Clone this repository and navigate to it in your terminal. The program requires NodeJS (ideally Node 20 or higher). You can check if you have node installed with
```
node -v
```
If you don't get the version of your Node, follow this [article](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs). After cloning the repo, open the main directory. To install dependencies, run 
```
npm i 
```
inside the directory. After that you should be good to go. See [Usage](#usage).
Inside, there is JS file called tracepath.js containing the code. 

## Description

When you search for a website, your request takes a certain path around the internet. After running the script on a certain destination, this path will be logged out to the terminal. Individual hops are servers (or routers) which caught your request and sent it forward.

> The code actually creates a UDP socket that sends requests with incrementing its time-to-live attribute (starting at 1 and having a default ceiling, which can be changed with an optional argument).

> An ICMP socket is created to catch incoming responses about reaching its destination. If you're interested in the details, you can visit this [website](https://www.howtogeek.com/134132/how-to-use-traceroute-to-identify-network-problems/).

 A server can be perfectly functioning but it doesn't have to send an ICMP response about a finished request. If a server on the route is unresponsive, a timeout runs out and another packet with increased time-to-live is sent.
 > It can happen that the server of the destination itself is unresponsive. In this case, the socket will keep attempting to send requests with increasing TTL until maxTTL is reached. If you realize this, you can finish this process (e.g. CTRL + C on Linux machines).

An example output (which would be different based on your network or just the current situation) after running it on `google.com` might look like this:
```
Searching for google.com
Hop 1: 192.168.1.1
Hop 2: 10.252.252.102
Hop 3: unresponsive (elapsed time of 2000ms)
Hop 4: 213.192.4.197
Hop 5: 185.188.186.96
Hop 6: 185.188.187.253
Hop 7: unresponsive (elapsed time of 2000ms)
Hop 8: 142.250.164.176
Hop 9: 192.178.98.175
Hop 10: 209.85.245.247
Hop 11: 142.251.36.78
Destination google.com reached at 142.251.36.78.
ICMP socket closed
UDP socket closed
```

## Usage

The `tracepath` command needs an elevated permission to run (specifically to create a socket). On linux, the main command would be:
```
sudo node web-path *website to search for*
 ```
The main positional argument (labeled as website to search for) can either be a host name (e.g. google.com) or an IPv4 address. If unsure, run `node tracepath.js --help`.

There are 3 optional arguments:
1. `--n`: this flag reverse searches for hostnames of individual hops
2. `--timeout <time in ms>`: integer optional argument for setting the timeout after which the socket no longer waits for a response from a certain hopping router. Default is 2000ms.
3. `--max_ttl <int>`: integer optional argument for setting the maximum time-to-live attribute, essentially limiting the amount of hops, after which sockets are closed.

Example output:
```
sudo node tracepath.js npmjs.org -n --timeout 3000

Searching for npmjs.org
Hop 1: 192.168.1.1 at _gateway
Hop 2: 10.252.252.102
Hop 3: unresponsive (elapsed time of 3000ms)
Hop 4: 213.192.4.197 at ge2-24-s244.bb1.pop9.ost.sloane.cz
Hop 5: 185.188.186.96 at ostra-rc-01-ae69.net.vodafone.cz
Hop 6: 185.188.187.253 at a0sit-rc-01-ae1.net.vodafone.cz
Hop 7: unresponsive (elapsed time of 3000ms)
Hop 8: 31.30.191.82 at cst2-191-82.cust.vodafone.cz
Hop 9: 104.16.0.35
Hop 10: 104.16.3.35
Destination npmjs.org reached at 104.16.3.35.
ICMP socket closed
UDP socket closed
```

## Dependencies
- [raw-socket](https://www.npmjs.com/package/raw-socket)
- [Commander](https://www.npmjs.com/package/commander)
