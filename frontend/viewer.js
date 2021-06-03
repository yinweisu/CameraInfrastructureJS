const SIGNALING_SERVER_URL = 'http://localhost:5000';
const PC_CONFIG = {};
const room_id = '123';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: true });
var peer_connection = null;

var media_constants = {
    video: true,
};

let remote_stream_element = document.querySelector('remote_stream');

function create_peer_connection() {
    if (peer_connection == null) {
        peer_connection = new RTCPeerConnection(PC_CONFIG);
        peer_connection.onicecandidate = handle_icecandidate;
        peer_connection.onaddstream = handle_addstream;
        peer_connection.oniceconnectionstatechange = handle_ice_connection_state_change;
    }
}

function handle_icecandidate(event) {
    if (event.candidate) {
        console.log('Found icecandidate' + event.candidate.candidate);
        data = {
            type: 'new_ice_candidate',
            candidate: event.candidate
        };
        socket.emit('data', data);
    }
}

function handle_addstream(event) {
    console.log('Add stream');
    remote_stream_element.srcObject = event.stream;
}

function handle_ice_connection_state_change(event) {
    switch (peer_connection.iceConnectionState) {
        case 'closed':
        case 'failed':
            stop();
            break;
    }
}

function handle_push_offer(sdp){
    var remote_stream = null;

    var remote_description = new RTCSessionDescription(sdp);
    peer_connection.setRemoteDescription(remote_description).then(function() {
        return peer_connection.createAnswer();
    }).then(function() {
        return peer_connection.setLocalDescription(answer);
    }).then(function() {
        data = {
            type: 'push_answer',
            sdp: peer_connection.localDescription
        };
        socket.emit('data', data);
    })
}

function handle_new_ice_candidate(sdp) {
    peer_connection.addIceCandidate(sdp.candidate)
}

function stop() {
    if (peer_connection) {
        peer_connection.onicecandidate = null;
        peer_connection.onaddstream = null;
        peer_connection.oniceconnectionstatechange = null;

        if (remote_stream_element.srcObject) {
            remote_stream_element.srcObject.getTracks().foreach(track => track.stop());
        }

        peer_connection.close();
        peer_connection = null;
    }
    remote_stream_element.removeAttribute('srcObject');
}

socket.on('connected', () => {
    data = {'role': 'viewer', 'room_id': '123'};
    socket.emit('join', data);
});

socket.on('ready', () => {
    create_peer_connection();
});

socket.on('peer_left', (data) => {
    stop();
});

socket.on('data', (data) => {
    const type = data.type;
    const sdp = data.sdp;
    switch (type) {
        case 'push_offer':
            hanle_push_offer(sdp);
            break;
        case 'new_ice_candidate':
            handle_new_ice_candidate(sdp);
    }
});
