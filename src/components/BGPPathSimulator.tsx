/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Network, Server, Play, Zap, AlertTriangle, ArrowRight, ShieldCheck, ToggleLeft } from "lucide-react";

interface PathStep {
  from: string;
  to: string;
  label: string;
}

export default function BGPPathSimulator() {
  // Simulator configuration
  const [isp1Active, setIsp1Active] = useState(true);
  const [isp2Active, setIsp2Active] = useState(true);
  const [isp1LocalPref, setIsp1LocalPref] = useState(200);
  const [isp2LocalPref, setIsp2LocalPref] = useState(100);
  const [prependIsp1, setPrependIsp1] = useState(false);
  const [prependCount, setPrependCount] = useState(2);

  // States computed for path tracing
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [asPathLog, setAsPathLog] = useState<string[]>([]);
  const [activeISP, setActiveISP] = useState<"ISP1" | "ISP2" | "NONE">("NONE");

  useEffect(() => {
    runBGPSelection();
  }, [isp1Active, isp2Active, isp1LocalPref, isp2LocalPref, prependIsp1, prependCount]);

  const runBGPSelection = () => {
    const logs: string[] = [];
    let chosenPath: string[] = [];
    let chosenIsp: "ISP1" | "ISP2" | "NONE" = "NONE";

    logs.push("BGP Selection Engine initialized.");
    logs.push("Checking physical connectivity to upstream peers...");

    if (!isp1Active && !isp2Active) {
      logs.push("CRITICAL ALERT - Both ISP uplinks are DOWN. Destination network is completely unreachable!");
      setSelectedPath([]);
      setAsPathLog(logs);
      setActiveISP("NONE");
      return;
    }

    const isp1Score = {
      active: isp1Active,
      localPref: isp1LocalPref,
      asPathLength: prependIsp1 ? 1 + prependCount + 1 : 1 + 1, // prepended nodes + target
      name: "ISP-1 (AS 1240)"
    };

    const isp2Score = {
      active: isp2Active,
      localPref: isp2LocalPref,
      asPathLength: 1 + 1, // ISP-2 (AS 2914) + Target (AS 15169)
      name: "ISP-2 (AS 2914)"
    };

    logs.push(`ISP-1 Link Status: ${isp1Active ? "UP" : "DOWN"} | LocalPref: ${isp1LocalPref} | AS-Path Length: ${isp1Score.asPathLength}`);
    logs.push(`ISP-2 Link Status: ${isp2Active ? "UP" : "DOWN"} | LocalPref: ${isp2LocalPref} | AS-Path Length: ${isp2Score.asPathLength}`);

    // Selection Decisions
    if (isp1Active && !isp2Active) {
      logs.push("ISP-2 peer is DOWN. Selecting ISP-1 by default (Only active path available).");
      chosenIsp = "ISP1";
    } else if (!isp1Active && isp2Active) {
      logs.push("ISP-1 peer is DOWN. Selecting ISP-2 by default (Only active path available).");
      chosenIsp = "ISP2";
    } else {
      // Both are active, compare BGP path selection vector
      logs.push("Applying standard BGP Best Path Selection Decision Matrix:");
      
      // Step 1: Weight (N/A here, equivalent local weights)
      // Step 2: Local Preference (Highest preferred)
      logs.push(` - Step 1: Compare Local Preference. ISP-1: ${isp1LocalPref}, ISP-2: ${isp2LocalPref}`);
      if (isp1LocalPref > isp2LocalPref) {
        logs.push(`   --> ISP-1 has higher LocalPref (${isp1LocalPref} > ${isp2LocalPref}). Route selected.`);
        chosenIsp = "ISP1";
      } else if (isp2LocalPref > isp1LocalPref) {
        logs.push(`   --> ISP-2 has higher LocalPref (${isp2LocalPref} > ${isp1LocalPref}). Route selected.`);
        chosenIsp = "ISP2";
      } else {
        logs.push("   --> Local Preferences are equal. Progressing to AS-Path Length Comparison...");
        
        // Step 3: Compare AS-Path Length (Shortest preferred)
        logs.push(` - Step 2: Compare AS-Path Lengths. ISP-1 Path Length: ${isp1Score.asPathLength}, ISP-2 Path Length: ${isp2Score.asPathLength}`);
        if (prependIsp1) {
          logs.push(`   --> ISP-1 features AS-Path Prepending: Extra AS hops added to advertise trail.`);
        }
        
        if (isp1Score.asPathLength < isp2Score.asPathLength) {
          logs.push(`   --> ISP-1 features shorter AS-Path (${isp1Score.asPathLength} < ${isp2Score.asPathLength}). Route selected.`);
          chosenIsp = "ISP1";
        } else if (isp2Score.asPathLength < isp1Score.asPathLength) {
          logs.push(`   --> ISP-2 features shorter AS-Path (${isp2Score.asPathLength} < ${isp1Score.asPathLength}). Route selected.`);
          chosenIsp = "ISP2";
        } else {
          logs.push("   --> AS-Path Lengths are equal. Tie breaker applied: Defaulting to first connected physical ASIC (ISP-1).");
          chosenIsp = "ISP1";
        }
      }
    }

    if (chosenIsp === "ISP1") {
      chosenPath = prependIsp1 
        ? ["HQ-AS65001", "ISP1-AS1240", ...Array(prependCount).fill("ISP1-AS1240"), "ANYCAST-AS15169"] 
        : ["HQ-AS65001", "ISP1-AS1240", "ANYCAST-AS15169"];
      setActiveISP("ISP1");
      logs.push(`BEST PATH RESOLVED via ISP-1. Selected BGP AS-Path: [${chosenPath.join(" → ")}]`);
    } else {
      chosenPath = ["HQ-AS65001", "ISP2-AS2914", "ANYCAST-AS15169"];
      setActiveISP("ISP2");
      logs.push(`BEST PATH RESOLVED via ISP-2. Selected BGP AS-Path: [${chosenPath.join(" → ")}]`);
    }

    setSelectedPath(chosenPath);
    setAsPathLog(logs);
  };

  return (
    <div id="bgp-simulator" className="bg-slate-950 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
          <Network className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-mono text-base font-bold text-slate-100">BGP Route Decision Path Simulator</h3>
          <p className="text-xs text-slate-400">Interact with active link matrices to study multi-homed AS behavior</p>
        </div>
      </div>

      {/* Network Graph Visualizer */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row items-center justify-around gap-6 py-8 relative overflow-hidden">
        
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30 pointer-events-none" />

        {/* Source Client Node */}
        <div className="z-10 bg-slate-950 p-3 h-28 w-44 rounded-lg border-2 border-slate-700 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">Local Corporate HQ</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-center">
            <div className="font-mono text-emerald-400 font-bold text-sm">AS 65001</div>
            <div className="text-[9px] text-slate-400">Core Border Gateway</div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 truncate text-center">IP: 198.51.100.1</div>
        </div>

        {/* ISP Gateways Vector Column */}
        <div className="flex flex-col gap-6 z-10 w-full md:w-auto">
          
          {/* ISP 1 Node */}
          <div className={`p-3 h-28 w-48 rounded-lg border-2 transition-all flex flex-col justify-between bg-slate-950 ${
            !isp1Active 
              ? "border-red-900/60 opacity-40 shadow-none" 
              : activeISP === "ISP1" 
                ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                : "border-slate-800"
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400">ISP-1 (Fibre Transit)</span>
              <span className={`h-2.5 w-2.5 rounded-full ${isp1Active ? "bg-emerald-500" : "bg-red-500"}`} />
            </div>
            <div className="text-center">
              <div className="font-mono text-sky-400 text-sm font-bold">AS 1240</div>
              <div className="text-[9px] text-slate-500">LocalPref: {isp1LocalPref}</div>
              {prependIsp1 && (
                <div className="text-[8px] font-mono bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded-sm inline-block mt-0.5">
                  Prepended {prependCount}x
                </div>
              )}
            </div>
            <div className="text-[9px] font-mono text-slate-500 text-center flex justify-around">
              <span>Path Cost: $11/Mb</span>
            </div>
          </div>

          {/* ISP 2 Node */}
          <div className={`p-3 h-28 w-48 rounded-lg border-2 transition-all flex flex-col justify-between bg-slate-950 ${
            !isp2Active 
              ? "border-red-900/60 opacity-40 shadow-none" 
              : activeISP === "ISP2" 
                ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                : "border-slate-800"
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400">ISP-2 (Copper Backup)</span>
              <span className={`h-2.5 w-2.5 rounded-full ${isp2Active ? "bg-emerald-500" : "bg-red-500"}`} />
            </div>
            <div className="text-center">
              <div className="font-mono text-purple-400 text-sm font-bold">AS 2914</div>
              <div className="text-[9px] text-slate-500">LocalPref: {isp2LocalPref}</div>
            </div>
            <div className="text-[9px] font-mono text-slate-500 text-center flex justify-around">
              <span>Path Cost: $3/Mb</span>
            </div>
          </div>

        </div>

        {/* Target Destination Node */}
        <div className={`z-10 bg-slate-950 p-3 h-28 w-44 rounded-lg border-2 flex flex-col justify-between shadow-lg ${
          activeISP !== "NONE" ? "border-sky-500" : "border-slate-800"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-sky-400">Anycast Target</span>
            <Server className={`w-3.5 h-3.5 ${activeISP !== "NONE" ? "text-sky-400 animate-pulse" : "text-slate-600"}`} />
          </div>
          <div className="text-center">
            <div className="font-mono text-slate-100 font-bold text-sm">AS 15169</div>
            <div className="text-[9px] text-slate-400">Google Cloud Node</div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 truncate text-center">ANY: 192.0.2.1/32</div>
        </div>

      </div>

      {/* Control Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-4 rounded-xl border border-slate-900">
        
        {/* ISP-1 Link Controls */}
        <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-mono font-bold text-sky-400">ISP-1 (primary Fibre) Link Mapping</h4>
            <button
              onClick={() => setIsp1Active(!isp1Active)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                isp1Active 
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                  : "bg-red-500/10 border-red-500 text-red-400"
              }`}
            >
              Link: {isp1Active ? "UP" : "DOWN"}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Advertised Local Preference</span>
              <span className="text-sky-300 font-bold">{isp1LocalPref}</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="50"
              disabled={!isp1Active}
              value={isp1LocalPref}
              onChange={(e) => setIsp1LocalPref(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded disabled:opacity-30"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="prepend-isp1"
              disabled={!isp1Active}
              checked={prependIsp1}
              onChange={(e) => setPrependIsp1(e.target.checked)}
              className="rounded accent-sky-500 h-3.5 w-3.5 bg-slate-950 border-slate-700"
            />
            <label htmlFor="prepend-isp1" className="text-xs font-mono text-slate-300 cursor-pointer select-none">
              Apply Autonomous AS-Path Prepending
            </label>
            
            {prependIsp1 && (
              <select
                value={prependCount}
                onChange={(e) => setPrependCount(parseInt(e.target.value, 10))}
                className="bg-slate-950 text-[10px] font-mono border border-slate-800 rounded text-slate-200 py-0.5 px-1"
              >
                <option value={1}>1 Hops</option>
                <option value={2}>2 Hops</option>
                <option value={3}>3 Hops</option>
                <option value={4}>4 Hops</option>
              </select>
            )}
          </div>
        </div>

        {/* ISP-2 Link Controls */}
        <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-mono font-bold text-purple-400">ISP-2 (Copper Backup) Link Mapping</h4>
            <button
              onClick={() => setIsp2Active(!isp2Active)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                isp2Active 
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                  : "bg-red-500/10 border-red-500 text-red-400"
              }`}
            >
              Link: {isp2Active ? "UP" : "DOWN"}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Advertised Local Preference</span>
              <span className="text-purple-300 font-bold">{isp2LocalPref}</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="50"
              disabled={!isp2Active}
              value={isp2LocalPref}
              onChange={(e) => setIsp2LocalPref(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded disabled:opacity-30"
            />
          </div>

          <div className="text-[10px] font-mono text-slate-500 flex gap-2 pt-1 border-t border-slate-800/40 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Copper backup is standard length `/24` block allocation without prefix filters.</span>
          </div>
        </div>

      </div>

      {/* Terminal Real-Time Logging Details */}
      <div className="border border-slate-800 bg-black/80 rounded-xl overflow-hidden shadow-inner">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-mono font-bold text-slate-300">NetWP BGP Best Path Selection Engine Logs</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Route-Map Audit: OK</span>
        </div>
        <div className="p-4 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto bg-black select-all text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
          {asPathLog.map((log, index) => {
            const isRed = log.includes("CRITICAL") || log.includes("DOWN");
            const isBlue = log.includes("BEST PATH RESOLVED") || log.includes("selected");
            const isGreen = log.includes("Selected BGP AS-Path");
            return (
              <div 
                key={index} 
                className={
                  isRed 
                    ? "text-red-400" 
                    : isBlue 
                      ? "text-sky-300 font-semibold" 
                      : isGreen 
                        ? "text-emerald-400" 
                        : "text-slate-400"
                }
              >
                <span className="text-slate-600 mr-2">&gt;&gt;</span>
                {log}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
