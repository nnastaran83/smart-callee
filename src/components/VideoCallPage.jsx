import React from "react";
import DropdownMenu from "./themed_components/DropdownMenu.jsx";
import { Box, Grid } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { db } from "../firebase_module";
import "../styles/VideoCallPage.css";

import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { store } from "../store/index.js";
import { useSelector } from "react-redux";

/**
 * Video Calling Page using WebRTC
 * @returns {JSX.Element}
 * @constructor
 */
function VideoCallPage() {
  const webcamButton = useRef(null);
  const webcamVideo = useRef(null);
  const callButton = useRef(null);
  const callInput = useRef(null);
  const answerButton = useRef(null);
  const remoteVideo = useRef(null);
  const hangupButton = useRef(null);
  const [callButtonIsEnabled, setCallButtonIsEnabled] = useState(false);
  const [answerButtonIsEnabled, setAnswerButtonIsEnabled] = useState(false);
  const [webcamButtonIsEnabled, setWebcamButtonIsEnabled] = useState(true);
  const [hangupButtonIsEnabled, setHangupButtonIsEnabled] = useState(false);
  const [callInputValue, setCallInputValue] = useState("");
  const currentUser = useSelector((state) => state.login.user);

  let localStream = null;
  let remoteStream = null;

  // server config
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ], // free stun server
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const [pc, setPc] = useState(new RTCPeerConnection(servers));

  useEffect(() => {
    console.log("Peer Connection Created");
  }, []);

  /**
   * Handles the click event of the webcam button
   * @returns {Promise<void>}
   */
  const handleWebcamButtonClick = async () => {
    console.log("Webcam Button Clicked");
    // setting local stream to the video from our camera

    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Pushing tracks from local stream to peerConnection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // displaying the video data from the stream to the webpage
    webcamVideo.current.srcObject = localStream;

    // initalizing the remote server to the mediastream
    remoteStream = new MediaStream();
    // pc.addEventListener("track", async (event) => {
    //   const [remoteStream] = event.streams;
    //   remoteVideo.current.srcObject = remoteStream;
    // });
    remoteVideo.current.srcObject = remoteStream;

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        console.log("Adding track to remoteStream", track);
        remoteStream.addTrack(track);
      });
      remoteVideo.current.srcObject = remoteStream;
    };

    // enabling and disabling interface based on the current condition
    setCallButtonIsEnabled(true);
    setAnswerButtonIsEnabled(true);
    setWebcamButtonIsEnabled(false);
  };

  const handleAnswerButtonClick = async () => {
    const callId = currentUser.uid;

    // getting the data for this particular call
    const callDoc = doc(collection(db, "calls"), callId);
    const answerCandidates = collection(callDoc, "answerCandidates");
    const offerCandidates = collection(callDoc, "offerCandidates");

    // here we listen to the changes and add it to the answerCandidates
    pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const callData = (await getDoc(callDoc)).data();

    // setting the remote video with offerDescription
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    // setting the local video as the answer
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(new RTCSessionDescription(answerDescription));

    // answer config
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
    setHangupButtonIsEnabled(true);
  };

  return (
    <Box>
      <DropdownMenu />
      <Grid container>
        <Grid item xs={12} md={6} lg={6} sx={{ textAlign: "center" }}>
          <div className={"videos"}>
            <h3 style={{ backgroundColor: "red" }}>Local Stream</h3>
            <video
              id="webcamVideo"
              autoPlay
              playsInline
              ref={webcamVideo}
            ></video>
          </div>
        </Grid>
        <Grid item xs={12} md={6} lg={6} sx={{ textAlign: "center" }}>
          <div className="videos">
            <h3>Remote Stream</h3>
            <video
              id="remoteVideo"
              autoPlay
              playsInline
              ref={remoteVideo}
            ></video>
          </div>
        </Grid>
        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <button
            id="webcamButton"
            onClick={handleWebcamButtonClick}
            ref={webcamButton}
            disabled={!webcamButtonIsEnabled}
          >
            {" "}
            Start webcam
          </button>
        </Grid>

        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <div>
            <h2>3. Join a Call</h2>
            <p>Answer the call from a different browser window or device</p>

            <input
              id="callInput"
              ref={callInput}
              defaultValue={callInputValue}
            />
            <button
              id="answerButton"
              onClick={handleAnswerButtonClick}
              disabled={!answerButtonIsEnabled}
              ref={answerButton}
            >
              Answer
            </button>

            <h2>4. Hangup</h2>

            <button
              id="hangupButton"
              disabled={!hangupButtonIsEnabled}
              ref={hangupButton}
            >
              Hangup
            </button>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
}

export default VideoCallPage;
