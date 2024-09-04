const raw = require('raw-socket');
const dns = require('dns');
const dgram = require('dgram');

const MAX_TTL = 30;
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


function traceroute(destinationAddress) {

    const udpClient = dgram.createSocket('udp4');
    const icmpSocket = raw.createSocket({protocol: raw.Protocol.ICMP});
    let ttl = 4;

    udpClient.bind(LOCAL_PORT, () => {
        udpClient.setTTL(ttl);
    });
    
    udpClient.send(packet, DESTINATION_PORT, destinationAddress, (err) => {
        if (err) {
            console.error("error during packet send: ", err);
        }
        console.log("Packet sent");
    });

    udpClient.on("close", () => {
        console.log("UDP socket closed");
    });

    icmpSocket.on("close", () => {
        console.log("ICMP socket closed");
    });

    icmpSocket.on("message", (buffer, source) => {
        console.log(source);
        icmpSocket.close();
        udpClient.close();
    });
}









/*

function traceroute(destinationAddress) {
    dns.lookup(destinationAddress, (err, address) => {
        if (err) {
            console.error("an error occured during dns lookup: ", err);
            return;
        }
        let ttl = 1;
        console.log(address);

        function probeNextHop() {
            const socket = raw.createSocket({ protocol: raw.Protocol.ICMP });
            const packet = Buffer.from([
                0x08, 0x00, //ICMP Echo header
                0x00, 0x00, //checksum
                0x00, 0x01, //identifier
                0x00, 0x01, //sequence number
            ]);
            //overwriting checksum
            raw.writeChecksum(packet, 2, raw.createChecksum(packet));
            
            socket.setOption(raw.SocketLevel.IPPROTO_IP, raw.SocketOption.IP_TTL, ttl);
            socket.on('message', (buffer, source) => {
                console.log(`Hop ${ttl}: ${source}`);
                socket.close();

                if (source == address || ttl > MAX_TTL) {
                    console.log("Traceroute complete");
                    return;
                } else {
                    ttl++;
                    probeNextHop();
                }
            });

            socket.on("close", () => {
                console.log("socket closed");
            });

            socket.on("error", (err) => {
                console.error("error during icmp probing: ", err);
                socket.close();
            })

            socket.send(packet, 0, packet.length, address, (err, bytes) => {
                if (err) {
                    console.error("error during packet send: ", err);
                    socket.close();
                    return;
                }
                
                setTimeout(() => {
                    console.log(`Hop ${ttl} timed out`);
                    socket.close();
                    ttl++;
                    if (ttl <= MAX_TTL) {
                        probeNextHop();
                    } else {
                        console.log("Traceroute complete");
                    }
                }, TIMEOUT);
                
            });
        }
        probeNextHop();

    });
}
*/
traceroute('google.com');
