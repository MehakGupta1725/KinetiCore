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
    # Gravity Well (squats)
    "isSquatting": False,
    "squatCount":  0,
    "xp":          0,
    "feedback":    "STAND TALL — READY",
    "hipY":        0.5,
    "kneeY":       0.7,
    "depth":       0.2,

    # Neon Slicer (hand positions)
    "leftHand":  {"x": 0.25, "y": 0.5, "visible": False},
    "rightHand": {"x": 0.75, "y": 0.5, "visible": False},

    # Shared
    "totalSliced": 0,
}

SQUAT_THRESHOLD = 0.15
RISE_THRESHOLD  = 0.22

latest_landmarks = None

# ─────────────────────────────────────────────────────────────
#  MediaPipe LIVE_STREAM callback
# ─────────────────────────────────────────────────────────────
def on_result(result, output_image, timestamp_ms):
    global latest_landmarks
    if result and result.pose_landmarks:
        latest_landmarks = result.pose_landmarks[0]

# ─────────────────────────────────────────────────────────────
#  Build landmarker options
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
#  Skeleton drawing
# ─────────────────────────────────────────────────────────────
POSE_CONNECTIONS = [
    (11,12),(11,13),(13,15),(12,14),(14,16),
    (11,23),(12,24),(23,24),
    (23,25),(25,27),(24,26),(26,28),
    (27,29),(27,31),(28,30),(28,32),
]

def draw_skeleton(frame, landmarks, w, h):
    for a, b in POSE_CONNECTIONS:
        if a < len(landmarks) and b < len(landmarks):
            lA, lB = landmarks[a], landmarks[b]
            if lA.visibility > 0.5 and lB.visibility > 0.5:
                x1, y1 = int(lA.x * w), int(lA.y * h)
                x2, y2 = int(lB.x * w), int(lB.y * h)
                cv2.line(frame, (x1,y1), (x2,y2), (0,255,247), 2)
    for lm in landmarks:
        if lm.visibility > 0.5:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (cx,cy), 5, (168,85,247), -1)
            cv2.circle(frame, (cx,cy), 5, (0,255,247), 1)

    # Highlight hands with bigger circles
    # 15 = LEFT_WRIST, 16 = RIGHT_WRIST
    for idx, color in [(15, (255,0,170)), (16, (0,255,100))]:
        lm = landmarks[idx]
        if lm.visibility > 0.4:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (cx,cy), 14, color, 2)
            cv2.circle(frame, (cx,cy), 4,  color, -1)

# ─────────────────────────────────────────────────────────────
#  Process landmarks → squat + hand positions
# ─────────────────────────────────────────────────────────────
def process_landmarks(landmarks):
    # ── Squat detection (Gravity Well) ──────────────────────
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

    # ── Hand positions (Neon Slicer) ─────────────────────────
    # 15 = LEFT_WRIST, 16 = RIGHT_WRIST
    lw = landmarks[15]
    rw = landmarks[16]

    state["leftHand"]  = {
        "x":       round(1 - lw.x, 3),   # mirror for selfie view
        "y":       round(lw.y,     3),
        "visible": lw.visibility > 0.4,
    }
    state["rightHand"] = {
        "x":       round(1 - rw.x, 3),   # mirror for selfie view
        "y":       round(rw.y,     3),
        "visible": rw.visibility > 0.4,
    }

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

                h, w   = frame.shape[:2]
                timestamp_ms += 33

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image  = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame
                )
                landmarker.detect_async(mp_image, timestamp_ms)

                if latest_landmarks:
                    draw_skeleton(frame, latest_landmarks, w, h)
                    process_landmarks(latest_landmarks)

                # HUD overlay
                cv2.rectangle(frame, (0,0), (w,38), (5,5,20), -1)
                lh = state["leftHand"]
                rh = state["rightHand"]
                cv2.putText(
                    frame,
                    f"SQUATS:{state['squatCount']}  XP:{state['xp']}  "
                    f"L({lh['x']:.2f},{lh['y']:.2f})  R({rh['x']:.2f},{rh['y']:.2f})",
                    (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (0,255,247), 1, cv2.LINE_AA
                )

                cv2.imshow("KinetiCore — Pose Detection  (Q to quit)", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

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
    print("🚀 KinetiCore Pose Server v2 starting...")
    print("   WebSocket : ws://localhost:8765")
    print("   Tracking  : Squats (Gravity Well) + Hands (Neon Slicer)")
    print("   Press Q in the webcam window to stop.\n")
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()

asyncio.run(main())