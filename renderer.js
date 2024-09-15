const button = document.getElementById("send-button");
button.addEventListener("click", () => {
    startHopping();
})

function startHopping() {
    showStartMessage()
    const input = document.getElementById("input").value
    button.innerText = input
}

function showStartMessage() {
    document.getElementById("send-button").innerText = "Done";
}

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
            let hostname = reverseLookup(ip);
            console.log("hostname", hostname);
            
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
            handleReply(source);
        });
    }
}

function isIPAddress(ip) {
    const IPv4_regex = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/gm;
    return IPv4_regex.test(ip);
}

function reverseLookup(ip) {
    dns.reverse(ip, (err, hostnames) => {
        if (err) {
            return null;
        }

        if (hostnames.length > 0) {
            return hostnames[0];
        } else {
            return null;
        }
    })
}