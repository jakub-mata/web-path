const raw = require('raw-socket');
const dns = require('dns');
const dgram = require('dgram');
const { program } = require("commander");
const { log } = require('console');
const { hostname } = require('os');

const MAX_TTL = 20;
const TIMEOUT = 2000;
const LOCAL_PORT = 8080;
const DESTINATION_PORT = 33434; //traceroute-reserved port number range: 33434 - 33534

const packet = Buffer.from([
    0x08, 0x00, //ICMP Echo header
    0x00, 0x00, //checksum
    0x00, 0x01, //identifier
    0x00, 0x01, //sequence number
]);
//overwriting checksum
raw.writeChecksum(packet, 2, raw.createChecksum(packet));

program
    .argument("<address>", "web address to trace (either IP or a host name, e.g. google.com)")
    .option("-n", "display hostnames alongside IPs on individual hops", false)
    .action((address, options) => {
        if (address) {
            console.log("Searching for", address);
            console.log(options.n)
            console.log(options);
            traceroute(address, options.n);
        } else {
            console.log("You have not entered any host as a destination");
        }
    })
program.parse();


function traceroute(destinationAddress, logHostnamesBool) {

    const udpClient = dgram.createSocket('udp4');
    const icmpSocket = raw.createSocket({protocol: raw.Protocol.ICMP});
    const options = {
        family: 4,
    }
    let ttl = 0;
    let timeout;

    if (!isIPAddress(destinationAddress)) {
        dns.lookup(destinationAddress, options, (err, ipAddress) => {
            if (err) {
                console.error("error during dns lookup: ", err);
                return;
            }
            startTrace(ipAddress, logHostnamesBool);
        })
    } else {
        startTrace(destinationAddress, logHostnamesBool);
    }

    function startTrace(ipAddress, logHostnamesBool) {
        function sendPacket() {
            ttl++;
            udpClient.setTTL(ttl);

            udpClient.send(packet, DESTINATION_PORT, destinationAddress, (err) => {
                if (err) {
                    console.error("error during packet send: ", err);
                }
                timeout = setTimeout(handleReply, TIMEOUT);
            });
        }

        function handleReply(ip, hostnameBool) {
            if (!ip) {
                console.log(`Elapsed time of ${TIMEOUT}ms on hop ${ttl}`);
                if (ttl < MAX_TTL) {
                    setImmediate(sendPacket);
                    return;
                }
                console.log(`Max hops of ${MAX_TTL} reached.`);
                icmpSocket.close();
                udpClient.close();
                return;
            }
    
            clearTimeout(timeout);
            handleLogging(ip, hostnameBool, ttl);
            
            if (ip === ipAddress) {
                console.log(`Destination ${destinationAddress} reached at ${ipAddress}.`);
                icmpSocket.close();
                udpClient.close();
                return;
            }
            setImmediate(sendPacket);
        }

        udpClient.bind(LOCAL_PORT, () => {
            sendPacket();
        });
    
        udpClient.on("close", () => {
            console.log("UDP socket closed");
        });
    
        icmpSocket.on("close", () => {
            console.log("ICMP socket closed");
        });
    
        icmpSocket.on("message", (buffer, source) => {
            handleReply(source, logHostnamesBool);
        });
    }
}

function isIPAddress(ip) {
    const IPv4_regex = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/gm;
    return IPv4_regex.test(ip);
}

async function findHostName(ip, ttl) {
    return dns.reverse(ip, (err, hostnames) => {
        if (err) {
            return null;
        }
        logHop(hostnames[0], ip, ttl);
    })
}

function logHop(hostname, ip, ttl) {
    if (hostname) {
        console.log(`Hop ${ttl}: ${ip} at ${hostname}`);
    } else {
        console.log(`Hop ${ttl}: ${ip}`);
    }
}

function handleLogging(ip, hostnameBool, ttl) {
    if (hostnameBool) {
        findHostName(ip, ttl);
    } else {
        logHop(null, ip, ttl);
    }
}