/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { CIDRResult } from "../types";
import { Network, HelpCircle, ToggleLeft, ShieldAlert } from "lucide-react";

export default function CIDRCalculator() {
  const [ipv4, setIpv4] = useState("10.0.4.0");
  const [prefix, setPrefix] = useState(22);
  const [result, setResult] = useState<CIDRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateSubnet();
  }, [ipv4, prefix]);

  const rawIpToNum = (ip: string): number => {
    return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  const numToIp = (num: number): string => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join(".");
  };

  const calculateSubnet = () => {
    try {
      const ipParts = ipv4.split(".");
      if (ipParts.length !== 4) {
        setError("Invalid IPv4 address format (must be 4 octets).");
        return;
      }

      for (const part of ipParts) {
        const val = parseInt(part, 10);
        if (isNaN(val) || val < 0 || val > 255) {
          setError("Each IP octet must be a number between 0 and 255.");
          return;
        }
      }

      const p = Number(prefix);
      if (isNaN(p) || p < 0 || p > 32) {
        setError("Subnet CIDR prefix must be between 0 and 32.");
        return;
      }

      setError(null);
      const ipNum = rawIpToNum(ipv4);

      // In JavaScript, bitwise shift by 32 results in no operation due to 32-bit limit, so wrap in guard
      const maskNum = p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
      const networkNum = (ipNum & maskNum) >>> 0;
      const wildcardNum = (~maskNum) >>> 0;
      const broadcastNum = (networkNum | wildcardNum) >>> 0;

      const totalHosts = p >= 31 ? 0 : Math.pow(2, 32 - p) - 2;
      const firstUsableNum = p >= 31 ? networkNum : (networkNum + 1) >>> 0;
      const lastUsableNum = p >= 31 ? broadcastNum : (broadcastNum - 1) >>> 0;

      // Extract binary mask string representation
      const binaryString = [
        (maskNum >>> 24) & 255,
        (maskNum >>> 16) & 255,
        (maskNum >>> 8) & 255,
        maskNum & 255
      ].map(oct => oct.toString(2).padStart(8, "0")).join(".");

      let ipClass = "C";
      const firstOctet = parseInt(ipParts[0], 10);
      if (firstOctet >= 1 && firstOctet <= 126) ipClass = "Class A (Private/Public)";
      else if (firstOctet === 127) ipClass = "Loopback Diagnostics";
      else if (firstOctet >= 128 && firstOctet <= 191) ipClass = "Class B (Enterprise Scale)";
      else if (firstOctet >= 192 && firstOctet <= 223) ipClass = "Class C (Small Branch/SOHO)";
      else if (firstOctet >= 224 && firstOctet <= 239) ipClass = "Class D (Multicast Routing)";
      else ipClass = "Class E (Experimental)";

      setResult({
        network: numToIp(networkNum),
        netmask: numToIp(maskNum),
        wildcard: numToIp(wildcardNum),
        broadcast: numToIp(broadcastNum),
        firstUsable: numToIp(firstUsableNum),
        lastUsable: numToIp(lastUsableNum),
        totalHosts: totalHosts,
        binaryMask: binaryString,
        ipClass
      });
    } catch (err: any) {
      setError(`Subnet calculations threw an error: ${err.message || err}`);
    }
  };

  const handleQuickPreset = (ip: string, pref: number) => {
    setIpv4(ip);
    setPrefix(pref);
  };

  return (
    <div id="cidr-calculator" className="bg-slate-950 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-mono text-base font-bold text-slate-100">IPv4 CIDR Calculator & Plan Tool</h3>
          <p className="text-xs text-slate-400">Interactive local network boundary inspector</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
        <div className="md:col-span-7 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Base IP Address</label>
            <input
              type="text"
              value={ipv4}
              onChange={(e) => setIpv4(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 192.168.1.0"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Subnet Bitmask (Prefix / CIDR)</span>
              <span className="text-emerald-400 font-bold">/{prefix}</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={prefix}
              onChange={(e) => setPrefix(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-500 flex items-center">Presets:</span>
            <button
              onClick={() => handleQuickPreset("10.0.0.0", 8)}
              className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition"
            >
              /8 Private A
            </button>
            <button
              onClick={() => handleQuickPreset("172.16.0.0", 12)}
              className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition"
            >
              /12 Private B
            </button>
            <button
              onClick={() => handleQuickPreset("192.168.1.0", 24)}
              className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition"
            >
              /24 Private C
            </button>
            <button
              onClick={() => handleQuickPreset("10.250.0.0", 22)}
              className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition"
            >
              /22 Cloud Block
            </button>
            <button
              onClick={() => handleQuickPreset("192.0.2.1", 30)}
              className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition"
            >
              /30 Point-to-Point
            </button>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col justify-center bg-slate-900/60 p-4 rounded-lg border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-1">Subnet Bit Mask representation:</div>
          {result && (
            <div className="font-mono text-[11px] text-slate-300 bg-black/40 p-2 rounded border border-slate-800 select-all tracking-wider break-all leading-relaxed">
              {result.binaryMask}
            </div>
          )}
          <div className="mt-3 flex items-start gap-1.5 text-[10px] font-mono text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              The binary values represent the netmask filter logic. Green-focused bits represent routing networks, whereas 0-bits represent host assignments.
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-950/40 border border-red-900 text-red-300 rounded text-xs font-mono mb-4">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800">
          <div className="bg-slate-900/30 p-2 border border-slate-800/40 rounded">
            <div className="text-[10px] font-mono text-slate-500">Network Address ID</div>
            <div className="text-sm font-mono font-semibold text-sky-400">{result.network}</div>
          </div>
          <div className="bg-slate-900/30 p-2 border border-slate-800/40 rounded">
            <div className="text-[10px] font-mono text-slate-500">Subnet Network Mask</div>
            <div className="text-sm font-mono font-semibold text-slate-300">{result.netmask}</div>
          </div>
          <div className="bg-slate-900/30 p-2 border border-slate-800/40 rounded">
            <div className="text-[10px] font-mono text-slate-500">Wildcard Net Filter Mask</div>
            <div className="text-sm font-mono font-semibold text-amber-500/80">{result.wildcard}</div>
          </div>
          <div className="bg-slate-900/30 p-2 border border-slate-800/40 rounded">
            <div className="text-[10px] font-mono text-slate-500">Network Broadcast ID</div>
            <div className="text-sm font-mono font-semibold text-sky-400">{result.broadcast}</div>
          </div>

          <div className="bg-slate-900/40 p-2 border border-slate-800/60 rounded col-span-2">
            <div className="text-[10px] font-mono text-slate-500">Usable Routing IP Addresses Range</div>
            <div className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
              {result.totalHosts > 0 
                ? `${result.firstUsable} - ${result.lastUsable}`
                : prefix === 31 
                  ? "Point-to-point (RFC 3021), no reserved broadcast: both usable"
                  : "Host block size 1, host routing only /32"
              }
            </div>
          </div>
          <div className="bg-slate-900/30 p-2 border border-slate-800/40 rounded">
            <div className="text-[10px] font-mono text-slate-500">Total Allocatable Nodes</div>
            <div className="text-sm font-mono font-semibold text-slate-100">
              {result.totalHosts.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/30 p-2 border border-slate-800/40 rounded">
            <div className="text-[10px] font-mono text-slate-500">RFC IP Classification</div>
            <div className="text-xs font-mono font-semibold text-emerald-500 truncate">{result.ipClass}</div>
          </div>
        </div>
      )}
    </div>
  );
}
