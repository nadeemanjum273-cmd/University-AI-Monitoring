import os
import sys
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from ultralytics import YOLO


class ClassroomAnalyzer:
    """
    YOLOv8 Classroom AI Video Analytics Pipeline.
    
    Capabilities:
    - Person detection in high-density classroom environments.
    - Polygon Zone Spatial Partitioning:
        * Zone 1: Teacher Podium / Whiteboard Area.
        * Zone 2: Student Seating Rows.
    - Active Teaching Time tracking via point-in-polygon classification.
    - Real-time student headcount and average density estimation.
    - Transparent overlay visualization and video writing.
    - Representative frame snapshot extraction.
    """

    # Default Normalized Polygon Coordinates (0.0 to 1.0)
    # Tuned for standard classroom perspectives (e.g. class_3b)
    DEFAULT_ZONE_TEACHER = [
        (0.08, 0.08),
        (0.92, 0.08),
        (0.92, 0.42),
        (0.08, 0.42),
    ]

    DEFAULT_ZONE_STUDENTS = [
        (0.05, 0.44),
        (0.95, 0.44),
        (0.95, 0.95),
        (0.05, 0.95),
    ]

    def __init__(
        self,
        model_name: str = "yolov8n.pt",
        zone_teacher: Optional[List[Tuple[float, float]]] = None,
        zone_students: Optional[List[Tuple[float, float]]] = None,
        conf_threshold: float = 0.30,
        frame_stride: int = 3,
    ):
        """
        Initializes the YOLOv8 model and classroom spatial zones.

        :param model_name: YOLO model weight file ('yolov8n.pt' for fast CPU/edge inference)
        :param zone_teacher: List of (x, y) coordinates for Teacher Podium/Whiteboard
        :param zone_students: List of (x, y) coordinates for Student Seating Rows
        :param conf_threshold: Detection confidence cutoff
        :param frame_stride: Analyze every Nth frame for performance optimization
        """
        self.conf_threshold = conf_threshold
        self.frame_stride = max(1, frame_stride)
        self.norm_zone_teacher = zone_teacher or self.DEFAULT_ZONE_TEACHER
        self.norm_zone_students = zone_students or self.DEFAULT_ZONE_STUDENTS

        print(f"🤖 [ClassroomAnalyzer] Initializing YOLOv8 model: '{model_name}'...")
        try:
            self.model = YOLO(model_name)
            print(f"✅ [ClassroomAnalyzer] YOLOv8 model loaded successfully.")
        except Exception as exc:
            print(f"❌ [ClassroomAnalyzer] Failed to load YOLO model '{model_name}': {exc}", file=sys.stderr)
            raise exc

    def _scale_zone(
        self, norm_zone: List[Tuple[float, float]], width: int, height: int
    ) -> np.ndarray:
        """Scales normalized (0-1) coordinates to absolute pixel points."""
        pts = [[int(x * width), int(y * height)] for x, y in norm_zone]
        return np.array(pts, dtype=np.int32)

    def process_video(
        self,
        input_video_path: str,
        output_video_path: str,
        snapshot_output_path: str,
    ) -> Dict[str, Any]:
        """
        Processes the input video file, runs inference, draws annotations,
        writes the output MP4 and extracts a representative snapshot.

        :param input_video_path: Local path to source MP4 video
        :param output_video_path: Destination path for annotated MP4 video
        :param snapshot_output_path: Destination path for representative JPG snapshot
        :return: Analytics summary dictionary
        """
        if not os.path.exists(input_video_path):
            raise FileNotFoundError(f"Input video not found: {input_video_path}")

        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video file: {input_video_path}")

        # Extract video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        print(
            f"📹 [ClassroomAnalyzer] Processing: {os.path.basename(input_video_path)} "
            f"({width}x{height} @ {fps:.1f} FPS, {total_frames} total frames, stride={self.frame_stride})"
        )

        # Scale spatial polygon zones to frame resolution
        poly_teacher = self._scale_zone(self.norm_zone_teacher, width, height)
        poly_students = self._scale_zone(self.norm_zone_students, width, height)

        # Setup VideoWriter (try mp4v codec for broad cross-platform compatibility)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        # VideoWriter runs at original FPS
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        if not out.isOpened():
            # Fallback codec
            fourcc = cv2.VideoWriter_fourcc(*"XVID")
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        # Metrics accumulators
        frame_idx = 0
        analyzed_frames_count = 0
        active_teaching_frames = 0
        student_counts_per_frame: List[int] = []
        max_students_seen = 0

        best_snapshot_frame: Optional[np.ndarray] = None
        best_snapshot_score = -1

        last_annotated_frame: Optional[np.ndarray] = None

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            frame_idx += 1
            should_analyze = (frame_idx % self.frame_stride == 0) or (frame_idx == 1)

            if should_analyze:
                analyzed_frames_count += 1

                # 1. Run YOLO inference filtered for Person (class 0)
                results = self.model(
                    frame,
                    classes=[0],  # Person class only
                    conf=self.conf_threshold,
                    verbose=False,
                )

                boxes = results[0].boxes if len(results) > 0 else []

                teacher_detected = False
                current_students_count = 0
                detected_persons_info = []

                # 2. Classify each detected person into Zone 1 (Teacher) or Zone 2 (Students)
                if boxes is not None and len(boxes) > 0:
                    for box in boxes:
                        xyxy = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0].cpu().numpy())
                        x1, y1, x2, y2 = map(int, xyxy)

                        # Anchor point: bottom-center (where person stands on floor)
                        bottom_center = (float((x1 + x2) // 2), float(y2))

                        in_teacher_zone = cv2.pointPolygonTest(poly_teacher, bottom_center, False) >= 0
                        in_student_zone = cv2.pointPolygonTest(poly_students, bottom_center, False) >= 0

                        if in_teacher_zone:
                            teacher_detected = True
                            label_type = "teacher"
                        elif in_student_zone:
                            current_students_count += 1
                            label_type = "student"
                        else:
                            label_type = "unassigned"

                        detected_persons_info.append({
                            "bbox": (x1, y1, x2, y2),
                            "conf": conf,
                            "type": label_type,
                        })

                if teacher_detected:
                    active_teaching_frames += 1

                student_counts_per_frame.append(current_students_count)
                if current_students_count > max_students_seen:
                    max_students_seen = current_students_count

                # 3. Draw Annotations on Frame
                annotated = frame.copy()

                # Transparent Polygon Overlays
                overlay = annotated.copy()
                # Zone 1: Teacher Podium (Amber / Orange hue: BGR [0, 165, 255])
                cv2.fillPoly(overlay, [poly_teacher], (0, 140, 255))
                # Zone 2: Student Rows (Blue / Cyan hue: BGR [255, 180, 0])
                cv2.fillPoly(overlay, [poly_students], (255, 180, 0))
                # Alpha blend overlay (25% opacity)
                cv2.addWeighted(overlay, 0.22, annotated, 0.78, 0, annotated)

                # Draw Zone Boundaries and Labels
                cv2.polylines(annotated, [poly_teacher], True, (0, 165, 255), 2, cv2.LINE_AA)
                cv2.polylines(annotated, [poly_students], True, (255, 200, 0), 2, cv2.LINE_AA)

                # Zone Name Tags
                cv2.putText(
                    annotated,
                    "ZONE 1: TEACHER PODIUM / WHITEBOARD",
                    (poly_teacher[0][0] + 10, poly_teacher[0][1] + 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 215, 255),
                    2,
                    cv2.LINE_AA,
                )
                cv2.putText(
                    annotated,
                    "ZONE 2: STUDENT SEATING AREA",
                    (poly_students[0][0] + 10, poly_students[0][1] + 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 230, 100),
                    2,
                    cv2.LINE_AA,
                )

                # Draw Bounding Boxes
                for p in detected_persons_info:
                    x1, y1, x2, y2 = p["bbox"]
                    conf = p["conf"]
                    ptype = p["type"]

                    if ptype == "teacher":
                        color = (0, 165, 255)  # Amber
                        label = f"Teacher {conf:.2f}"
                    elif ptype == "student":
                        color = (255, 200, 0)  # Cyan/Blue
                        label = f"Student {conf:.2f}"
                    else:
                        color = (180, 180, 180)
                        label = f"Person {conf:.2f}"

                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)

                    # Label tag pill
                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    cv2.rectangle(
                        annotated,
                        (x1, y1 - th - 6),
                        (x1 + tw + 6, y1),
                        color,
                        -1,
                    )
                    cv2.putText(
                        annotated,
                        label,
                        (x1 + 3, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.45,
                        (0, 0, 0),
                        1,
                        cv2.LINE_AA,
                    )

                # 4. Top Telemetry HUD Banner
                banner_height = 55
                banner_overlay = annotated[0:banner_height, 0:width].copy()
                cv2.rectangle(banner_overlay, (0, 0), (width, banner_height), (15, 23, 42), -1)
                cv2.addWeighted(banner_overlay, 0.85, annotated[0:banner_height, 0:width], 0.15, 0, annotated[0:banner_height, 0:width])
                cv2.line(annotated, (0, banner_height), (width, banner_height), (51, 65, 85), 1)

                # Title
                cv2.putText(
                    annotated,
                    "CAMPUS AI SURVEILLANCE  |  CLASSROOM 3B",
                    (20, 24),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (226, 232, 240),
                    2,
                    cv2.LINE_AA,
                )

                # Status: Teacher Active / Inactive
                teacher_status_str = "TEACHER: ACTIVE" if teacher_detected else "TEACHER: INACTIVE"
                teacher_color = (74, 222, 128) if teacher_detected else (96, 96, 248)  # Green vs Red
                cv2.putText(
                    annotated,
                    teacher_status_str,
                    (20, 46),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    teacher_color,
                    2,
                    cv2.LINE_AA,
                )

                # Status: Students Count
                students_str = f"STUDENTS IN SEATS: {current_students_count}"
                cv2.putText(
                    annotated,
                    students_str,
                    (240, 46),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (250, 204, 21),
                    2,
                    cv2.LINE_AA,
                )

                # Frame / Progress Counter
                progress_pct = int((frame_idx / max(1, total_frames)) * 100)
                meta_str = f"FRAME: {frame_idx}/{total_frames} ({progress_pct}%)"
                cv2.putText(
                    annotated,
                    meta_str,
                    (width - 240, 36),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (148, 163, 184),
                    1,
                    cv2.LINE_AA,
                )

                last_annotated_frame = annotated

                # Select best frame for representative snapshot (prioritize frames with teacher + students)
                frame_score = (2 if teacher_detected else 0) + current_students_count
                if frame_score > best_snapshot_score:
                    best_snapshot_score = frame_score
                    best_snapshot_frame = annotated.copy()

            # Write annotated frame to output video stream
            out.write(last_annotated_frame if last_annotated_frame is not None else frame)

        # Release video handles
        cap.release()
        out.release()

        # 5. Save Representative Snapshot Image
        if best_snapshot_frame is None:
            best_snapshot_frame = last_annotated_frame if last_annotated_frame is not None else np.zeros((height, width, 3), dtype=np.uint8)

        cv2.imwrite(snapshot_output_path, best_snapshot_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print(f"📸 [ClassroomAnalyzer] Representative snapshot written: {snapshot_output_path}")

        # 6. Compute Final Aggregate Analytics
        total_video_duration_sec = total_frames / fps if fps > 0 else 0.0

        if analyzed_frames_count > 0:
            avg_students = round(sum(student_counts_per_frame) / analyzed_frames_count, 1)
            # Duration teacher was active = (active frames * stride) / fps
            effective_teaching_sec = round((active_teaching_frames * self.frame_stride) / fps, 1)
            active_teaching_pct = round((active_teaching_frames / analyzed_frames_count) * 100, 1)
        else:
            avg_students = 0.0
            effective_teaching_sec = 0.0
            active_teaching_pct = 0.0

        results_summary = {
            "average_students": avg_students,
            "max_students": max_students_seen,
            "teaching_duration_seconds": effective_teaching_sec,
            "active_teaching_percentage": active_teaching_pct,
            "total_video_duration_seconds": round(total_video_duration_sec, 1),
            "total_frames": total_frames,
            "processed_frames": analyzed_frames_count,
            "fps": round(fps, 2),
            "model_version": "YOLOv8n",
            "zones_configured": {
                "zone_1_teacher": "podium_whiteboard",
                "zone_2_students": "seating_rows",
            },
            "status": "completed",
        }

        print(
            f"📊 [ClassroomAnalyzer Complete] Avg Students: {avg_students} | "
            f"Active Teaching Time: {effective_teaching_sec}s ({active_teaching_pct}%) | "
            f"Frames Analyzed: {analyzed_frames_count}/{total_frames}"
        )

        return results_summary

