const raw = require('raw-socket');
const dns = require('dns');
const dgram = require('dgram');
const { hostname } = require('os');

const MAX_TTL = 30;
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


function traceroute(destinationAddress) {

    const udpClient = dgram.createSocket('udp4');
    const icmpSocket = raw.createSocket({protocol: raw.Protocol.ICMP});
    let ttl = 8;

    dns.lookup(destinationAddress, (err, ipAddress) => {
        if (err) {
            console.error("error during dns lookup: ", err);
            return;
        }

        function sendPacket() {
            udpClient.setTTL(ttl);

            udpClient.send(packet, DESTINATION_PORT, destinationAddress, (err) => {
                if (err) {
                    console.error("error during packet send: ", err);
                }
                console.log("Packet sent");
            });
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
            console.log(`Hop ${ttl}: ${source}`);
            if (source === ipAddress || ttl > MAX_TTL) {
                icmpSocket.close();
                udpClient.close();
                return;
            } else {
                ttl++;
                sendPacket();
            }
        });
    })

  
}

traceroute('google.com');
