const SIGNALING_SERVER_URL = 'http://localhost:5000';
const PC_CONFIG = {};
const room_id = '123';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: true });
var peer_connection = null;

var media_constraints = {
    video: { width: 1280, height: 720 }
};

function create_peer_connection() {
    if (peer_connection == null) {
        console.log('create new peer connection');
        peer_connection = new RTCPeerConnection(PC_CONFIG);
        peer_connection.onnegotiationneeded = handle_negotiation;
        peer_connection.onicecandidate = handle_icecandidate;
        peer_connection.oniceconnectionstatechange = handle_ice_connection_state_change;
        peer_connection.onsignalingstatechange = handle_signal_state_change;
    }
}

function handle_negotiation() {
    peer_connection.createOffer().then(function(offer) {
        return peer_connection.setLocalDescription(offer);
    }).then(function() {
        const data = {
            type: 'push_offer',
            sdp: peer_connection.localDescription
        };
        socket.emit('data', data);
    })
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

function handle_ice_connection_state_change(event) {
    console.log('ICE state change');
    switch (peer_connection.iceConnectionState) {
        case 'closed':
        case 'failed':
            stop();
            break;
    }
}

function handle_signal_state_change(event) {
    console.log('Signal state change');
    switch (peer_connection.signalingState) {
        case 'closed':
            stop();
            break;
    }
}

function handle_push_answer(sdp){
    var remote_description = new RTCSessionDescription(sdp);
    peer_connection.setRemoteDescription(remote_description);
}

function handle_new_ice_candidate(candidate) {
    if (candidate) {
        var candidate = new RTCIceCandidate(candidate);
        console.log('Adding received ICE candidate: ' + JSON.stringify(candidate));
        peer_connection.addIceCandidate(candidate).catch(reportError);
    }
}

function stop() {
    console.log('stop pushing');
    var local_stream = document.getElementById('local_stream');
    if (peer_connection) {
        peer_connection.onnegotiationneeded = null;
        peer_connection.onicecandidate = null;
        peer_connection.oniceconnectionstatechange = null;
        peer_connection.onsignalingstatechange = null;

        // if (local_stream.srcObject) {
        //     local_stream.srcObject.getTracks().forEach(track => track.stop());
        // }

        peer_connection.close();
        peer_connection = null;
    }
    // local_stream.removeAttribute('src');
    // local_stream.removeAttribute('srcObject');
}

function handle_get_user_media_error(e) {
    switch(e.name) {
        case 'NotFoundError':
            alert('Unable to push video because no camera was found');
            break;
        case 'SecurityError':
        case 'PermissionDeniedError':
            break;
        default:
            alert('Error opening your camera: ' + e.message);
            break;
    }
    stop();
}

function reportError(error) {
    console.log('Error: ' + error);
}

socket.on('connected', () => {
    const data = {
        'role': 'pusher', 
        'room_id': '123'
    };
    socket.emit('join', data);
});

socket.on('ready', () => {
    console.log('ready');
    create_peer_connection();
    navigator.mediaDevices.getUserMedia(media_constraints)
    .then(function(local_stream) {
        console.log(local_stream)
        if (document.getElementById('local_stream').srcObject == null) {
            document.getElementById('local_stream').srcObject = local_stream;
        }
        local_stream.getTracks().forEach(track => peer_connection.addTrack(track, local_stream));
    })
    .catch(handle_get_user_media_error);

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
        case 'push_answer':
            handle_push_answer(sdp);
            break;
        case 'new_ice_candidate':
            handle_new_ice_candidate(candidate);
    }
});
