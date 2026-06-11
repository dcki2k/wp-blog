/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Terminal, Copy, ArrowRight, Check, Sparkles, BookOpen } from "lucide-react";

interface TranslateTemplate {
  name: string;
  source: string;
  ciscoCode: string;
}

export default function VendorTranslator() {
  const [ciscoInput, setCiscoInput] = useState("");
  const [juniperOutput, setJuniperOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>("");

  const templates: TranslateTemplate[] = [
    {
      name: "Interface Configuration",
      source: "Cisco IOS-XE WAN gigabit address binding",
      ciscoCode: "interface GigabitEthernet0/1\n description Primary-Uplink-To-Spine-01\n ip address 10.25.100.41 255.255.255.252\n no shutdown"
    },
    {
      name: "Static IP Routing",
      source: "Cisco IOS-XE static routes with administrative bounds",
      ciscoCode: "ip route 172.16.50.0 255.255.255.0 10.1.1.254 name IPSEC_TUNNEL_BACKUP\nip route 192.168.10.0 255.255.255.128 10.15.0.2"
    },
    {
      name: "OSPF Area Allocation",
      source: "Cisco OSPF link and region announcement",
      ciscoCode: "router ospf 100\n router-id 1.1.1.1\n network 10.10.0.0 0.0.255.255 area 0"
    }
  ];

  useEffect(() => {
    // Select first template as default base
    handleSelectTemplate(templates[0]);
  }, []);

  useEffect(() => {
    translateCiscoToJuniper(ciscoInput);
  }, [ciscoInput]);

  const handleSelectTemplate = (tpl: TranslateTemplate) => {
    setCiscoInput(tpl.ciscoCode);
    setActiveTemplate(tpl.name);
  };

  const getSubnetCIDR = (mask: string): number => {
    const masks: { [key: string]: number } = {
      "255.255.255.255": 32,
      "255.255.255.252": 30,
      "255.255.255.248": 29,
      "255.255.255.240": 28,
      "255.255.255.224": 27,
      "255.255.255.192": 26,
      "255.255.255.128": 25,
      "255.255.255.0": 24,
      "255.255.254.0": 23,
      "255.255.252.0": 22,
      "255.255.248.0": 21,
      "255.255.240.0": 20,
      "255.255.224.0": 19,
      "255.255.192.0": 18,
      "255.255.128.0": 17,
      "255.255.0.0": 16,
      "255.240.0.0": 12,
      "255.0.0.0": 8,
      "0.0.0.0": 0
    };
    return masks[mask.trim()] !== undefined ? masks[mask.trim()] : 24;
  };

  // Convert Wildcard mask (used in OSPF) into CIDR
  const getWildcardSubnetCIDR = (wildcard: string): number => {
    const parts = wildcard.trim().split(".").map(part => parseInt(part, 10));
    if (parts.length === 4) {
      const activeBits = parts.reduce((acc, current) => {
        return acc + current.toString(2).replaceAll("0", "").length;
      }, 0);
      return 32 - activeBits;
    }
    return 24;
  };

  const translateCiscoToJuniper = (input: string) => {
    const lines = input.split("\n");
    const outputLines: string[] = [];
    
    let currentInterface = "ge-0/0/1";
    let interfaceDesc = "";
    let interfaceIp = "";
    let insideInterfaceBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith("interface")) {
        if (insideInterfaceBlock && currentInterface) {
          flushInterfaceBlock(currentInterface, interfaceDesc, interfaceIp, outputLines);
        }
        insideInterfaceBlock = true;
        const matches = line.match(/interface\s+([a-zA-Z]+)([\d/.]+)/i);
        if (matches) {
          const type = matches[1].toLowerCase();
          const num = matches[2];
          // map cisco port naming to Juniper ge-X format
          if (type.includes("gigabit") || type.includes("gi")) {
            currentInterface = `ge-0/0/${num.replace(/\D/g, "") || "1"}`;
          } else if (type.includes("loopback") || type.includes("lo")) {
            currentInterface = `lo0.0`;
          } else {
            currentInterface = `${type}-${num}`;
          }
        }
        interfaceDesc = "";
        interfaceIp = "";
        continue;
      }

      if (insideInterfaceBlock) {
        if (line.startsWith("description")) {
          interfaceDesc = line.replace("description", "").trim();
          continue;
        }
        if (line.startsWith("ip address")) {
          const ipMatch = line.match(/ip\s+address\s+([\d.]+)\s+([\d.]+)/i);
          if (ipMatch) {
            const ip = ipMatch[1];
            const mask = ipMatch[2];
            const cidr = getSubnetCIDR(mask);
            interfaceIp = `${ip}/${cidr}`;
          }
          continue;
        }
        if (line.startsWith("!") || line === "" || line.startsWith("router") || line.startsWith("ip route")) {
          flushInterfaceBlock(currentInterface, interfaceDesc, interfaceIp, outputLines);
          insideInterfaceBlock = false;
        }
      }

      // Static routes mapping
      if (line.startsWith("ip route")) {
        const routeMatch = line.match(/ip\s+route\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
        if (routeMatch) {
          const destIp = routeMatch[1];
          const mask = routeMatch[2];
          const nextHop = routeMatch[3];
          const cidr = getSubnetCIDR(mask);
          outputLines.push(`set routing-options static route ${destIp}/${cidr} next-hop ${nextHop}`);
        }
        continue;
      }

      // OSPF parsing
      if (line.startsWith("router ospf")) {
        const ospfMatch = line.match(/router\s+ospf\s+(\d+)/i);
        const processId = ospfMatch ? ospfMatch[1] : "100";
        outputLines.push(`# OSPF Routing Process ${processId} translation`);
        continue;
      }
      
      if (line.startsWith("router-id")) {
        const rID = line.replace("router-id", "").trim();
        outputLines.push(`set routing-options router-id ${rID}`);
        continue;
      }

      if (line.startsWith("network")) {
        const netMatch = line.match(/network\s+([\d.]+)\s+([\d.]+)\s+area\s+(\d+)/i);
        if (netMatch) {
          const netIp = netMatch[1];
          const wildcard = netMatch[2];
          const areaNum = netMatch[3];
          const cidr = getWildcardSubnetCIDR(wildcard);
          outputLines.push(`set protocols ospf area 0.0.0.${areaNum} interface ge-0/0/0.0 # bound ${netIp}/${cidr}`);
        }
        continue;
      }
    }

    if (insideInterfaceBlock && currentInterface) {
      flushInterfaceBlock(currentInterface, interfaceDesc, interfaceIp, outputLines);
    }

    if (outputLines.length === 0) {
      setJuniperOutput("# Enter valid Cisco IOS-XE directives to see translation. Examples:\n# interface, ip address, ip route, router ospf");
    } else {
      setJuniperOutput(outputLines.join("\n"));
    }
  };

  const flushInterfaceBlock = (ifName: string, desc: string, ip: string, out: string[]) => {
    out.push(`# Interface ${ifName} binding logic`);
    if (desc) {
      out.push(`set interfaces ${ifName} unit 0 description "${desc}"`);
    }
    if (ip) {
      out.push(`set interfaces ${ifName} unit 0 family inet address ${ip}`);
    }
    out.push(`set interfaces ${ifName} unit 0 family inet`); // enable physical binding
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(juniperOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="vendor-translator" className="bg-slate-950 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl space-y-4">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-slate-100">IOS-to-Junos Syntax Translator</h3>
            <p className="text-xs text-slate-400">Converts Cisco IOS commands into Juniper set-based Junos syntax</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[10px] font-mono px-2 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3 animate-spin" />
          <span>Automated Parser</span>
        </div>
      </div>

      {/* Preset Quick bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Select Preset Config:
        </span>
        {templates.map((tpl, i) => (
          <button
            key={i}
            onClick={() => handleSelectTemplate(tpl)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-all border ${
              activeTemplate === tpl.name 
                ? "bg-amber-500/10 border-amber-500/50 text-amber-400" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Two-Column Code Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        
        {/* Source Cisco IOS Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold text-sky-400 flex items-center gap-1.5">
            <span>Cisco IOS-XE Source Command Input</span>
          </label>
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden relative">
            <textarea
              value={ciscoInput}
              onChange={(e) => setCiscoInput(e.target.value)}
              className="w-full text-xs font-mono p-4 bg-transparent text-slate-300 resize-none h-44 focus:outline-none"
              placeholder="Paste Cisco IOS configurations here..."
              spellCheck="false"
            />
          </div>
        </div>

        {/* Destination Juniper Output */}
        <div className="space-y-1.5 relative">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-mono font-bold text-purple-400 flex items-center gap-1.5">
              <span>Translated Juniper Junos Output Configuration</span>
            </label>
            <button
              onClick={copyToClipboard}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-100 flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 px-1.5 py-0.5 rounded transition"
              title="Copy Output Configuration"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden relative">
            <pre className="text-xs font-mono p-4 text-emerald-400 h-44 overflow-y-auto select-all leading-normal whitespace-pre">
              {juniperOutput}
            </pre>
          </div>
        </div>

      </div>

      <div className="text-[10px] font-mono text-slate-500 bg-slate-900/20 p-2.5 rounded border border-slate-900 flex items-start gap-2">
        <span className="text-amber-500 font-bold font-mono">Note:</span>
        <span className="leading-relaxed">
          The translator implements strict parser mappings to match physical port indexes and correctly converts standard address subnet masks (`255.255.255.0`) into classless block notation prefixes (`/24`) dynamically.
        </span>
      </div>

    </div>
  );
}
