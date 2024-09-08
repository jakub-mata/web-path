# Web-Spy

This Javascript code mimics the famous traceroute command on Linux machines.

## Description

After running the script on a certain destination, the output will be logged out to the terminal. Individual hops, representing a server (or a router) which caught your request and sent it forward.

> The code actually creates a UDP socket that sends requests with incrementing its time-to-live attribute (starting at 1).

> An ICMP socket is created to catch incoming responses about reaching its destination. If you're interested in the details, you can visit this [website](https://www.howtogeek.com/134132/how-to-use-traceroute-to-identify-network-problems/).

If a server on the route is unresponsive, a timeout runs out and another packet with increased time-to-live is sent.

An example output (which would be different based on your network or just the current situation) after running it on `google.com` might look like this:
```
Searching for google.com
Hop 1: 192.168.1.1
Hop 2: 10.252.252.102
Elapsed time of 2000ms on hop 3
Hop 4: 213.192.4.197
Hop 5: 185.188.186.96
Hop 6: 185.188.187.253
Hop 7: 142.250.164.177
Hop 8: 142.250.164.176
Hop 9: 192.178.98.175
Hop 10: 209.85.245.247
Hop 11: 142.251.36.78
Destination reached.
ICMP socket closed
UDP socket closed
```

## Usage

The `web-spy` command needs an elevated permission to run (specifically to create a raw socket). On linux, the main command would be:
```
sudo node web-spy *website to search for*
 ```
The main positional argument (labeled as website to search) can either be a host name (e.g. google.com) or an IPv4 address. If unsure, run `node web-spy --help`. 
