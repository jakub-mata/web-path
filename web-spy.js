const raw = require('raw-socket');
const dns = require('dns');
const dgram = require('dgram');
const { program } = require("commander");
const { start } = require('repl');

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
    .action((address) => {
        if (address) {
            console.log("Searching for", address);
            traceroute(address);
        } else {
            console.log("You have not entered any host as a destination");
        }
    })
program.parse();


function traceroute(destinationAddress) {

    const udpClient = dgram.createSocket('udp4');
    const icmpSocket = raw.createSocket({protocol: raw.Protocol.ICMP});
    const options = {
        family: 4,
    }
    let ttl = 0;
    let timeout;

    if (!isIPAddress()) {
        dns.lookup(destinationAddress, options, (err, ipAddress) => {
            if (err) {
                console.error("error during dns lookup: ", err);
                return;
            }
            startTrace(ipAddress);
        })
    } else {
        startTrace(destinationAddress);
    }

    function startTrace(ipAddress) {
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

        function handleReply(ip) {
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
            console.log(`Hop ${ttl}: ${ip}`);
            if (ip === ipAddress) {
                console.log("Destination reached.");
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
            handleReply(source);
        });
    }
}

function isIPAddress(ip) {
    return false;
}