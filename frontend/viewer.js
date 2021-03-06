const SIGNALING_SERVER_URL = 'http://localhost:5000';
const PC_CONFIG = {};
const room_id = '123';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: true });
var peer_connection = null;

function create_peer_connection() {
    if (peer_connection == null) {
        peer_connection = new RTCPeerConnection(PC_CONFIG);
        peer_connection.onicecandidate = handle_icecandidate;
        peer_connection.ontrack = handle_ontrack;
        peer_connection.onremovetrack = handle_onremovetrack;
        peer_connection.oniceconnectionstatechange = handle_ice_connection_state_change;
        peer_connection.onsignalingstatechange = handle_signal_state_change;
    }
}

function handle_icecandidate(event) {
    if (event.candidate) {
        console.log('Found icecandidate' + event.candidate.candidate);
        const data = {
            type: 'new_ice_candidate',
            candidate: event.candidate
        };
        socket.emit('data', data);
    }
}

function handle_ontrack(event) {
    console.log('Add track');
    console.log('track active: ' + event.streams[0].active);
    document.getElementById('remote_stream').srcObject = event.streams[0];
}

function handle_onremovetrack(event) {
    console.log('remove track');
    var stream = document.getElementById('remote_stream').srcObject;
    var track_list = stream.getTracks();

    if (track_list.length == 0) {
        stop();
    }
}

function handle_ice_connection_state_change(event) {
    console.log('ICE state change: ', peer_connection.iceConnectionState);
    switch (peer_connection.iceConnectionState) {
        case 'closed':
        case 'failed':
            stop();
            break;
    }
}

function handle_signal_state_change(event) {
    console.log('Signal state change:', peer_connection.signalingState);
    switch (peer_connection.signalingState) {
        case 'closed':
            stop();
            break;
    }
}

function handle_push_offer(sdp){
    var remote_description = new RTCSessionDescription(sdp);
    peer_connection.setRemoteDescription(remote_description).then(function() {
        return peer_connection.createAnswer();
    }).then(function(answer) {
        return peer_connection.setLocalDescription(answer);
    }).then(function() {
        const data = {
            type: 'push_answer',
            sdp: peer_connection.localDescription
        };
        socket.emit('data', data);
    })
}

function handle_new_ice_candidate(candidate) {
    if (candidate) {
        var candidate = new RTCIceCandidate(candidate);
        console.log('Adding received ICE candidate: ' + JSON.stringify(candidate));
        peer_connection.addIceCandidate(candidate).catch(reportError);
    }
}

function stop() {
    console.log('stop viewing');
    var remote_stream = document.getElementById('remote_stream');
    if (peer_connection) {
        peer_connection.onicecandidate = null;
        peer_connection.ontrack = null;
        peer_connection.onremovetrack = null;
        peer_connection.oniceconnectionstatechange = null;
        peer_connection.onsignalingstatechange = null;

        // if (remote_stream.srcObject) {
        //     remote_stream.srcObject.getTracks().forEach(track => track.stop());
        // }

        peer_connection.close();
        peer_connection = null;
    }
    // remote_stream.removeAttribute('src');
    remote_stream.removeAttribute('srcObject');
}

function reportError(error) {
    console.log('Error: ' + error)
}

socket.on('connected', () => {
    const data = {
        'role': 'viewer', 'room_id': '123'
    };
    socket.emit('join', data);
    generateQRCode();
});

socket.on('ready', () => {
    console.log('ready');
    create_peer_connection();
});

socket.on('peer_left', (data) => {
    console.log('peer left');
    stop();
});

socket.on('data', (data) => {
    const type = data.type;
    const sdp = data.sdp;
    const candidate = data.candidate;

    switch (type) {
        case 'push_offer':
            if (sdp) {
                handle_push_offer(sdp);
            }
            break;
        case 'new_ice_candidate':
            if (candidate) {
                handle_new_ice_candidate(candidate);
            }
            break;
    }
});

function generateQRCode() {
    var qr_url = 'https://localhost:7000/pusher.html';
    var qr = new QRious({
        element: document.getElementById('pusher_qr_code'),
        size: 300,
        value: qr_url
    });
}
