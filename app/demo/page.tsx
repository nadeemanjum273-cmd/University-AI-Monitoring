'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Clock,
  Car,
  Download,
  ShieldCheck,
  Activity,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Camera,
  Eye,
  Maximize2,
  X,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  UserCheck,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface SnapshotModalState {
  isOpen: boolean;
  title: string;
  category: string;
  imageSrc: string;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  annotationSummary: string;
}

export default function ClientDemoDashboard() {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>({
    card1: true,
    card2: true,
    card3: true,
  });

  const [activeMedia, setActiveMedia] = useState<{ [key: string]: 'video' | 'snapshot' }>({
    card1: 'video',
    card2: 'video',
    card3: 'video',
  });

  const removeCard = (cardKey: string) => {
    setVisibleCards((prev) => ({ ...prev, [cardKey]: false }));
  };

  const restoreAllCards = () => {
    setVisibleCards({ card1: true, card2: true, card3: true });
  };

  const hiddenCardCount = Object.values(visibleCards).filter((v) => !v).length;

  const [snapshotModal, setSnapshotModal] = useState<SnapshotModalState>({
    isOpen: false,
    title: '',
    category: '',
    imageSrc: '',
    metric1Label: '',
    metric1Val: '',
    metric2Label: '',
    metric2Val: '',
    annotationSummary: '',
  });

  const toggleMedia = (cardKey: string) => {
    setActiveMedia((prev) => ({
      ...prev,
      [cardKey]: prev[cardKey] === 'video' ? 'snapshot' : 'video',
    }));
  };

  const openSnapshotModal = (
    title: string,
    category: string,
    imageSrc: string,
    m1Label: string,
    m1Val: string,
    m2Label: string,
    m2Val: string,
    annotSummary: string
  ) => {
    setSnapshotModal({
      isOpen: true,
      title,
      category,
      imageSrc,
      metric1Label: m1Label,
      metric1Val: m1Val,
      metric2Label: m2Label,
      metric2Val: m2Val,
      annotationSummary: annotSummary,
    });
  };

  // --- Real Client-Side Excel Exporters (Zero Technical Jargon, Clean Integers) ---
  const downloadMasterReport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Overview
    const overviewData = [
      ['CAMPUS AI SURVEILLANCE SUITE - EXECUTIVE TELEMETRY AUDIT'],
      ['Generated On', new Date().toLocaleString()],
      ['System Verification Status', '100% Cleared & Operational'],
      [],
      ['Zone / Facility', 'Location', 'Students / Candidates', 'Staff / Supervision', 'Parking & Clearance Status'],
      ['Primary Classroom', 'Class 3rd B', 15, 'Teacher: Active Teaching', 'Verified'],
      ['Examination Hall', 'Exam Center 01', 24, 'Invigilator: Active Patrol Duty', '2 Suspicious Activity Flags (Black Rectangles: Candidate #19, Candidate #17)'],
      ['Main Gate Entry', 'Gate 01 Barrier', 1, 'Gate Cleared (Plate: ICT-2041 - IN)', 'Parking Occupancy: 1 out of 50 (2%) - 49 Bays Available'],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Executive Overview');

    // Sheet 2: Class 3rd B (Individual Student & Teacher Log matching the Snapshot)
    const classRows: any[][] = [
      ['CLASS 3RD B - ATTENDANCE & TEACHING VERIFICATION'],
      ['Session Date', new Date().toLocaleDateString()],
      ['Total Students Present', 15],
      ['Teacher Presence', 'Active Teaching (100% Full Duration)'],
      [],
      ['Student / Person ID', 'Role', 'Visual Marker on Snapshot', 'Attendance Status'],
      ['Teacher', 'Classroom Instructor', 'Yellow Rectangle (Full Body)', 'Active Teaching'],
    ];
    for (let i = 1; i <= 15; i++) {
      classRows.push([`Student #${i}`, 'Student', `Blue Circle Head #${i}`, 'Present']);
    }
    const wsClass = XLSX.utils.aoa_to_sheet(classRows);
    XLSX.utils.book_append_sheet(wb, wsClass, 'Class 3rd B Attendance');

    // Sheet 3: Examination Hall (24 Candidates + Invigilator + Suspicious Activity Incident Log)
    const examRows: any[][] = [
      ['EXAMINATION HALL 01 - CANDIDATE AUDIT & SUSPICIOUS BEHAVIOR LOG'],
      ['Audit Date', new Date().toLocaleDateString()],
      ['Total Candidates Present', 24],
      ['Invigilator Status', 'Active Patrol Duty (72 Seconds)'],
      ['Suspicious Malpractice Alerts', '2 Incidents Flagged with Black Rectangles'],
      [],
      ['Candidate / Staff ID', 'Role', 'Visual Marker on Snapshot', 'Attendance Status', 'Behavior Alert'],
      ['Invigilator', 'Exam Hall Supervisor', 'Yellow Rectangle (Full Body)', 'Active Patrol Duty', 'Normal Supervision'],
    ];
    for (let i = 1; i <= 24; i++) {
      let alert = 'Normal Examination';
      if (i === 19) alert = 'FLAGGED: Candidate Turned Head Backwards / Looking Sideways from Desk';
      if (i === 17) alert = 'FLAGGED: Candidate Turned Head Sideways toward Neighboring Desk';
      examRows.push([`Candidate #${i}`, 'Candidate', `Blue Circle Head #${i}`, 'Present & Verified', alert]);
    }
    examRows.push([]);
    examRows.push(['SUSPICIOUS ACTIVITY & MALPRACTICE INCIDENT AUDIT']);
    examRows.push(['Incident #', 'Candidate ID', 'Timestamp', 'Detected Anomaly', 'Visual Marker in Video', 'Proctor Verification']);
    examRows.push([1, 'Candidate #19', '00:56 - 01:11 (15 Seconds)', 'Candidate turned head backwards & sideways away from exam paper', 'Black Rectangle Box with Warning Badge', 'High Alert - Flagged for Video Review']);
    examRows.push([2, 'Candidate #17', '00:46 - 00:54 (8 Seconds)', 'Candidate turned head sideways toward neighboring desk', 'Black Rectangle Box with Warning Badge', 'Review Video Segment']);
    const wsExam = XLSX.utils.aoa_to_sheet(examRows);
    XLSX.utils.book_append_sheet(wb, wsExam, 'Exam Hall 01 Candidates');

    // Sheet 4: Vehicle Gate Ingress Log (Only when a vehicle passes, no far things)
    const gateData = [
      ['MAIN GATE BARRIER - VEHICLE INGRESS & PARKING CAPACITY LOG'],
      ['Monitoring Zone', 'Gate 01 Virtual Barrier (Near Field Only)'],
      ['Date', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Figures', 'Percentage / Breakdown'],
      ['Total Parking Capacity', '50 Bays', '100%'],
      ['Current Parking Occupancy', '1 Bay Occupied', '1 out of 50 (2%)'],
      ['Available Parking Bays', '49 Bays Free', '49 out of 50 (98%)'],
      [],
      ['Entry #', 'Time', 'Vehicle Type', 'Number Plate', 'Direction', 'Barrier Clearance'],
      [1, '11:56:10 AM', 'Car', 'ICT-2041', 'IN', 'Barrier Cleared'],
    ];
    const wsGate = XLSX.utils.aoa_to_sheet(gateData);
    XLSX.utils.book_append_sheet(wb, wsGate, 'Gate Vehicle Ingress Log');

    XLSX.writeFile(wb, 'Campus_AI_Analytics_Report.xlsx');
    setDownloadMenuOpen(false);
  };

  const downloadSpecificReport = (type: 'class' | 'exam' | 'gate') => {
    const wb = XLSX.utils.book_new();

    if (type === 'class') {
      const classRows: any[][] = [
        ['CLASS 3RD B - ATTENDANCE REPORT'],
        ['Generated Date', new Date().toLocaleDateString()],
        ['Total Students Present', 15],
        ['Teacher Status', 'Active Teaching (100% Full Duration)'],
        [],
        ['ID', 'Role', 'Visual Snapshot Marker', 'Status'],
        ['Teacher', 'Instructor', 'Yellow Rectangle (Full Body)', 'Active'],
      ];
      for (let i = 1; i <= 15; i++) {
        classRows.push([`Student #${i}`, 'Student', `Blue Circle Head #${i}`, 'Present']);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(classRows), 'Class 3B Attendance');
      XLSX.writeFile(wb, 'Class_3rd_B_Attendance_Report.xlsx');
    } else if (type === 'exam') {
      const examRows: any[][] = [
        ['EXAM CENTER SURVEILLANCE - 24 CANDIDATES AUDIT & MALPRACTICE LOG'],
        ['Generated Date', new Date().toLocaleDateString()],
        ['Total Candidates', 24],
        ['Invigilator Active Time', '72 Seconds'],
        ['Suspicious Incidents Detected', '2 Flagged with Black Rectangles (Candidate #19, #17)'],
        [],
        ['ID', 'Role', 'Visual Snapshot Marker', 'Status', 'Behavior Status'],
        ['Invigilator', 'Supervisor', 'Yellow Rectangle (Full Body)', 'Active Patrol Duty', 'Normal Duty'],
      ];
      for (let i = 1; i <= 24; i++) {
        let alert = 'Normal Examination';
        if (i === 19) alert = 'FLAGGED: Candidate Turned Head Backwards / Looking Sideways from Desk';
        if (i === 17) alert = 'FLAGGED: Candidate Turned Head Sideways toward Neighboring Desk';
        examRows.push([`Candidate #${i}`, 'Candidate', `Blue Circle Head #${i}`, 'Present & Verified', alert]);
      }
      examRows.push([]);
      examRows.push(['SUSPICIOUS ACTIVITY & MALPRACTICE INCIDENT LOG']);
      examRows.push(['Incident #', 'Candidate ID', 'Timestamp', 'Detected Anomaly', 'Visual Flag in Footage', 'Status']);
      examRows.push([1, 'Candidate #19', '00:56 - 01:11 (15 Seconds)', 'Candidate turned head backwards & sideways away from exam paper', 'Black Rectangle with Warning Label', 'Flagged for Video Review']);
      examRows.push([2, 'Candidate #17', '00:46 - 00:54 (8 Seconds)', 'Candidate turned head sideways toward neighboring desk', 'Black Rectangle with Warning Label', 'Flagged for Video Review']);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(examRows), 'Exam Center');
      XLSX.writeFile(wb, 'Exam_Center_Surveillance_Report.xlsx');
    } else {
      const gateData = [
        ['MAIN GATE ENTRY - VEHICLE INGRESS & PARKING CAPACITY REPORT'],
        ['Generated Date', new Date().toLocaleDateString()],
        [],
        ['Metric', 'Figure', 'Percentage Status'],
        ['Total Parking Capacity', '50 Bays', '100% Total Space'],
        ['Parking Spaces Occupied', '1 Bay', '1 out of 50 (2%)'],
        ['Available Parking Bays', '49 Bays', '49 out of 50 (98%)'],
        [],
        ['Entry #', 'Time', 'Vehicle Type', 'Number Plate', 'Direction', 'Barrier Clearance'],
        [1, '11:56:10 AM', 'Car', 'ICT-2041', 'IN', 'Barrier Cleared'],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gateData), 'Gate Ingress Log');
      XLSX.writeFile(wb, 'Gate_Barrier_Vehicle_Log.xlsx');
    }
    setDownloadMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-emerald-600 h-8 w-8" />
            Smart Campus AI
          </h1>
          <p className="text-slate-500 mt-1">Enterprise Surveillance & Analytics Dashboard</p>
        </div>

        {/* Hover-Triggered Interactive Download Menu */}
        <div
          className="relative inline-block"
          onMouseEnter={() => setDownloadMenuOpen(true)}
          onMouseLeave={() => setDownloadMenuOpen(false)}
        >
          <button
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            className="flex items-center gap-2.5 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-sm font-medium text-sm group"
          >
            <Download className="h-4 w-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
            <span>Download Analytics Report</span>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                downloadMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Arising Dropdown Options Menu */}
          {downloadMenuOpen && (
            <div className="absolute right-0 top-full pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 text-slate-800 backdrop-blur-lg">
                <div className="px-3 py-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Select Export Format
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    onClick={downloadMasterReport}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors group"
                  >
                    <div className="p-2 bg-emerald-100/80 text-emerald-700 rounded-lg shrink-0 mt-0.5 group-hover:bg-emerald-200">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                        Full Comprehensive Excel (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Class 3B (15 students), Exam Hall (24 candidates + 2 suspicious flags), Gate log
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => downloadSpecificReport('class')}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-left transition-colors group"
                  >
                    <div className="p-2 bg-blue-100/80 text-blue-700 rounded-lg shrink-0 mt-0.5 group-hover:bg-blue-200">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                        Class 3rd B Attendance Sheet (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        15 Students circled with IDs + Teacher active
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => downloadSpecificReport('exam')}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-amber-50 text-left transition-colors group"
                  >
                    <div className="p-2 bg-amber-100/80 text-amber-700 rounded-lg shrink-0 mt-0.5 group-hover:bg-amber-200">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                        Exam Center Invigilator Audit (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        24 Candidates (motion tracked) + 2 Suspicious Flags (Black Rectangles)
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => downloadSpecificReport('gate')}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors group"
                  >
                    <div className="p-2 bg-rose-100/80 text-rose-700 rounded-lg shrink-0 mt-0.5 group-hover:bg-rose-200">
                      <Car className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-rose-800">
                        Vehicle Gate Ingress Log (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Barrier crossing: Time, Car, Plate ICT-2041, IN
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setDownloadMenuOpen(false);
                        window.print();
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 text-left transition-colors text-xs font-semibold text-slate-700"
                    >
                      <Printer className="h-4 w-4 text-slate-500" />
                      <span>Print Executive PDF Summary</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restore Banner if Any Card is Removed */}
      {hiddenCardCount > 0 && (
        <div className="mb-8 flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>{hiddenCardCount} video card{hiddenCardCount > 1 ? 's' : ''} removed</strong> from the dashboard view.
            </span>
          </div>
          <button
            onClick={restoreAllCards}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-1.5 rounded-xl transition shadow-xs text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Removed Videos</span>
          </button>
        </div>
      )}

      {/* Grid Layout for 3 Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ========================================================
            CARD 1: PRIMARY CLASSROOM (CLASS 3RD B)
           ======================================================== */}
        {visibleCards.card1 && (
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-400 transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Media Container with Arising Mouse Hover Option Bar */}
              <div className="aspect-video bg-slate-950 relative overflow-hidden">
                {activeMedia.card1 === 'video' ? (
                  <video
                    src="/videos/class_3b.mp4"
                    poster="/videos/class_3b_snapshot.jpg"
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src="/videos/class_3b_snapshot.jpg"
                      alt="Class 3B AI Keyframe Snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
                  </div>
                )}

                {/* Tag Badge */}
                <div className="absolute top-3 left-3 bg-blue-600/95 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Primary Classroom
                </div>

                {/* Arising Mouse Hover Option Bar */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-white text-xs border border-white/10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => toggleMedia('card1')}
                    className="flex items-center gap-1.5 hover:text-blue-400 transition font-medium"
                    title="Switch between live video and AI snapshot"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{activeMedia.card1 === 'video' ? 'Show Attached SS' : 'Show Video'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openSnapshotModal(
                        'Class 3rd B Monitoring',
                        'Primary Classroom',
                        '/videos/class_3b_snapshot.jpg',
                        'Students Present',
                        '15 Students (Blue Circles #1 - #15)',
                        'Teacher Presence',
                        'Active Teaching (Yellow Rectangle)',
                        '15 students marked with blue circles around heads with IDs #1..#15; teacher marked with yellow rectangle.'
                      )
                    }
                    className="flex items-center gap-1 hover:text-blue-400 transition font-medium ml-auto"
                    title="Open full resolution snapshot"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Inspect SS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeCard('card1')}
                    className="flex items-center gap-1 hover:text-rose-400 text-rose-300 transition font-medium ml-2"
                    title="Remove this video card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Class 3rd B Monitoring
                  </h3>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    15 Students
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Students Present</p>
                      <p className="font-bold text-slate-900 text-base">15 Students</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50/50 transition-colors">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Active Teaching Time</p>
                      <p className="font-bold text-emerald-700 text-base">100% (Full Duration)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            CARD 2: EXAM CENTER SURVEILLANCE
           ======================================================== */}
        {visibleCards.card2 && (
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-amber-400 transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Media Container with Arising Mouse Hover Option Bar */}
              <div className="aspect-video bg-slate-950 relative overflow-hidden">
                {activeMedia.card2 === 'video' ? (
                  <video
                    src="/videos/exam_01.mp4"
                    poster="/videos/exam_01_snapshot.jpg"
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src="/videos/exam_01_snapshot.jpg"
                      alt="Exam Center AI Keyframe Snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-amber-900/10 pointer-events-none" />
                  </div>
                )}

                {/* Tag Badge */}
                <div className="absolute top-3 left-3 bg-amber-500/95 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Examination Hall
                </div>

                {/* Arising Mouse Hover Option Bar */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-white text-xs border border-white/10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => toggleMedia('card2')}
                    className="flex items-center gap-1.5 hover:text-amber-400 transition font-medium"
                    title="Switch between live video and AI snapshot"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{activeMedia.card2 === 'video' ? 'Show Attached SS' : 'Show Video'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openSnapshotModal(
                        'Exam Center Surveillance',
                        'Examination Hall',
                        '/videos/exam_01_snapshot.jpg',
                        'Candidates Present',
                        '24 Candidates (Blue Circles #1 - #24)',
                        'Invigilator & Alerts',
                        '72s Patrol + 2 Suspicious Flags (Black Rectangles)',
                        'All 24 candidates circled with blue around heads (#1..#24) with dynamic slight head motion tracking. Invigilator marked with yellow rectangle in aisle. Suspicious activities (looking back/sideways) detected and framed with black rectangles on Candidate #19 and #17, logged in Excel.'
                      )
                    }
                    className="flex items-center gap-1 hover:text-amber-400 transition font-medium ml-auto"
                    title="Open full resolution snapshot"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Inspect SS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeCard('card2')}
                    className="flex items-center gap-1 hover:text-rose-400 text-rose-300 transition font-medium ml-2"
                    title="Remove this video card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    Exam Center Surveillance
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    24 Candidates
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-amber-50/50 transition-colors">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Candidates Present</p>
                      <p className="font-bold text-slate-900 text-base">24 Candidates (Motion Tracked)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-purple-50/50 transition-colors">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Invigilator Active Time</p>
                      <p className="font-bold text-purple-700 text-base">72 Seconds</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 group-hover:bg-rose-50 transition-colors">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-rose-800 font-medium">Suspicious Activity Alerts</p>
                      <p className="font-bold text-rose-900 text-base">2 Detected (Black Boxes #19, #17)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            CARD 3: VEHICLE & PARKING AI
           ======================================================== */}
        {visibleCards.card3 && (
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-rose-400 transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Media Container with Arising Mouse Hover Option Bar */}
              <div className="aspect-video bg-slate-950 relative overflow-hidden">
                {activeMedia.card3 === 'video' ? (
                  <video
                    src="/videos/gate_01.mp4"
                    poster="/videos/gate_01_snapshot.jpg"
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src="/videos/gate_01_snapshot.jpg"
                      alt="Main Gate Barrier AI Keyframe Snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-rose-900/10 pointer-events-none" />
                  </div>
                )}

                {/* Tag Badge */}
                <div className="absolute top-3 left-3 bg-rose-500/95 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Main Gate Entry
                </div>

                {/* Arising Mouse Hover Option Bar */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-white text-xs border border-white/10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => toggleMedia('card3')}
                    className="flex items-center gap-1.5 hover:text-rose-400 transition font-medium"
                    title="Switch between live video and AI snapshot"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{activeMedia.card3 === 'video' ? 'Show Attached SS' : 'Show Video'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openSnapshotModal(
                        'Vehicle & Parking AI',
                        'Main Gate Entry',
                        '/videos/gate_01_snapshot.jpg',
                        'Parking Capacity',
                        '1 out of 50 (2%)',
                        'Gate Clearance',
                        'Plate ICT-2041 (IN) - Cleared',
                        'Near barrier line detection only; parking occupancy 1/50 (2%).'
                      )
                    }
                    className="flex items-center gap-1 hover:text-rose-400 transition font-medium ml-auto"
                    title="Open full resolution snapshot"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Inspect SS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeCard('card3')}
                    className="flex items-center gap-1 hover:text-rose-400 text-rose-300 transition font-medium ml-2"
                    title="Remove this video card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    Vehicle & Parking AI
                  </h3>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    1 / 50 (2% Occupied)
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Parking Space Figure: 1 out of 50 in percentage */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-rose-50/50 transition-colors space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Parking Space Occupancy</p>
                          <p className="font-bold text-slate-900 text-base">1 out of 50 (2%)</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        49 Available (98%)
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2.5 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: '2%' }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                      <span className="text-rose-600 font-medium">1 Bay In Use (ICT-2041)</span>
                      <span className="text-emerald-600 font-semibold">49 Free Bays (98%)</span>
                    </div>
                  </div>

                  {/* Gate Barrier Clearance */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Gate Barrier Clearance</p>
                      <p className="font-bold text-slate-900 text-base">Plate ICT-2041 (IN)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          SNAPSHOT (SS) INSPECTION MODAL LIGHTBOX
         ======================================================== */}
      {snapshotModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{snapshotModal.title}</h3>
                  <p className="text-xs text-slate-500">
                    High-Resolution Keyframe Evidence Snapshot (SS)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={snapshotModal.imageSrc}
                  download={`${snapshotModal.title.replace(/\s+/g, '_')}_Snapshot.jpg`}
                  className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-800 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JPG</span>
                </a>

                <button
                  onClick={() => setSnapshotModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <img
                src={snapshotModal.imageSrc}
                alt={snapshotModal.title}
                className="max-h-[60vh] w-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-mono px-2.5 py-1 rounded-md">
                HD Forensic Snapshot
              </div>
            </div>

            {/* Modal Footer with Telemetry Details */}
            <div className="p-5 bg-white space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 block">
                    {snapshotModal.metric1Label}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {snapshotModal.metric1Val}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 block">
                    {snapshotModal.metric2Label}
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {snapshotModal.metric2Val}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 px-1">
                {snapshotModal.annotationSummary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
