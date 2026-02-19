import asyncio
import json
import cv2
import websockets
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import PoseLandmarkerOptions, RunningMode
import urllib.request
import os

# ─────────────────────────────────────────────────────────────
#  Download model if not present
# ─────────────────────────────────────────────────────────────
MODEL_PATH = "pose_landmarker_full.task"
MODEL_URL  = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"

if not os.path.exists(MODEL_PATH):
    print("📥 Downloading MediaPipe pose model (~5MB)...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("✅ Model downloaded!")

# ─────────────────────────────────────────────────────────────
#  Game state
# ─────────────────────────────────────────────────────────────
state = {
    "isSquatting": False,
    "squatCount":  0,
    "xp":          0,
    "feedback":    "STAND TALL — READY",
    "hipY":        0.0,
    "kneeY":       0.0,
    "depth":       0.0,
}

SQUAT_THRESHOLD = 0.15   # hip close to knee  →  squatting
RISE_THRESHOLD  = 0.22   # hip far from knee  →  standing

# Latest landmarks from async callback
latest_landmarks = None

# ─────────────────────────────────────────────────────────────
#  MediaPipe LIVE_STREAM callback
# ─────────────────────────────────────────────────────────────
def on_result(result, output_image, timestamp_ms):
    global latest_landmarks
    if result and result.pose_landmarks:
        latest_landmarks = result.pose_landmarks[0]

# ─────────────────────────────────────────────────────────────
#  Build landmarker
# ─────────────────────────────────────────────────────────────
options = PoseLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=RunningMode.LIVE_STREAM,
    result_callback=on_result,
    min_pose_detection_confidence=0.6,
    min_pose_presence_confidence=0.6,
    min_tracking_confidence=0.6,
)

# ─────────────────────────────────────────────────────────────
#  Draw landmarks on frame (manual, no mp.solutions)
# ─────────────────────────────────────────────────────────────
# Pose connections (index pairs)
POSE_CONNECTIONS = [
    (11,12),(11,13),(13,15),(12,14),(14,16),  # arms
    (11,23),(12,24),(23,24),                   # torso
    (23,25),(25,27),(24,26),(26,28),           # legs
    (27,29),(27,31),(28,30),(28,32),           # feet
]

def draw_skeleton(frame, landmarks, w, h):
    # Draw connections
    for a, b in POSE_CONNECTIONS:
        if a < len(landmarks) and b < len(landmarks):
            lA = landmarks[a]
            lB = landmarks[b]
            if lA.visibility > 0.5 and lB.visibility > 0.5:
                x1, y1 = int(lA.x * w), int(lA.y * h)
                x2, y2 = int(lB.x * w), int(lB.y * h)
                cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 247), 2)
    # Draw joints
    for lm in landmarks:
        if lm.visibility > 0.5:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (cx, cy), 5, (168, 85, 247), -1)
            cv2.circle(frame, (cx, cy), 5, (0, 255, 247), 1)

# ─────────────────────────────────────────────────────────────
#  Process landmarks → update game state
# ─────────────────────────────────────────────────────────────
def process_landmarks(landmarks):
    # 23 = LEFT_HIP, 25 = LEFT_KNEE
    hip_y  = landmarks[23].y
    knee_y = landmarks[25].y
    depth  = abs(hip_y - knee_y)

    state["hipY"]  = round(hip_y,  3)
    state["kneeY"] = round(knee_y, 3)
    state["depth"] = round(depth,  3)

    if depth < SQUAT_THRESHOLD and not state["isSquatting"]:
        state["isSquatting"] = True
        state["feedback"]    = "⚡ CHARGING WEAPON..."

    elif depth > RISE_THRESHOLD and state["isSquatting"]:
        state["isSquatting"]  = False
        state["squatCount"]  += 1
        state["xp"]          += 90
        state["feedback"]     = f"🔥 FIRED! {state['squatCount']} REPS — {state['xp']} XP"

# ─────────────────────────────────────────────────────────────
#  WebSocket handler
# ─────────────────────────────────────────────────────────────
async def handler(websocket):
    global latest_landmarks
    print("✅ React app connected!")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Could not open webcam!")
        return

    timestamp_ms = 0

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                h, w = frame.shape[:2]
                timestamp_ms += 33  # ~30fps

                # Convert to MediaPipe image and detect
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image  = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame
                )
                landmarker.detect_async(mp_image, timestamp_ms)

                # Draw skeleton if landmarks available
                if latest_landmarks:
                    draw_skeleton(frame, latest_landmarks, w, h)
                    process_landmarks(latest_landmarks)

                # Overlay feedback text
                cv2.rectangle(frame, (0, 0), (w, 36), (5, 5, 20), -1)
                cv2.putText(
                    frame,
                    f"REPS: {state['squatCount']}  XP: {state['xp']}  {state['feedback']}",
                    (10, 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                    (0, 255, 247), 1, cv2.LINE_AA
                )

                cv2.imshow("KinetiCore — Pose Detection  (press Q to quit)", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

                # Send state to React
                await websocket.send(json.dumps(state))
                await asyncio.sleep(0.033)

        except websockets.exceptions.ConnectionClosedOK:
            print("ℹ️  React app disconnected.")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print("📷 Camera released.")

# ─────────────────────────────────────────────────────────────
#  Start server
# ─────────────────────────────────────────────────────────────
async def main():
    print("🚀 KinetiCore Pose Server starting...")
    print("   WebSocket: ws://localhost:8765")
    print("   Open your React app, then stand in front of the webcam!")
    print("   Press Q in the webcam window to stop.\n")
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()

asyncio.run(main())