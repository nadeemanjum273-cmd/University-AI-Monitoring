import os
import sys
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any, Optional, Set
from collections import defaultdict, deque
from ultralytics import YOLO


class VehicleAnalyzer:
    """
    YOLOv8 & ByteTrack Vehicle AI Analytics Pipeline for Campus Gate & Parking Monitoring.

    Capabilities:
    - Multi-class vehicle detection: Car (2), Motorcycle (3), Bus (5), Truck (7).
    - Multi-object tracking with ByteTrack to assign consistent IDs across frames.
    - Virtual Entry Line / Barrier crossing detection with temporal deduplication.
    - Dynamic visual feedback: Virtual line illuminates green upon entry event.
    - Trajectory tracking and telemetry overlay banner.
    - Outputs annotated MP4 video and representative gate snapshot.
    """

    # COCO Class IDs for vehicles
    CLASS_CAR = 2
    CLASS_MOTORCYCLE = 3
    CLASS_BUS = 5
    CLASS_TRUCK = 7
    VEHICLE_CLASSES = [CLASS_CAR, CLASS_MOTORCYCLE, CLASS_BUS, CLASS_TRUCK]

    CLASS_NAMES = {
        CLASS_CAR: "Car",
        CLASS_MOTORCYCLE: "Motorcycle",
        CLASS_BUS: "Bus",
        CLASS_TRUCK: "Truck",
    }

    # Default Normalized Virtual Entry Line (x1, y1) -> (x2, y2)
    # Spans across the road horizontally at ~60% frame height for gate barriers
    DEFAULT_ENTRY_LINE = ((0.08, 0.60), (0.92, 0.60))

    # Default Normalized Entry Polygon Zone
    DEFAULT_ENTRY_ZONE = [
        (0.08, 0.52),
        (0.92, 0.52),
        (0.92, 0.72),
        (0.08, 0.72),
    ]

    def __init__(
        self,
        model_name: str = "yolov8n.pt",
        entry_line: Optional[Tuple[Tuple[float, float], Tuple[float, float]]] = None,
        entry_zone: Optional[List[Tuple[float, float]]] = None,
        conf_threshold: float = 0.35,
        iou_threshold: float = 0.5,
    ):
        """
        Initializes the YOLOv8 model with ByteTrack tracking.

        :param model_name: YOLO model weights file
        :param entry_line: Virtual gate barrier line ((x1, y1), (x2, y2))
        :param entry_zone: Optional polygon zone around gate barrier
        :param conf_threshold: Detection confidence cutoff
        :param iou_threshold: NMS IoU threshold
        """
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.norm_line = entry_line or self.DEFAULT_ENTRY_LINE
        self.norm_zone = entry_zone or self.DEFAULT_ENTRY_ZONE

        print(f"🚗 [VehicleAnalyzer] Initializing YOLOv8 model '{model_name}' with ByteTrack...")
        try:
            self.model = YOLO(model_name)
            print("✅ [VehicleAnalyzer] YOLOv8 model loaded successfully.")
        except Exception as exc:
            print(f"❌ [VehicleAnalyzer] Failed to load model '{model_name}': {exc}", file=sys.stderr)
            raise exc

    def _scale_line(
        self, norm_line: Tuple[Tuple[float, float], Tuple[float, float]], width: int, height: int
    ) -> Tuple[Tuple[int, int], Tuple[int, int]]:
        (x1, y1), (x2, y2) = norm_line
        return (int(x1 * width), int(y1 * height)), (int(x2 * width), int(y2 * height))

    def _scale_zone(
        self, norm_zone: List[Tuple[float, float]], width: int, height: int
    ) -> np.ndarray:
        pts = [[int(x * width), int(y * height)] for x, y in norm_zone]
        return np.array(pts, dtype=np.int32)

    @staticmethod
    def _ccw(A: Tuple[float, float], B: Tuple[float, float], C: Tuple[float, float]) -> bool:
        """Determines if three points are in counter-clockwise order."""
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

    @classmethod
    def _intersect(
        cls,
        A: Tuple[float, float],
        B: Tuple[float, float],
        C: Tuple[float, float],
        D: Tuple[float, float],
    ) -> bool:
        """Returns True if line segment AB and line segment CD intersect."""
        return cls._ccw(A, C, D) != cls._ccw(B, C, D) and cls._ccw(A, B, C) != cls._ccw(A, B, D)

    def process_video(
        self,
        input_video_path: str,
        output_video_path: str,
        snapshot_output_path: str,
    ) -> Dict[str, Any]:
        """
        Processes video frames with YOLOv8 & ByteTrack, tracks vehicle entry events,
        renders visual trails & HUD, and writes the output MP4 and JPG snapshot.

        :param input_video_path: Source MP4 video path
        :param output_video_path: Annotated MP4 video destination
        :param snapshot_output_path: JPG snapshot destination
        :return: Vehicle telemetry metrics dictionary
        """
        if not os.path.exists(input_video_path):
            raise FileNotFoundError(f"Input video not found: {input_video_path}")

        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video file: {input_video_path}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        print(
            f"📹 [VehicleAnalyzer] Processing: {os.path.basename(input_video_path)} "
            f"({width}x{height} @ {fps:.1f} FPS, {total_frames} frames)"
        )

        pt1, pt2 = self._scale_line(self.norm_line, width, height)
        poly_zone = self._scale_zone(self.norm_zone, width, height)

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        if not out.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*"XVID")
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        # Tracking state
        counted_ids: Set[int] = set()
        track_history: Dict[int, deque] = defaultdict(lambda: deque(maxlen=24))
        vehicle_type_counts: Dict[str, int] = {
            "cars": 0,
            "motorcycles": 0,
            "buses": 0,
            "trucks": 0,
        }

        best_snapshot_frame: Optional[np.ndarray] = None
        last_entry_frame_idx = -1
        frame_idx = 0
        recent_entry_pulse = 0  # Green highlight countdown for gate line

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            frame_idx += 1
            annotated = frame.copy()

            # 1. Run ByteTrack multi-object tracking via YOLO
            results = self.model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=self.VEHICLE_CLASSES,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                verbose=False,
            )

            current_frame_entry_occurred = False
            active_vehicles_count = 0

            # 2. Parse tracks and detect entry line crossing
            if len(results) > 0 and results[0].boxes is not None and results[0].boxes.id is not None:
                boxes = results[0].boxes.xyxy.cpu().numpy()
                track_ids = results[0].boxes.id.int().cpu().numpy()
                class_ids = results[0].boxes.cls.int().cpu().numpy()
                confs = results[0].boxes.conf.cpu().numpy()

                active_vehicles_count = len(track_ids)

                for box, track_id, cls_id, conf in zip(boxes, track_ids, class_ids, confs):
                    x1, y1, x2, y2 = map(int, box)
                    cls_id = int(cls_id)
                    track_id = int(track_id)

                    # Center point of vehicle bounding box
                    center_pt = ((x1 + x2) // 2, (y1 + y2) // 2)

                    # Record path history
                    history = track_history[track_id]
                    prev_pt = history[-1] if len(history) > 0 else None
                    history.append(center_pt)

                    # Check Virtual Line Crossing: segment (prev_pt -> center_pt) intersects line (pt1 -> pt2)
                    crossed_line = False
                    if prev_pt is not None:
                        crossed_line = self._intersect(
                            (float(prev_pt[0]), float(prev_pt[1])),
                            (float(center_pt[0]), float(center_pt[1])),
                            (float(pt1[0]), float(pt1[1])),
                            (float(pt2[0]), float(pt2[1])),
                        )

                    # Check Polygon Zone entry as complementary check
                    inside_zone = cv2.pointPolygonTest(poly_zone, (float(center_pt[0]), float(center_pt[1])), False) >= 0

                    is_new_entry = (crossed_line or (inside_zone and len(history) >= 2)) and (track_id not in counted_ids)

                    if is_new_entry:
                        counted_ids.add(track_id)
                        current_frame_entry_occurred = True
                        last_entry_frame_idx = frame_idx
                        recent_entry_pulse = 15  # Keep line green for 15 frames

                        # Increment breakdown counter
                        if cls_id == self.CLASS_CAR:
                            vehicle_type_counts["cars"] += 1
                        elif cls_id == self.CLASS_MOTORCYCLE:
                            vehicle_type_counts["motorcycles"] += 1
                        elif cls_id == self.CLASS_BUS:
                            vehicle_type_counts["buses"] += 1
                        elif cls_id == self.CLASS_TRUCK:
                            vehicle_type_counts["trucks"] += 1

                        print(
                            f"🚨 [Vehicle Entry Event] Track ID #{track_id} ({self.CLASS_NAMES.get(cls_id, 'Vehicle')}) "
                            f"crossed gate barrier! Total Count: {len(counted_ids)}"
                        )

                    # Draw Trajectory Tail
                    pts_list = np.array(list(history), dtype=np.int32)
                    cv2.polylines(annotated, [pts_list], False, (0, 255, 255), 2, cv2.LINE_AA)

                    # Determine Bounding Box Color
                    is_already_counted = track_id in counted_ids
                    box_color = (74, 222, 128) if is_already_counted else (245, 158, 11)  # Green vs Amber

                    cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2, cv2.LINE_AA)
                    cv2.circle(annotated, center_pt, 4, (0, 255, 255), -1)

                    # Pill Label: Class + Track ID + Confidence
                    type_str = self.CLASS_NAMES.get(cls_id, "Vehicle")
                    status_flag = "✓ Counted" if is_already_counted else "Approaching"
                    label = f"{type_str} #{track_id} [{conf:.2f}] ({status_flag})"

                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw + 6, y1), box_color, -1)
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

            # 3. Draw Virtual Entry Line & Zone
            if recent_entry_pulse > 0:
                recent_entry_pulse -= 1
                line_color = (74, 222, 128)  # Bright Green on entry
                line_thickness = 4
                line_status_str = "BARRIER: VEHICLE CROSSING DETECTED"
            else:
                line_color = (255, 191, 0)   # Blue/Cyan normal
                line_thickness = 3
                line_status_str = "VIRTUAL GATE ENTRY BARRIER"

            # Draw polygon zone semi-transparent
            zone_overlay = annotated.copy()
            cv2.fillPoly(zone_overlay, [poly_zone], (255, 191, 0))
            cv2.addWeighted(zone_overlay, 0.12, annotated, 0.88, 0, annotated)

            # Draw virtual entry line with terminal dots
            cv2.line(annotated, pt1, pt2, line_color, line_thickness, cv2.LINE_AA)
            cv2.circle(annotated, pt1, 6, line_color, -1)
            cv2.circle(annotated, pt2, 6, line_color, -1)

            # Line status label
            mid_x = (pt1[0] + pt2[0]) // 2
            mid_y = ((pt1[1] + pt2[1]) // 2) - 10
            cv2.putText(
                annotated,
                line_status_str,
                (max(20, mid_x - 160), mid_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                line_color,
                2,
                cv2.LINE_AA,
            )

            # 4. Top Telemetry HUD Banner
            banner_height = 55
            banner_overlay = annotated[0:banner_height, 0:width].copy()
            cv2.rectangle(banner_overlay, (0, 0), (width, banner_height), (15, 23, 42), -1)
            cv2.addWeighted(banner_overlay, 0.88, annotated[0:banner_height, 0:width], 0.12, 0, annotated[0:banner_height, 0:width])
            cv2.line(annotated, (0, banner_height), (width, banner_height), (51, 65, 85), 1)

            cv2.putText(
                annotated,
                "CAMPUS SURVEILLANCE  |  GATE & PARKING INTELLIGENCE",
                (20, 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.52,
                (226, 232, 240),
                2,
                cv2.LINE_AA,
            )

            # Vehicles Entered Counter
            entered_str = f"VEHICLES ENTERED: {len(counted_ids)}"
            cv2.putText(
                annotated,
                entered_str,
                (20, 46),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (74, 222, 128),  # Emerald Green
                2,
                cv2.LINE_AA,
            )

            # Active In-Frame Vehicles
            active_str = f"IN CAMERA VIEW: {active_vehicles_count}"
            cv2.putText(
                annotated,
                active_str,
                (280, 46),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (250, 204, 21),  # Amber
                2,
                cv2.LINE_AA,
            )

            # Progress
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

            # 5. Snapshot logic: capture frame of the most recent entry event
            if current_frame_entry_occurred or (best_snapshot_frame is None and active_vehicles_count > 0):
                best_snapshot_frame = annotated.copy()

            out.write(annotated)

        cap.release()
        out.release()

        # 6. Write Snapshot Image
        if best_snapshot_frame is None:
            best_snapshot_frame = np.zeros((height, width, 3), dtype=np.uint8)

        cv2.imwrite(snapshot_output_path, best_snapshot_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print(f"📸 [VehicleAnalyzer] Gate snapshot written: {snapshot_output_path}")

        # 7. Aggregate Metrics
        total_duration_sec = round(total_frames / fps, 1) if fps > 0 else 0.0
        total_entered = len(counted_ids)

        results_summary = {
            "total_vehicles_entered": total_entered,
            "vehicle_breakdown": vehicle_type_counts,
            "total_video_duration_seconds": total_duration_sec,
            "total_frames": total_frames,
            "processed_frames": frame_idx,
            "fps": round(fps, 2),
            "model_version": "YOLOv8n + ByteTrack",
            "virtual_line_configured": True,
            "counted_track_ids": list(counted_ids),
            "status": "completed",
        }

        print(
            f"📊 [VehicleAnalyzer Complete] Total Entered: {total_entered} | "
            f"Breakdown: {vehicle_type_counts} | Frames: {frame_idx}/{total_frames}"
        )

        return results_summary
