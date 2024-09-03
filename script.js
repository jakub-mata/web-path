const raw = require('raw-socket');
const dns = require('dns')

const MAX_TTL = 30;
const TIMEOUT = 2000;

function calculateChecksum(buffer) {
    let sum = 0;
    //Summing 16-bit words
    for (let i=0; i < buffer.length; i+=2) {
        const word = (buffer[i] << 8) + (buffer[i + 1] || 0);
        sum += word;
    }
    //Carry bits
    sum = (sum >> 16) + (sum & 0xffff);
    sum += (sum >> 16);
    //Inversion
    const checksum = ~sum & 0xffff;
    return checksum;
}

function traceroute(destinationAddress) {
    dns.lookup(destinationAddress, (err, address) => {
        if (err) {
            console.error("an error occured during dns lookup: ", err);
            return;
        }
        let ttl = 1;

        function probeNextHop() {
            const socket = raw.createSocket({ protocol: raw.Protocol.ICMP });
            const packet = Buffer.from([
                0x08, 0x00, //ICMP Echo header
                0x00, 0x00, //checksum
                0x00, 0x01, //identifier
                0x00, 0x01, //sequence number
                0x00, 0x01, 0x03, 0x04, 0x06, 0x07, 0x09, 0x10, //random data
            ]);
            //overwriting checksum
            const checksum = calculateChecksum(packet);
            packet.writeUInt16BE(checksum, 2);
            
            socket.setOption(raw.SocketLevel.IPPROTO_IP, raw.SocketOption.IP_TTL, ttl);
            socket.on('message', (buffer, source) => {
                console.log(`Hop ${ttl}: ${source}`);
                socket.close();

                if (source == address || ttl > MAX_TTL) {
                    console.log("Traceroute complete");
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

traceroute('google.com');
