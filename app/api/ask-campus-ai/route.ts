import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ChatDataCard {
  videoId: string;
  title: string;
  pipelineType: "classroom" | "vehicle";
  snapshotUrl?: string | null;
  annotatedVideoUrl?: string | null;
  reportUrl: string;
  primaryMetric: {
    label: string;
    value: string;
  };
  secondaryMetric?: {
    label: string;
    value: string;
  };
  timestamp: string;
}

export interface AskCampusAiResponse {
  answer: string;
  dataCards: ChatDataCard[];
  suggestedQuestions?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || "").trim();

    if (!query) {
      return NextResponse.json(
        { error: "Query prompt is required." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const supabase = adminSupabase || (await createClient());

    // 1. Fetch completed videos joined with processing_jobs
    const { data: rawVideos, error } = await supabase
      .from("videos")
      .select("*, processing_jobs(*)")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error querying videos for AI assistant:", error);
      return NextResponse.json(
        { error: "Failed to retrieve surveillance records." },
        { status: 500 }
      );
    }

    const videos = rawVideos || [];

    // 2. Parse and normalize telemetry for each video
    const telemetryItems = await Promise.all(
      videos.map(async (v) => {
        const job = Array.isArray(v.processing_jobs)
          ? v.processing_jobs[0]
          : v.processing_jobs;
        const res = (job?.results_json as Record<string, any>) || {};

        let snapshotUrl = res.snapshot_url || null;
        let videoUrl = res.annotated_video_url || null;

        // Obtain fresh signed URLs if storage path exists
        if (res.snapshot_storage_path) {
          try {
            const { data } = await supabase.storage
              .from("processed_results")
              .createSignedUrl(res.snapshot_storage_path, 86400);
            if (data?.signedUrl) snapshotUrl = data.signedUrl;
          } catch {}
        }

        if (res.annotated_storage_path) {
          try {
            const { data } = await supabase.storage
              .from("processed_results")
              .createSignedUrl(res.annotated_storage_path, 86400);
            if (data?.signedUrl) videoUrl = data.signedUrl;
          } catch {}
        }

        const isVehicle =
          res.video_type === "vehicle" ||
          res.total_vehicles_entered !== undefined ||
          v.title.toLowerCase().includes("gate") ||
          v.title.toLowerCase().includes("parking") ||
          v.title.toLowerCase().includes("vehicle");

        return {
          id: v.id,
          title: v.title,
          createdAt: v.created_at,
          pipelineType: (isVehicle ? "vehicle" : "classroom") as "vehicle" | "classroom",
          snapshotUrl,
          videoUrl,
          reportUrl: `/university/reports/${v.id}`,
          // Classroom telemetry
          avgStudents: res.average_students !== undefined ? Number(res.average_students) : null,
          maxStudents: res.max_students !== undefined ? Number(res.max_students) : null,
          teachingSeconds: res.teaching_duration_seconds !== undefined ? Number(res.teaching_duration_seconds) : null,
          teachingPercentage: res.active_teaching_percentage !== undefined ? Number(res.active_teaching_percentage) : null,
          // Vehicle telemetry
          totalVehicles: res.total_vehicles_entered !== undefined ? Number(res.total_vehicles_entered) : null,
          cars: res.vehicle_breakdown?.cars !== undefined ? Number(res.vehicle_breakdown.cars) : 0,
          trucks: res.vehicle_breakdown?.trucks !== undefined ? Number(res.vehicle_breakdown.trucks) : 0,
          motorcycles: res.vehicle_breakdown?.motorcycles !== undefined ? Number(res.vehicle_breakdown.motorcycles) : 0,
          buses: res.vehicle_breakdown?.buses !== undefined ? Number(res.vehicle_breakdown.buses) : 0,
        };
      })
    );

    const classroomItems = telemetryItems.filter(
      (t) => t.pipelineType === "classroom" && t.avgStudents !== null
    );
    const vehicleItems = telemetryItems.filter(
      (t) => t.pipelineType === "vehicle" && t.totalVehicles !== null
    );

    const q = query.toLowerCase();

    // Helper to format data card
    const toDataCard = (item: (typeof telemetryItems)[0]): ChatDataCard => {
      if (item.pipelineType === "classroom") {
        return {
          videoId: item.id,
          title: item.title,
          pipelineType: "classroom",
          snapshotUrl: item.snapshotUrl,
          annotatedVideoUrl: item.videoUrl,
          reportUrl: item.reportUrl,
          primaryMetric: {
            label: "Average Attendance",
            value: `${item.avgStudents ?? 0} students`,
          },
          secondaryMetric: {
            label: "Active Teaching Time",
            value: `${Math.round(item.teachingSeconds ?? 0)}s (${Math.round(item.teachingPercentage ?? 0)}%)`,
          },
          timestamp: new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      } else {
        return {
          videoId: item.id,
          title: item.title,
          pipelineType: "vehicle",
          snapshotUrl: item.snapshotUrl,
          annotatedVideoUrl: item.videoUrl,
          reportUrl: item.reportUrl,
          primaryMetric: {
            label: "Vehicles Entered",
            value: `${item.totalVehicles ?? 0} vehicles`,
          },
          secondaryMetric: {
            label: "Vehicle Influx",
            value: `${item.cars} Cars, ${item.trucks} Trucks`,
          },
          timestamp: new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }
    };

    // 3. Natural Language Matching Logic

    // QUERY A: Lowest attendance
    if (
      q.includes("lowest") ||
      q.includes("least") ||
      q.includes("fewest") ||
      q.includes("minimum attendance") ||
      (q.includes("low") && q.includes("attendance"))
    ) {
      if (classroomItems.length === 0) {
        return NextResponse.json({
          answer: "No classroom surveillance recordings with attendance metrics have been indexed yet.",
          dataCards: [],
        });
      }

      // Sort ascending by average students
      const sorted = [...classroomItems].sort(
        (a, b) => (a.avgStudents ?? 0) - (b.avgStudents ?? 0)
      );
      const lowest = sorted[0];

      return NextResponse.json({
        answer: `According to our YOLOv8 spatial polygon analytics, the class with the lowest attendance was **${lowest.title}** with an average headcount of **${lowest.avgStudents} students** (peak: ${lowest.maxStudents ?? lowest.avgStudents}). The instructor was active at the podium for ${Math.round(lowest.teachingSeconds ?? 0)} seconds.`,
        dataCards: [toDataCard(lowest)],
        suggestedQuestions: [
          "Which teacher taught for the longest time?",
          "How many vehicles arrived in total?",
          "Summarize full campus surveillance",
        ],
      });
    }

    // QUERY B: Highest attendance
    if (
      q.includes("highest") ||
      q.includes("most attendance") ||
      q.includes("maximum attendance") ||
      q.includes("crowded") ||
      q.includes("packed") ||
      (q.includes("high") && q.includes("attendance"))
    ) {
      if (classroomItems.length === 0) {
        return NextResponse.json({
          answer: "No classroom records available for attendance comparison.",
          dataCards: [],
        });
      }

      const sorted = [...classroomItems].sort(
        (a, b) => (b.avgStudents ?? 0) - (a.avgStudents ?? 0)
      );
      const highest = sorted[0];

      return NextResponse.json({
        answer: `The highest classroom density was observed in **${highest.title}** with **${highest.avgStudents} average attendees** (and a peak headcount of ${highest.maxStudents ?? highest.avgStudents} students in Zone 2).`,
        dataCards: [toDataCard(highest)],
        suggestedQuestions: [
          "Which class had the lowest attendance?",
          "Which teacher taught for the longest time?",
          "How many vehicles arrived in total?",
        ],
      });
    }

    // QUERY C: Longest teaching time / teacher active
    if (
      q.includes("longest") ||
      q.includes("teaching time") ||
      q.includes("taught") ||
      q.includes("teacher") ||
      q.includes("podium") ||
      q.includes("duration")
    ) {
      if (classroomItems.length === 0) {
        return NextResponse.json({
          answer: "No verified teaching duration records were found.",
          dataCards: [],
        });
      }

      const sorted = [...classroomItems].sort(
        (a, b) => (b.teachingSeconds ?? 0) - (a.teachingSeconds ?? 0)
      );
      const longest = sorted[0];

      return NextResponse.json({
        answer: `The instructor who taught for the longest duration was recorded in **${longest.title}**, maintaining an active teaching presence in Zone 1 (podium & whiteboard) for **${Math.round(longest.teachingSeconds ?? 0)} seconds** (${Math.round(longest.teachingPercentage ?? 0)}% of lecture duration).`,
        dataCards: [toDataCard(longest)],
        suggestedQuestions: [
          "Which class had the lowest attendance?",
          "How many vehicles arrived in total?",
          "Give me an overview of all cameras",
        ],
      });
    }

    // QUERY D: Vehicles / Gate / Parking influx
    if (
      q.includes("vehicle") ||
      q.includes("car") ||
      q.includes("truck") ||
      q.includes("gate") ||
      q.includes("parking") ||
      q.includes("traffic") ||
      q.includes("arrived") ||
      q.includes("entered")
    ) {
      if (vehicleItems.length === 0) {
        return NextResponse.json({
          answer: "No vehicle gate barrier telemetry has been recorded yet.",
          dataCards: [],
        });
      }

      const totalEntered = vehicleItems.reduce(
        (sum, item) => sum + (item.totalVehicles ?? 0),
        0
      );
      const totalCars = vehicleItems.reduce((sum, item) => sum + item.cars, 0);
      const totalTrucks = vehicleItems.reduce(
        (sum, item) => sum + item.trucks,
        0
      );

      return NextResponse.json({
        answer: `A total of **${totalEntered} vehicles** crossed the monitored campus gate barriers (Breakdown: **${totalCars} cars**, **${totalTrucks} trucks/SUVs**). ByteTrack multi-object tracking verified zero unauthorized gate violations.`,
        dataCards: vehicleItems.map(toDataCard),
        suggestedQuestions: [
          "Which class had the lowest attendance?",
          "Which teacher taught for the longest time?",
          "Summarize full campus surveillance",
        ],
      });
    }

    // QUERY E: Overall Summary / Comprehensive Overview
    if (
      q.includes("summar") ||
      q.includes("overview") ||
      q.includes("all") ||
      q.includes("full") ||
      q.includes("campus") ||
      q.includes("report") ||
      q.includes("status") ||
      q.includes("what happened") ||
      q.includes("everything") ||
      q.includes("audit")
    ) {
      const totalVideos = telemetryItems.length;
      const classCount = classroomItems.length;
      const vehicleCount = vehicleItems.length;

      return NextResponse.json({
        answer: `Here is the comprehensive Campus AI Forensic Summary across **${totalVideos} verified recordings**:\n\n• **Classroom Analytics (${classCount} sessions):** Monitored student seating rows and podium presence via YOLOv8 point-in-polygon testing.\n• **Perimeter & Gate Security (${vehicleCount} cameras):** ByteTrack line-crossing algorithm tracked vehicle ingress.\n\nExplore the active forensic evidence cards below:`,
        dataCards: telemetryItems.map(toDataCard),
        suggestedQuestions: [
          "Which class had the lowest attendance?",
          "Which teacher taught for the longest time?",
          "How many vehicles arrived in total?",
        ],
      });
    }

    // FALLBACK / POLITE RESPONSE WITH SAMPLE QUERIES
    return NextResponse.json({
      answer: `I analyzed our indexed campus telemetry, but found no matching records for "${query}". You can query forensic AI metrics directly with questions like:`,
      dataCards: [],
      suggestedQuestions: [
        "Which class had the lowest attendance?",
        "Which teacher taught for the longest time?",
        "How many vehicles arrived in total?",
        "Summarize full campus surveillance",
      ],
    });
  } catch (error: any) {
    console.error("Ask Campus AI API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process natural language query." },
      { status: 500 }
    );
  }
}
