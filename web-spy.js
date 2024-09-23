const raw = require('raw-socket');
const dns = require('dns');
const dgram = require('dgram');
const { program } = require("commander");

let MAX_TTL = 20;  //can be changed through optional arguments
let TIMEOUT = 2000;  //can be changed through optional arguments
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
    .option("--timeout <int>", "timeout after which our socket no longer waits for a response")
    .option("--max_ttl <int>", "max amount of the time-to-live variable after which hopping ends (default is 20)")
    .action((address, options) => {
        if (address) {
            console.log("Searching for", address);
            if (options.timeout) {TIMEOUT = options.timeout}
            if (options.max_ttl) {MAX_TTL = options.max_ttl}
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

    async function startTrace(ipAddress, logHostnamesBool) {
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
                console.log(`Hop ${ttl}: unresponsive (elapsed time of ${TIMEOUT}ms)`);
                if (ttl < MAX_TTL) {
                    setImmediate(sendPacket);
                    return;
                }
                console.log(`HOPPING STOPPED: Max hops of ${MAX_TTL} reached.`);
                icmpSocket.close();
                udpClient.close();
                return;
            }
            
            clearTimeout(timeout);
            if (hostnameBool) {
                findHostName(ip, ttl).then((value) => {
                    logHop(value, ip, ttl);
                    checkEnd();
                }, (reason) => {
                    logHop(reason, ip, ttl);
                    checkEnd();
                })
            } else {
                logHop(null, ip, ttl);
                checkEnd();
            }

            function checkEnd() {
                if (ip === ipAddress) {
                    console.log(`Destination ${destinationAddress} reached at ${ipAddress}.`);
                    icmpSocket.close();
                    udpClient.close();
                    return;
                }
                setImmediate(sendPacket);
            }
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

function findHostName(ip, ttl) {
    return new Promise((resolve, reject) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err) {
                reject(null);
                return;
            }
            resolve(hostnames[0]);
        })
    })
}

function logHop(hostname, ip, ttl) {
    if (hostname) {
        console.log(`Hop ${ttl}: ${ip} at ${hostname}`);
    } else {
        console.log(`Hop ${ttl}: ${ip}`);
    }
}