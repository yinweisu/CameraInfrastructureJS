# WebRTC

### Signal Server

* Server provides ways for the caller and callee to communicate. Server does not need to know the content of communication
* communicate process
  1. Pusher and viewer both join the server room
  2. Server norify room ready
  3. Pusher create offer that contains ICE Event(sdp). Send the offer to the viewer through signal server
  4. Viewer receive the offer, create a remote config and an answer. Send the answer to the pusher through signal server
  5. Pusher receive the answer, create a remote config and start streaming

### ICE Negotiation

An ICE candidate describes a method that the sending peer is able to use to communicate. Each peer sends candidates in the order they're discovered, and keeps sending candidates until it runs out of suggestions, even if media has already started streaming.

Once the two peers agree upon a mutually-compatible candidate, that candidate's SDP is used by each peer to construct and open a connection, through which media then begins to flow.

Each side sends candidates to the other as it receives them from their local ICE layer; there is no taking turns or batching of candidates. As soon as the two peers agree upon one candidate that they can both use to exchange the media, media begins to flow. Each peer continues to send candidates until it runs out of options, even after the media has already begun to flow. This is done in hopes of identifying even better options than the one initially selected.