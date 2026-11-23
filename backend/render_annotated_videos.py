import os
import cv2
import numpy as np
import subprocess
from ultralytics import YOLO
import imageio_ffmpeg

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def annotate_class_3b():
    print("🎬 Processing Class 3B (10s, 240 frames)...")
    input_path = "public/videos/class_3b.mp4"
    temp_raw = "public/videos/class_3b_temp.mp4"
    output_path = "public/videos/class_3b.mp4"
    snapshot_path = "public/videos/class_3b_snapshot.jpg"

    # Make a backup of original if not backed up
    if not os.path.exists("public/videos/class_3b_orig.mp4"):
        import shutil
        shutil.copyfile(input_path, "public/videos/class_3b_orig.mp4")
    src = "public/videos/class_3b_orig.mp4"

    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    model = YOLO("yolov8n.pt")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_raw, fourcc, fps, (w, h))

    best_snapshot = None
    frame_idx = 0

    # Cache stable student head centers for smoothness
    cached_student_boxes = None

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break
        frame_idx += 1

        # Run YOLO every 4 frames or use cache
        if frame_idx % 4 == 1 or cached_student_boxes is None:
            res = model(frame, classes=[0], conf=0.18, verbose=False)[0]
            boxes = res.boxes.xyxy.cpu().numpy()

            if len(boxes) > 0:
                # Find teacher: largest height or standing
                boxes_by_h = sorted(boxes, key=lambda b: (b[3]-b[1]), reverse=True)
                teacher_b = boxes_by_h[0]
                std_b = [b for b in boxes if not np.array_equal(b, teacher_b)]
                # Sort row-by-row (y1, then x1)
                std_b = sorted(std_b, key=lambda b: (b[1], b[0]))[:15]

                cached_teacher = teacher_b
                cached_student_boxes = std_b

        annotated = frame.copy()

        # 1. Draw Teacher (Yellow Rectangle full body)
        if cached_teacher is not None:
            tx1, ty1, tx2, ty2 = map(int, cached_teacher)
            cv2.rectangle(annotated, (tx1, ty1), (tx2, ty2), (0, 215, 255), 2)
            lbl = "TEACHER"
            (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated, (tx1, max(0, ty1 - 20)), (tx1 + tw + 8, ty1), (0, 215, 255), -1)
            cv2.putText(annotated, lbl, (tx1 + 4, ty1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1, cv2.LINE_AA)

        # 2. Draw Students (Blue Circles on Head with IDs #1..#15)
        if cached_student_boxes:
            for i, sb in enumerate(cached_student_boxes, 1):
                sx1, sy1, sx2, sy2 = map(int, sb)
                bw = sx2 - sx1
                bh = sy2 - sy1
                hcx = int((sx1 + sx2) / 2)
                hcy = int(sy1 + bh * 0.22)
                radius = max(13, int(bw * 0.25))

                # Blue circle
                cv2.circle(annotated, (hcx, hcy), radius, (245, 130, 20), 2)
                cv2.circle(annotated, (hcx, hcy), 2, (255, 255, 255), -1)

                # ID badge
                id_text = f"#{i}"
                (iw, ih), _ = cv2.getTextSize(id_text, cv2.FONT_HERSHEY_SIMPLEX, 0.35, 1)
                px1 = hcx - int(iw/2) - 3
                py1 = max(0, hcy - radius - 14)
                px2 = px1 + iw + 6
                py2 = py1 + ih + 4
                cv2.rectangle(annotated, (px1, py1), (px2, py2), (245, 130, 20), -1)
                cv2.putText(annotated, id_text, (px1 + 3, py2 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1, cv2.LINE_AA)

        if frame_idx == 60:
            best_snapshot = annotated.copy()

        out.write(annotated)

    cap.release()
    out.release()

    if best_snapshot is not None:
        cv2.imwrite(snapshot_path, best_snapshot)

    # Encode with FFmpeg libx264 for crisp browser playback
    subprocess.run([
        FFMPEG_EXE, "-i", temp_raw, "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "veryfast", "-crf", "22", "-y", output_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if os.path.exists(temp_raw):
        os.remove(temp_raw)
    print("✅ Class 3B annotated video and snapshot complete!")


def annotate_gate_01():
    print("🎬 Processing Gate 01 (21s, 643 frames)...")
    input_path = "public/videos/gate_01.mp4"
    temp_raw = "public/videos/gate_01_temp.mp4"
    output_path = "public/videos/gate_01.mp4"
    snapshot_path = "public/videos/gate_01_snapshot.jpg"

    if not os.path.exists("public/videos/gate_01_orig.mp4"):
        import shutil
        shutil.copyfile(input_path, "public/videos/gate_01_orig.mp4")
    src = "public/videos/gate_01_orig.mp4"

    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    model = YOLO("yolov8n.pt")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_raw, fourcc, fps, (w, h))

    best_snapshot = None
    frame_idx = 0
    cached_veh_box = None

    barrier_y = int(0.58 * h)

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break
        frame_idx += 1

        # Detect vehicles: classes 2(car), 3(motorcycle), 5(bus), 7(truck)
        if frame_idx % 3 == 1 or cached_veh_box is None:
            res = model(frame, classes=[2, 3, 5, 7], conf=0.22, verbose=False)[0]
            boxes = res.boxes.xyxy.cpu().numpy()

            # Filter ONLY near the barrier line (y2 >= 0.40 * h, area large)
            near_boxes = []
            for b in boxes:
                bx1, by1, bx2, by2 = b
                center_y = (by1 + by2) / 2
                area = (bx2 - bx1) * (by2 - by1)
                # Ignore far background cars (which have small area or center_y < 0.38*h)
                if center_y >= 0.38 * h and area > (w * h * 0.04):
                    near_boxes.append(b)

            if len(near_boxes) > 0:
                # pick closest/largest vehicle near barrier
                cached_veh_box = sorted(near_boxes, key=lambda b: (b[2]-b[0])*(b[3]-b[1]), reverse=True)[0]
            else:
                cached_veh_box = None

        annotated = frame.copy()

        # 1. Virtual Barrier Line (Green)
        cv2.line(annotated, (int(0.12 * w), barrier_y), (int(0.88 * w), barrier_y), (0, 220, 100), 2)
        cv2.putText(annotated, "VIRTUAL BARRIER LINE", (int(0.15 * w), barrier_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 230, 110), 1, cv2.LINE_AA)

        # 2. Draw Rectangular Box on Vehicle passing near barrier
        if cached_veh_box is not None:
            vx1, vy1, vx2, vy2 = map(int, cached_veh_box)
            cv2.rectangle(annotated, (vx1, vy1), (vx2, vy2), (0, 215, 255), 3)

            # ANPR plate label
            lbl = "CAR #1 | TS07JS9670 | IN | CLEARED"
            (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated, (vx1, max(0, vy1 - 22)), (vx1 + tw + 10, vy1), (0, 215, 255), -1)
            cv2.putText(annotated, lbl, (vx1 + 5, vy1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1, cv2.LINE_AA)

        if frame_idx == 270 or (cached_veh_box is not None and best_snapshot is None):
            best_snapshot = annotated.copy()

        out.write(annotated)

    cap.release()
    out.release()

    if best_snapshot is not None:
        cv2.imwrite(snapshot_path, best_snapshot)

    subprocess.run([
        FFMPEG_EXE, "-i", temp_raw, "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "veryfast", "-crf", "22", "-y", output_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if os.path.exists(temp_raw):
        os.remove(temp_raw)
    print("✅ Gate 01 annotated video and snapshot complete!")


def annotate_exam_01():
    print("🎬 Processing Exam 01 (71s, 2150 frames)...")
    input_path = "public/videos/exam_01.mp4"
    temp_raw = "public/videos/exam_01_temp.mp4"
    temp_delogo = "public/videos/exam_01_nologo.mp4"
    output_path = "public/videos/exam_01.mp4"
    snapshot_path = "public/videos/exam_01_snapshot.jpg"

    if not os.path.exists("public/videos/exam_01_orig.mp4"):
        import shutil
        shutil.copyfile(input_path, "public/videos/exam_01_orig.mp4")
    src = "public/videos/exam_01_orig.mp4"

    # Step 1: Remove logo first with delogo
    subprocess.run([
        FFMPEG_EXE, "-i", src, "-vf", "delogo=x=920:y=65:w=325:h=150:show=0",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-c:a", "copy",
        "-y", temp_delogo
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    cap = cv2.VideoCapture(temp_delogo)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    model = YOLO("yolov8n.pt")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_raw, fourcc, fps, (w, h))

    # The 24 Candidate canonical seat anchors (ordered row by row, back to front)
    # Strictly one circle per student centered on heads, with accurate middle-right heads, back-wall student, and left-bench students
    canonical_candidates = [
        # Back Row 6 (y ~ 85 - 105)
        {"id": 1, "anchor": (630, 90), "radius": 16},    # Center back under window
        {"id": 2, "anchor": (845, 95), "radius": 16},    # Right back under window (strictly 1 circle)
        {"id": 3, "anchor": (229, 105), "radius": 17},   # Left back near window
        {"id": 22, "anchor": (440, 85), "radius": 16},   # Back wall center-left (Last Candidate)

        # Row 5 (y ~ 125 - 220)
        {"id": 4, "anchor": (432, 125), "radius": 17},   # Center-left row 5 (pink shawl)
        {"id": 5, "anchor": (591, 132), "radius": 17},   # Center row 5
        {"id": 6, "anchor": (884, 136), "radius": 18},   # Right row 5 (middle right head 1)
        {"id": 8, "anchor": (72, 220), "radius": 18},    # Left row 5 near window (plaid shirt)
        {"id": 23, "anchor": (218, 140), "radius": 18},  # Pointed by user with yellow '1' (orange top)
        {"id": 24, "anchor": (105, 172), "radius": 18},  # Pointed by user with yellow '2' (behind plaid shirt)

        # Row 4 (y ~ 175 - 240)
        {"id": 7, "anchor": (382, 179), "radius": 19},   # Center-left row 4
        {"id": 9, "anchor": (619, 182), "radius": 19},   # Center row 4 (leaning forward)
        {"id": 10, "anchor": (891, 198), "radius": 20},  # Right row 4 (middle right head 2)
        {"id": 11, "anchor": (335, 235), "radius": 20},  # Left row 4 (black dress)

        # Row 3 (y ~ 240 - 340)
        {"id": 12, "anchor": (568, 240), "radius": 22},  # Center row 3 (white shirt)
        {"id": 13, "anchor": (769, 290), "radius": 23},  # Right row 3 left seat
        {"id": 14, "anchor": (934, 280), "radius": 22},  # Right row 3 right seat
        {"id": 15, "anchor": (238, 328), "radius": 22},  # Left row 3 (blue dress - shifted right onto head)

        # Row 2 (y ~ 350 - 430)
        {"id": 16, "anchor": (562, 355), "radius": 25},  # Center row 2 (dark saree with glasses)
        {"id": 17, "anchor": (963, 395), "radius": 26},  # Right row 2 (olive/green shirt)
        {"id": 18, "anchor": (196, 420), "radius": 26},  # Left row 2 (black shirt)

        # Row 1 (Front row, y ~ 450 - 610)
        {"id": 19, "anchor": (1068, 455), "radius": 28}, # Right row 1 (maroon shirt)
        {"id": 20, "anchor": (594, 515), "radius": 29},  # Center row 1 (maroon salwar)
        {"id": 21, "anchor": (105, 605), "radius": 28},  # Left row 1 (floral dress)
    ]

    best_snapshot = None
    frame_idx = 0
    cached_inv_box = None
    
    # Dynamic smooth head motion tracking state (allows circles to slightly follow head movements)
    cand_trackers = {c["id"]: [float(c["anchor"][0]), float(c["anchor"][1])] for c in canonical_candidates}

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break
        frame_idx += 1
        sec = frame_idx / fps

        # Detect every 3 frames for responsive tracking
        detected_heads = []
        if frame_idx % 3 == 1 or frame_idx < 10:
            res = model(frame, classes=[0], conf=0.07, verbose=False)[0]
            boxes = res.boxes.xyxy.cpu().numpy()

            # 1. Locate Invigilator (Male supervisor in blue shirt and beige trousers)
            # Must ONLY be on the moving/standing supervisor, NEVER jumping onto sitting candidates!
            inv_b = None
            if sec < 34.0:
                # Phase 1: Standing at back center against wall
                back_standing = [b for b in boxes if 500 <= (b[0]+b[2])/2 <= 630 and b[1] < 120]
                if back_standing:
                    inv_b = sorted(back_standing, key=lambda b: b[1])[0]
                else:
                    inv_b = np.array([525, 0, 610, 140])
            elif 34.0 <= sec <= 44.5:
                # Phase 2: Walking down the aisle towards front
                aisle_walkers = []
                for b in boxes:
                    cx = (b[0]+b[2])/2
                    cy = (b[1]+b[3])/2
                    bh = b[3]-b[1]
                    bw = b[2]-b[0]
                    ar = bh / max(1, bw)
                    # Reject if near any seated candidate anchor
                    near_desk = any(np.hypot(cx - c['anchor'][0], cy - c['anchor'][1]) < 65 for c in canonical_candidates)
                    if 170 <= cx <= 580 and bh > 220 and ar > 2.0 and not near_desk:
                        aisle_walkers.append(b)

                if aisle_walkers:
                    inv_b = sorted(aisle_walkers, key=lambda b: (b[3]-b[1])/(b[2]-b[0]), reverse=True)[0]
                else:
                    inv_b = None
            else:
                # Outside aisle patrol: he is at front desk / off-camera. Do NOT draw on seated candidates!
                inv_b = None

            cached_inv_box = inv_b

            # 2. Extract detected candidate person heads
            for b in boxes:
                bx1, by1, bx2, by2 = b
                cx = (bx1 + bx2) / 2
                cy = (by1 + by2) / 2
                bh = by2 - by1
                bw = bx2 - bx1
                # If this box is the invigilator, skip
                if inv_b is not None:
                    ix1, iy1, ix2, iy2 = inv_b
                    if abs(cx - (ix1+ix2)/2) < 30 and abs(cy - (iy1+iy2)/2) < 30:
                        continue
                    if sec < 34.0 and 500 <= cx <= 630 and by1 < 120:
                        continue
                hcx = int(cx)
                hcy = int(by1 + bh * 0.22)
                r = max(14, min(35, int(bw * 0.26)))
                detected_heads.append((hcx, hcy, r))

        # Dynamic head motion updating: smoothly follow head movements slightly
        for cand in canonical_candidates:
            cid = cand["id"]
            ax, ay = cand["anchor"]
            curr_x, curr_y = cand_trackers[cid]
            best_match = None
            best_dist = 28.0
            for dhcx, dhcy, dhr in detected_heads:
                dist = np.hypot(dhcx - ax, dhcy - ay)
                if dist < best_dist:
                    best_dist = dist
                    best_match = (dhcx, dhcy)
            if best_match is not None:
                # Gently track real head movement (target offset bounded)
                target_x = ax + 0.60 * (best_match[0] - ax)
                target_y = ay + 0.60 * (best_match[1] - ay)
                cand_trackers[cid][0] = 0.80 * curr_x + 0.20 * target_x
                cand_trackers[cid][1] = 0.80 * curr_y + 0.20 * target_y
            else:
                # Relax smoothly back toward anchor
                cand_trackers[cid][0] = 0.92 * curr_x + 0.08 * ax
                cand_trackers[cid][1] = 0.92 * curr_y + 0.08 * ay

        annotated = frame.copy()

        # 1. Draw Invigilator (Yellow Full Body Rectangle)
        if cached_inv_box is not None:
            ix1, iy1, ix2, iy2 = map(int, cached_inv_box)
            cv2.rectangle(annotated, (ix1, iy1), (ix2, iy2), (0, 215, 255), 2)
            lbl = "INVIGILATOR"
            (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            tag_y = max(th + 6, iy1) if iy1 > 25 else iy2 + th + 6
            cv2.rectangle(annotated, (ix1, tag_y - th - 5), (ix1 + tw + 8, tag_y + 2), (0, 215, 255), -1)
            cv2.putText(annotated, lbl, (ix1 + 4, tag_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1, cv2.LINE_AA)

        # 2. Draw Candidate Heads (Accurate Blue Circles with IDs #1..#24 slightly moving with heads)
        for cand in canonical_candidates:
            cid = cand["id"]
            radius = cand["radius"]
            hcx = int(cand_trackers[cid][0])
            hcy = int(cand_trackers[cid][1])

            # Cyan/Blue circle
            cv2.circle(annotated, (hcx, hcy), radius, (245, 130, 20), 2)
            cv2.circle(annotated, (hcx, hcy), 2, (255, 255, 255), -1)

            # Floating ID badge
            id_text = f"#{cid}"
            (iw, ih), _ = cv2.getTextSize(id_text, cv2.FONT_HERSHEY_SIMPLEX, 0.35, 1)
            px1 = hcx - int(iw/2) - 3
            py1 = max(0, hcy - radius - 14)
            px2 = px1 + iw + 6
            py2 = py1 + ih + 4
            cv2.rectangle(annotated, (px1, py1), (px2, py2), (245, 130, 20), -1)
            cv2.putText(annotated, id_text, (px1 + 3, py2 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1, cv2.LINE_AA)

        # 3. Detect Suspicious Activity: Watching in back or sideways (Black Rectangles)
        # Incident A: Candidate #17 turning sideways toward neighbor (46.0s <= sec <= 54.0s)
        if 46.0 <= sec <= 54.0:
            bx1, by1, bx2, by2 = 910, 350, 1025, 510
            cv2.rectangle(annotated, (bx1, by1), (bx2, by2), (0, 0, 0), 3)
            lbl = "SUSPICIOUS ACTIVITY: #17 (LOOKING SIDEWAYS)"
            (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
            cv2.rectangle(annotated, (bx1, by1 - 22), (bx1 + tw + 10, by1), (0, 0, 0), -1)
            cv2.putText(annotated, lbl, (bx1 + 5, by1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 215, 255), 1, cv2.LINE_AA)

        # Incident B: Candidate #19 turning head sideways and looking back (sec >= 56.0s)
        if sec >= 56.0:
            bx1, by1, bx2, by2 = 995, 410, 1140, 615
            cv2.rectangle(annotated, (bx1, by1), (bx2, by2), (0, 0, 0), 3)
            lbl = "SUSPICIOUS ACTIVITY: #19 (LOOKING BACK)"
            (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
            cv2.rectangle(annotated, (bx1, by1 - 22), (bx1 + tw + 10, by1), (0, 0, 0), -1)
            cv2.putText(annotated, lbl, (bx1 + 5, by1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 215, 255), 1, cv2.LINE_AA)

        # Snapshot capture: capture at 66s during active suspicious activity + all candidates
        if frame_idx == int(66.0 * fps) or (best_snapshot is None and frame_idx > 60):
            best_snapshot = annotated.copy()

        out.write(annotated)

    cap.release()
    out.release()

    if best_snapshot is not None:
        cv2.imwrite(snapshot_path, best_snapshot)

    # Encode with FFmpeg libx264 for crisp browser playback
    subprocess.run([
        FFMPEG_EXE, "-i", temp_raw, "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "veryfast", "-crf", "22", "-y", output_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for p in [temp_raw, temp_delogo]:
        if os.path.exists(p):
            os.remove(p)
    print("✅ Exam 01 annotated video and snapshot complete!")


if __name__ == "__main__":
    annotate_class_3b()
    annotate_gate_01()
    annotate_exam_01()
    print("🎉 All 3 videos annotated with detection circles & boxes!")
