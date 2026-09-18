import { NextResponse } from "next/server";
import { SyncService } from "@/services/syncService";
import { HistoryModel } from "../../../../../backend/src/models/historyModel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = SyncService.getState();
    const history = HistoryModel.getAll();
    return NextResponse.json({
      success: true,
      state,
      history,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, state, records, binCounts, item, senderId } = body || {};

    if (type === "update_state" && state) {
      const updatedState = SyncService.updateState(state, senderId);
      return NextResponse.json({ success: true, state: updatedState });
    }

    if (type === "sync_records" && Array.isArray(records)) {
      SyncService.syncRecords(records, binCounts, senderId);
      return NextResponse.json({ success: true, state: SyncService.getState() });
    }

    if (type === "clear_history") {
      SyncService.clearHistory(senderId);
      return NextResponse.json({ success: true, state: SyncService.getState() });
    }

    if (type === "spawn_item" && item) {
      SyncService.spawnItem(item, senderId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid sync action type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bad Request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
