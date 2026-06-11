/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { SystemLog } from "../types";
import { Activity, ShieldCheck, Cpu, HardDrive, RefreshCw } from "lucide-react";

export default function SyslogNocPanel() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [ramUsage, setRamUsage] = useState(58);
  const [trafficKbps, setTrafficKbps] = useState(128400); // 128 Mbps
  const logsRef = useRef<SystemLog[]>([]);

  // Base list of devices
  const devices = ["Core-Router-ASA", "Edge-Border-GP1", "Spine-Switch-02", "Firewall-F5-HA", "Anycast-IP-DNS"];

  // Helper static logs to pre-populate
  const seedMessages: Omit<SystemLog, 'id' | 'timestamp'>[] = [
    { device: "Core-Router-ASA", level: "INFO", message: "OSPF-5-ADJCHG: Neighbor 10.250.4.1 reset. Loading state completed." },
    { device: "Edge-Border-GP1", level: "INFO", message: "BGP-5-ADJCHANGE: neighbor 192.0.2.1 Passive session state established." },
    { device: "Firewall-F5-HA", level: "WARNING", message: "SEC-4-UNAUTHORIZED_REST: SSH Connection attempts exceeded on admin vlan." },
    { device: "Spine-Switch-02", level: "INFO", message: "STP-6-PORT_STATE: Interface GigabitEthernet2/1 forwarding mode enabled." }
  ];

  useEffect(() => {
    // Generate initial logs
    const initialList: SystemLog[] = seedMessages.map((m, index) => ({
      id: `seed-${index}`,
      timestamp: new Date(Date.now() - (index * 60000)).toLocaleTimeString(),
      ...m
    }));
    setLogs(initialList);
    logsRef.current = initialList;

    // Set up syslog ticking standard intervals
    const interval = setInterval(() => {
      // 1. Generate random logging messages
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      const logGenerators = [
        { level: "INFO", message: "PING-6-ICMP: Packet transmission latency resolved. 4 nodes active." },
        { level: "WARNING", message: "HW-4-TEMP_WARN: Fan unit #2 chassis reporting high atmospheric RPM." },
        { level: "CRITICAL", message: "BGP-3-EST_ERR: Keepalive timer expired on upstream peer link." },
        { level: "DEBUG", message: "DHCP-7-DISCOVER: Forwarding request to centralized IP management server." },
        { level: "INFO", message: "OSPF-5-ROUTE_UPDATE: Recalculated Shortest Path First algorithm for area 0.0.0.0" }
      ];
      
      const chosenLog = logGenerators[Math.floor(Math.random() * logGenerators.length)];
      
      const newLog: SystemLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        device: randomDevice,
        level: chosenLog.level as any,
        message: `${randomDevice}: ${chosenLog.message}`
      };

      const updated = [newLog, ...logsRef.current].slice(0, 50); // cap to 50
      setLogs(updated);
      logsRef.current = updated;

      // 2. Modulate NOC indicators
      setCpuUsage(prev => Math.max(10, Math.min(95, prev + (Math.random() - 0.5) * 8)));
      setRamUsage(prev => Math.max(30, Math.min(90, prev + (Math.random() - 0.5) * 3)));
      setTrafficKbps(prev => Math.max(50000, Math.min(350000, prev + (Math.random() - 0.5) * 25000)));

    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    setLogs([]);
    logsRef.current = [];
  };

  return (
    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 shadow-2xl">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">Active Operations Center (NOC) Monitor</h4>
            <p className="text-[10px] text-slate-500 font-mono">Telemetry link state & device diagnostics</p>
          </div>
        </div>
        <button 
          onClick={handleClearLogs}
          className="text-[9px] font-mono border border-slate-800 hover:border-slate-700 hover:text-slate-200 text-slate-500 rounded px-2 py-0.5 transition"
        >
          Clear Log Buffer
        </button>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 uppercase">
            <Cpu className="w-3.5 h-3.5 text-sky-400" /> CPU Core Load
          </span>
          <span className="text-lg font-mono font-bold text-slate-100 mt-1">{cpuUsage.toFixed(0)}%</span>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-sky-500 h-full transition-all duration-1000" 
              style={{ width: `${cpuUsage}%` }} 
            />
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 uppercase">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Buffer RAM
          </span>
          <span className="text-lg font-mono font-bold text-slate-100 mt-1">{ramUsage.toFixed(0)}%</span>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-purple-500 h-full transition-all duration-1000" 
              style={{ width: `${ramUsage}%` }} 
            />
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 uppercase">
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> WAN Traffic
          </span>
          <span className="text-lg font-mono font-bold text-slate-100 mt-1">{(trafficKbps / 1000).toFixed(1)} Mbps</span>
          <div className="text-[9px] font-mono text-amber-500 uppercase mt-2 tracking-widest leading-none flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping" />
            Active Sockets
          </div>
        </div>
      </div>

      {/* Streaming Terminal */}
      <div className="bg-black text-xs font-mono rounded-lg border border-slate-900 p-3 h-44 overflow-y-auto space-y-1 select-all scrollbar-thin">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-10">
            Waiting for active syslog UDP packages... (Listening to port :514)
          </div>
        ) : (
          logs.map((log) => {
            let badgeColor = "text-sky-400 bg-sky-950/20 border-sky-900/50";
            if (log.level === "WARNING") badgeColor = "text-amber-400 bg-amber-950/20 border-amber-900/50";
            if (log.level === "CRITICAL") badgeColor = "text-red-400 bg-red-950/20 border-red-900/50";
            if (log.level === "DEBUG") badgeColor = "text-slate-500 bg-slate-950/20 border-slate-900/30";

            return (
              <div key={log.id} className="flex gap-2 items-start py-0.5 border-b border-white/[0.02]">
                <span className="text-slate-600 shrink-0 text-[10px]">{log.timestamp}</span>
                <span className={`text-[10px] px-1 border rounded shrink-0 leading-none uppercase ${badgeColor}`}>
                  {log.level}
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
