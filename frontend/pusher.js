const SIGNALING_SERVER_URL = 'http://localhost:5000';
const PC_CONFIG = {};
const room_id = '123';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: true });
var peer_connection = null;

var media_constraints = {
    video: true,
};

let local_stream_element = document.querySelector('local_stream');

function create_peer_connection() {
    if (peer_connection == null) {
        peer_connection = new RTCPeerConnection(PC_CONFIG);
        peer_connection.onnegotiationneeded = handle_negotiation;
        peer_connection.onicecandidate = handle_icecandidate;
        peer_connection.oniceconnectionstatechange = handle_ice_connection_state_change;
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
    switch (peer_connection.iceConnectionState) {
        case 'closed':
        case 'failed':
            stop();
            break;
    }
}

function handle_push_answer(sdp){
    var remote_description = new RTCSessionDescription(sdp);
    await peer_connection.setRemoteDescription(remote_description);
}

function handle_new_ice_candidate(sdp) {
    peer_connection.addIceCandidate(sdp.candidate)
}

function stop() {
    if (peer_connection) {
        peer_connection.onnegotiationneeded = null;
        peer_connection.onicecandidate = null;
        peer_connection.oniceconnectionstatechange = null;

        if (local_stream_element.srcObject) {
            local_stream_element.srcObject.getTracks().foreach(track => track.stop());
        }

        peer_connection.close();
        peer_connection = null;
    }
    local_stream_element.removeAttribute('srcObject');
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
            alert('Error opening your camera ' + e.message);
            break;
    }
    stop();
}

socket.on('connected', () => {
    const data = {
        'role': 'pusher', 'room_id': '123'
    };
    socket.emit('join', data);
});

socket.on('ready', () => {
    create_peer_connection();

    navigator.mediaDevices.getUserMedia(media_constraints)
    .then(function(local_stream) {
        local_stream_element.srcObject = local_stream;
        local_stream.getTracks().forEach(track => peer_connection.addTrack(track, local_stream));
    })
    .catch(handle_get_user_media_error);

});

socket.on('peer_left', (data) => {
    stop();
});

socket.on('data', (data) => {
    const type = data.type;
    const sdp = data.sdp;
    switch (type) {
        case 'push_answer':
            hanle_push_answer(sdp);
            break;
        case 'new_ice_candidate':
            handle_new_ice_candidate(sdp);
    }
});
