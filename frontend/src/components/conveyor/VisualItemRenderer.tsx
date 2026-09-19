"use client";

import React from "react";
import type { VisualItem } from "@/lib/types";

export interface VisualItemRendererProps {
  item: VisualItem;
}

export const VisualItemRenderer: React.FC<VisualItemRendererProps> = ({ item }) => {
  const isCoca = item.brandKey === "brand_c";
  const isPepsi = item.brandKey === "brand_a";
  const isRedBull = item.brandKey === "brand_b";
  const isAquafina = item.brandKey === "brand_d";

  const yTranslate = item.yOffset || 0;
  const opacity = item.opacity ?? 1;

  return (
    <div
      key={item.id}
      className="product-sample-3d"
      style={{
        left: `${item.progress}%`,
        transform: `translate(-50%, calc(-50% + ${yTranslate}px))`,
        opacity,
        zIndex: item.deflected ? 25 : 35,
        transition: "transform 0.15s ease-out, opacity 0.2s ease-out",
      }}
    >
      {/* Bóng đổ chân thực trên mặt băng chuyền cao su */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-3 w-11 rounded-full bg-black/80 blur-[3px]" />

      {/* 1. MẪU LON COCA-COLA (Đỏ ruby ánh kim, nắp dập nổi có khoen mở nắp) */}
      {isCoca && (
        <div className="sample-coca relative flex h-14 w-9 flex-col items-center justify-between rounded-lg p-1 text-center shadow-lg overflow-hidden">
          {/* Vệt phản quang ánh kim specular dọc thân lon */}
          <div className="pointer-events-none absolute inset-y-0 left-1 w-1 rounded-full bg-white/35" />

          {/* Nắp nhôm bạc dập nổi có khoen kéo */}
          <div className="can-top-rim relative z-10 h-2.5 w-7 border border-slate-300 flex items-center justify-center">
            <div className="h-1 w-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner flex items-center justify-center">
              <div className="h-0.5 w-1 rounded-full bg-slate-600" />
            </div>
          </div>

          {/* Thân lon in chữ Coca-Cola */}
          <div className="my-auto relative z-10 font-black italic tracking-tighter text-[9px] text-white leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Coca
            <br />
            Cola
          </div>

          {/* Đáy lon dập lõm */}
          <div className="relative z-10 h-1.5 w-6 rounded-b-md bg-red-950/80 border-t border-red-900/50" />
        </div>
      )}

      {/* 2. MẪU LON PEPSI (Xanh cobalt ánh kim, logo xoáy âm dương sắc nét) */}
      {isPepsi && (
        <div className="sample-pepsi relative flex h-14 w-9 flex-col items-center justify-between rounded-lg p-1 text-center shadow-lg overflow-hidden">
          {/* Vệt phản quang ánh kim specular dọc thân lon */}
          <div className="pointer-events-none absolute inset-y-0 left-1 w-1 rounded-full bg-white/35" />

          {/* Nắp nhôm bạc dập nổi có khoen kéo */}
          <div className="can-top-rim relative z-10 h-2.5 w-7 border border-slate-300 flex items-center justify-center">
            <div className="h-1 w-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner flex items-center justify-center">
              <div className="h-0.5 w-1 rounded-full bg-slate-600" />
            </div>
          </div>

          {/* Thân lon với logo Pepsi xoáy âm dương đỏ-trắng-xanh */}
          <div className="my-auto relative z-10 flex flex-col items-center">
            <div className="relative h-4.5 w-4.5 rounded-full border border-white/80 overflow-hidden shadow-sm">
              <div className="absolute top-0 inset-x-0 h-1/2 bg-red-600" />
              <div className="absolute top-[40%] -left-1 -right-1 h-1.5 bg-white -rotate-12" />
              <div className="absolute bottom-0 inset-x-0 h-1/2 bg-blue-700" />
            </div>
            <span className="mt-0.5 text-[8px] font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              PEPSI
            </span>
          </div>

          {/* Đáy lon dập lõm */}
          <div className="relative z-10 h-1.5 w-6 rounded-b-md bg-blue-950/80 border-t border-blue-900/50" />
        </div>
      )}

      {/* 3. MẪU LON RED BULL (Vàng gold & xanh navy kim loại, khoen nắp gold) */}
      {isRedBull && (
        <div className="sample-redbull relative flex h-15 w-8 flex-col items-center justify-between rounded-md p-1 text-center shadow-lg overflow-hidden">
          {/* Vệt phản quang ánh kim specular */}
          <div className="pointer-events-none absolute inset-y-0 left-1 w-0.5 rounded-full bg-amber-200/50" />

          {/* Nắp nhôm mạ gold có khoen kéo */}
          <div className="can-top-rim relative z-10 h-2 w-6 border border-amber-300 bg-gradient-to-r from-amber-200 to-amber-400 flex items-center justify-center">
            <div className="h-0.5 w-2 rounded-full bg-amber-600 border border-amber-500" />
          </div>

          {/* Thân lon phối màu chéo vàng & xanh navy */}
          <div className="my-auto relative z-10">
            <span className="block text-[8px] font-black text-amber-200 uppercase leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              RED
              <br />
              BULL
            </span>
          </div>

          {/* Đáy lon dập lõm */}
          <div className="relative z-10 h-1.5 w-5 rounded-b-md bg-blue-950/90" />
        </div>
      )}

      {/* 4. MẪU CHAI AQUAFINA (Nhựa trong suốt có ngấn gân khúc xạ, nắp xanh) */}
      {isAquafina && (
        <div className="sample-aquafina relative flex h-16 w-8 flex-col items-center justify-between rounded-xl p-1 text-center shadow-lg">
          {/* Nắp chai nhựa xanh có gờ ren vặn */}
          <div className="relative z-10 h-2 w-3.5 rounded-t-sm bg-blue-600 border border-blue-400 shadow-sm flex items-center justify-center">
            <div className="h-0.5 w-2 bg-blue-300 rounded-full" />
          </div>

          {/* Thân chai với ngấn gân khúc xạ ánh sáng */}
          <div className="relative z-10 my-auto w-full flex flex-col items-center">
            <div className="w-5 h-[1px] bg-white/60 mb-0.5 shadow-sm" />
            <div className="w-6 h-[1px] bg-white/40 mb-1" />

            {/* Nhãn chai Aquafina */}
            <div className="w-full rounded bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 py-0.5 px-0.5 border border-white/40 shadow-xs">
              <span className="text-[6.5px] font-black tracking-tighter text-white uppercase block leading-tight drop-shadow-sm">
                AQUAFINA
              </span>
            </div>

            <div className="w-6 h-[1px] bg-white/40 mt-1" />
            <div className="w-5 h-[1px] bg-white/60 mt-0.5 shadow-sm" />
          </div>

          {/* Đáy chai nhựa 5 múi chân */}
          <div className="relative z-10 h-2 w-6 rounded-b-lg bg-sky-900/30 border-t border-sky-400/30" />
        </div>
      )}

      {/* Nhãn cảnh báo kẹt phôi trực tiếp trên vật phẩm */}
      {item.isJammed && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-rose-400 bg-rose-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-bounce z-50">
          ⚠️ KẸT PHÔI
        </div>
      )}

      {/* Nhãn cảnh báo khay đầy trực tiếp trên phôi đang dừng đợi thay khay */}
      {item.waitingForBin && !item.isJammed && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-400 bg-amber-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse z-50 flex items-center gap-1">
          <span>⚠️ KHAY {item.waitingForBin} ĐẦY</span>
        </div>
      )}

      {/* Nhãn mã phôi HUD */}
      <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/90 px-1.5 py-0.5 font-mono text-[8px] font-bold text-cyan-300 border border-cyan-500/40 shadow-xs tracking-wider">
        {item.id}
      </span>
    </div>
  );
};
